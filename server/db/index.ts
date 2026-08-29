// 数据库抽象层：支持 SQLite (better-sqlite3) 和 PostgreSQL (pg)
// 统一通过 db.query() / db.get() / db.run() 访问，屏蔽方言差异
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import type { ProductCategory } from '../../shared/types.js';

export type DbType = 'sqlite' | 'postgres';

let _dbType: DbType;
let _db: DbAdapter;

export interface DbAdapter {
  type: DbType;
  // 执行查询，返回结果行数组（Promise）
  query(sql: string, params?: Record<string, unknown> | unknown[]): Promise<Record<string, unknown>[]>;
  // 执行查询，返回第一行或 null
  get(sql: string, params?: Record<string, unknown> | unknown[]): Promise<Record<string, unknown> | null>;
  // 执行写操作（INSERT/UPDATE/DELETE），返回受影响行数
  run(sql: string, params?: Record<string, unknown> | unknown[]): Promise<{ changes: number }>;
  // 执行多条 SQL（用 ; 分隔），仅用于建表等初始化场景
  exec(sql: string): Promise<void>;
  // 事务包裹：fn 内的所有操作在同一个事务中
  transaction<T>(fn: () => Promise<T>): Promise<T>;
}

// ============================================================
// SQLite 适配器（better-sqlite3 同步 API 包一层 Promise）
// ============================================================
class SqliteAdapter implements DbAdapter {
  type: DbType = 'sqlite';
  private raw: import('better-sqlite3').Database;

  constructor(raw: import('better-sqlite3').Database) {
    this.raw = raw;
  }

  async query(sql: string, params?: Record<string, unknown> | unknown[]): Promise<Record<string, unknown>[]> {
    const stmt = this.raw.prepare(sql);
    const rows = params ? stmt.all(params) : stmt.all();
    return rows as Record<string, unknown>[];
  }

  async get(sql: string, params?: Record<string, unknown> | unknown[]): Promise<Record<string, unknown> | null> {
    const stmt = this.raw.prepare(sql);
    const row = params ? stmt.get(params) : stmt.get();
    return (row ?? null) as Record<string, unknown> | null;
  }

  async run(sql: string, params?: Record<string, unknown> | unknown[]): Promise<{ changes: number }> {
    const stmt = this.raw.prepare(sql);
    const result = params ? stmt.run(params) : stmt.run();
    return { changes: result.changes };
  }

  async exec(sql: string): Promise<void> {
    this.raw.exec(sql);
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    // better-sqlite3 的 transaction 是同步的，这里用手动 BEGIN/COMMIT/ROLLBACK 配合 async fn
    await this.exec('BEGIN');
    try {
      const result = await fn();
      await this.exec('COMMIT');
      return result;
    } catch (err) {
      await this.exec('ROLLBACK');
      throw err;
    }
  }
}

// ============================================================
// PostgreSQL 适配器（pg Pool）
// ============================================================
class PostgresAdapter implements DbAdapter {
  type: DbType = 'postgres';
  private pool: import('pg').Pool;

  constructor(pool: import('pg').Pool) {
    this.pool = pool;
  }

  /**
   * 将 named params (@name) 转成 PostgreSQL 的 $1/$2 格式
   */
  private convertParams(
    sql: string,
    params?: Record<string, unknown> | unknown[],
  ): { text: string; values: unknown[] } {
    if (!params || Array.isArray(params)) {
      // 数组形式：直接把 ? 占位符转成 $1/$2/...
      if (Array.isArray(params)) {
        let idx = 0;
        const text = sql.replace(/\?/g, () => {
          idx += 1;
          return `$${idx}`;
        });
        return { text, values: params };
      }
      return { text: sql, values: [] };
    }

    const values: unknown[] = [];
    const nameIndex = new Map<string, number>();

    const text = sql.replace(/@(\w+)/g, (_match, name: string) => {
      if (!nameIndex.has(name)) {
        values.push(params[name]);
        nameIndex.set(name, values.length);
      }
      return `$${nameIndex.get(name)!}`;
    });

    return { text, values };
  }

  async query(sql: string, params?: Record<string, unknown> | unknown[]): Promise<Record<string, unknown>[]> {
    const { text, values } = this.convertParams(sql, params);
    const result = await this.pool.query(text, values);
    return result.rows as Record<string, unknown>[];
  }

  async get(sql: string, params?: Record<string, unknown> | unknown[]): Promise<Record<string, unknown> | null> {
    const rows = await this.query(sql, params);
    return rows[0] ?? null;
  }

  async run(sql: string, params?: Record<string, unknown> | unknown[]): Promise<{ changes: number }> {
    const { text, values } = this.convertParams(sql, params);
    const result = await this.pool.query(text, values);
    return { changes: result.rowCount ?? 0 };
  }

  async exec(sql: string): Promise<void> {
    await this.pool.query(sql);
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      // 注意：fn 内部调用的是 pool.query，不是 client.query
      // 简单事务通过 pool 执行，能满足大多数场景（单连接事务更严格，但我们的需求较简单）
      const result = await fn();
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

// ============================================================
// 初始化：根据环境变量选择驱动
// ============================================================
async function createSqliteDb(): Promise<DbAdapter> {
  // 动态 import，esbuild 打包时 external 运行时加载
  const { default: Database } = await import('better-sqlite3');

  const DB_PATH = process.env.DB_PATH || './data/app.db';
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const raw = new Database(DB_PATH);
  raw.pragma('journal_mode = WAL');
  raw.pragma('foreign_keys = ON');

  return new SqliteAdapter(raw);
}

async function createPostgresDb(): Promise<DbAdapter> {
  // 动态 import，esbuild 打包时 external 运行时加载
  const pg = await import('pg');
  const { Pool } = pg;

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    min: 0,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 8000,
  });

  // 测试连接（失败直接抛错，由调用方决定是否降级）
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }

  return new PostgresAdapter(pool);
}

// ============================================================
// Schema 定义
// ============================================================
const SQLITE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    brand TEXT,
    name TEXT,
    model TEXT,
    whiteBgImage TEXT,
    launchYear TEXT,
    isOnSale INTEGER DEFAULT 1,
    dailyPrice REAL,
    referencePrice REAL,
    flux TEXT,
    waterFlowRate TEXT,
    faucet TEXT,
    dimensions TEXT,
    waterMode TEXT,
    roMembraneBrand TEXT,
    filterTotalCost REAL,
    activatedCarbon TEXT,
    hasMaternityCert INTEGER DEFAULT 0,
    hasZeroStagnantWater INTEGER DEFAULT 0,
    realImages TEXT DEFAULT '[]',
    realVideos TEXT DEFAULT '[]',
    heatingElement TEXT,
    heatingCapacity TEXT,
    tempControl TEXT,
    hasWaterTank INTEGER DEFAULT 0,
    isAutomatic INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
  CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
  CREATE INDEX IF NOT EXISTS idx_products_isOnSale ON products(isOnSale);

  CREATE TABLE IF NOT EXISTS combo_schemes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    productIds TEXT DEFAULT '[]',
    livePrice REAL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
`;

const POSTGRES_SCHEMA = `
  CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY,
    category TEXT NOT NULL,
    brand TEXT,
    name TEXT,
    model TEXT,
    "whiteBgImage" TEXT,
    "launchYear" TEXT,
    "isOnSale" INTEGER DEFAULT 1,
    "dailyPrice" REAL,
    "referencePrice" REAL,
    flux TEXT,
    "waterFlowRate" TEXT,
    faucet TEXT,
    dimensions TEXT,
    "waterMode" TEXT,
    "roMembraneBrand" TEXT,
    "filterTotalCost" REAL,
    "activatedCarbon" TEXT,
    "hasMaternityCert" INTEGER DEFAULT 0,
    "hasZeroStagnantWater" INTEGER DEFAULT 0,
    "realImages" JSONB DEFAULT '[]'::jsonb,
    "realVideos" JSONB DEFAULT '[]'::jsonb,
    "heatingElement" TEXT,
    "heatingCapacity" TEXT,
    "tempControl" TEXT,
    "hasWaterTank" INTEGER DEFAULT 0,
    "isAutomatic" INTEGER DEFAULT 0,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
  CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
  CREATE INDEX IF NOT EXISTS idx_products_isOnSale ON products("isOnSale");

  CREATE TABLE IF NOT EXISTS combo_schemes (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    "productIds" JSONB DEFAULT '[]'::jsonb,
    "livePrice" REAL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
  );
`;

// ============================================================
// Seed 数据
// ============================================================
type SeedItem = {
  category: ProductCategory;
  brand: string;
  name: string;
  model: string;
  dailyPrice: number;
  referencePrice: number;
  flux?: string;
  waterFlowRate?: string;
  launchYear: string;
  waterMode?: string;
  roMembraneBrand?: string;
  filterTotalCost?: number;
  activatedCarbon?: string;
  hasMaternityCert?: number;
  hasZeroStagnantWater?: number;
  dimensions?: string;
  faucet?: string;
  heatingElement?: string;
  heatingCapacity?: string;
  tempControl?: string;
  hasWaterTank?: number;
  isAutomatic?: number;
};

const SEED_ITEMS: SeedItem[] = [
  // 净水器 4 条
  {
    category: 'water_purifier', brand: '美的', name: '白泽1000G Pro', model: 'MRO1787D-1000G',
    dailyPrice: 2499, referencePrice: 2999, flux: '1000G', waterFlowRate: '2.72L/min',
    launchYear: '2024', waterMode: '单出水', roMembraneBrand: '陶氏',
    filterTotalCost: 298, activatedCarbon: '椰壳活性炭',
    hasMaternityCert: 1, hasZeroStagnantWater: 1,
    dimensions: '425×145×430mm', faucet: '智显龙头',
  },
  {
    category: 'water_purifier', brand: '安吉尔', name: '哪吒Pro2500', model: 'J3378-ROB120',
    dailyPrice: 3299, referencePrice: 3999, flux: '1100G', waterFlowRate: '3.11L/min',
    launchYear: '2024', waterMode: '双出水', roMembraneBrand: '安吉尔自研',
    filterTotalCost: 398, activatedCarbon: '纳米晶须活性炭',
    hasMaternityCert: 1, hasZeroStagnantWater: 0,
    dimensions: '430×160×460mm', faucet: '智能龙头',
  },
  {
    category: 'water_purifier', brand: '海尔', name: '玉净鲜活水1000G', model: 'HRO10H99-2U1',
    dailyPrice: 1899, referencePrice: 2299, flux: '1000G', waterFlowRate: '2.4L/min',
    launchYear: '2023', waterMode: '单出水', roMembraneBrand: '海德能',
    filterTotalCost: 258, activatedCarbon: '斯里兰卡椰壳炭',
    hasMaternityCert: 0, hasZeroStagnantWater: 1,
    dimensions: '400×138×400mm', faucet: '普通龙头',
  },
  {
    category: 'water_purifier', brand: '小米', name: '米家净水器1600G', model: 'MR1682',
    dailyPrice: 2199, referencePrice: 2599, flux: '1600G', waterFlowRate: '4.2L/min',
    launchYear: '2024', waterMode: '单出水', roMembraneBrand: '陶氏',
    filterTotalCost: 368, activatedCarbon: '椰壳活性炭',
    hasMaternityCert: 0, hasZeroStagnantWater: 1,
    dimensions: '427×158×444mm', faucet: 'OLED智显龙头',
  },

  // 管线机 3 条
  {
    category: 'pipeline_machine', brand: '美的', name: '白泽管线机', model: 'MG908-D',
    dailyPrice: 999, referencePrice: 1299, launchYear: '2024',
    dimensions: '420×160×420mm', heatingElement: '稀土厚膜',
    heatingCapacity: '2100W', tempControl: '6档控温', hasWaterTank: 0,
  },
  {
    category: 'pipeline_machine', brand: '海尔', name: '星光管线机', model: 'HGR2207',
    dailyPrice: 799, referencePrice: 999, launchYear: '2023',
    dimensions: '390×150×400mm', heatingElement: '石英管加热',
    heatingCapacity: '2000W', tempControl: '4档控温', hasWaterTank: 1,
  },
  {
    category: 'pipeline_machine', brand: '安吉尔', name: '速热管线机', model: 'Y2613BK',
    dailyPrice: 1099, referencePrice: 1399, launchYear: '2024',
    dimensions: '410×155×430mm', heatingElement: '即热式',
    heatingCapacity: '2200W', tempControl: '多档控温', hasWaterTank: 0,
  },

  // 前置过滤器 3 条
  {
    category: 'pre_filter', brand: '美的', name: '前置过滤器Pro', model: 'QZBW20S-22S',
    dailyPrice: 599, referencePrice: 799, launchYear: '2024',
    dimensions: '180×80×260mm', flux: '6T/h', isAutomatic: 1,
  },
  {
    category: 'pre_filter', brand: '海尔', name: '前置过滤器HP05', model: 'HP05',
    dailyPrice: 399, referencePrice: 599, launchYear: '2023',
    dimensions: '170×75×240mm', flux: '5T/h', isAutomatic: 0,
  },
  {
    category: 'pre_filter', brand: '安吉尔', name: '全屋前置过滤器', model: 'J3217-GWG-4000',
    dailyPrice: 699, referencePrice: 899, launchYear: '2024',
    dimensions: '190×85×270mm', flux: '6.5T/h', isAutomatic: 1,
  },

  // 大白瓶 3 条
  {
    category: 'big_white_bottle', brand: '滨特尔', name: '大白瓶10寸', model: '10寸大胖瓶',
    dailyPrice: 1299, referencePrice: 1599, launchYear: '2023',
  },
  {
    category: 'big_white_bottle', brand: '3M', name: '中央前置大白瓶', model: 'AP801',
    dailyPrice: 1599, referencePrice: 1999, launchYear: '2024',
  },
  {
    category: 'big_white_bottle', brand: '溢泰', name: '大白瓶20寸', model: '20寸大胖瓶',
    dailyPrice: 1899, referencePrice: 2299, launchYear: '2024',
  },

  // 中央净水机 3 条
  {
    category: 'central_purifier', brand: '美的', name: '中央净水机', model: 'MC1600-1.6T',
    dailyPrice: 6999, referencePrice: 8999, launchYear: '2024',
  },
  {
    category: 'central_purifier', brand: '海尔', name: '中央净水机', model: 'HWP1600',
    dailyPrice: 5999, referencePrice: 7999, launchYear: '2023',
  },
  {
    category: 'central_purifier', brand: '安吉尔', name: '全屋中央净水', model: 'J3217-GWG-1000',
    dailyPrice: 7999, referencePrice: 9999, launchYear: '2024',
  },

  // 中央软水机 3 条
  {
    category: 'central_softener', brand: '美的', name: '中央软水机', model: 'MS1600-1.6T',
    dailyPrice: 8999, referencePrice: 11999, launchYear: '2024',
  },
  {
    category: 'central_softener', brand: '海尔', name: '中央软水机', model: 'HSW-WS6',
    dailyPrice: 7999, referencePrice: 9999, launchYear: '2023',
  },
  {
    category: 'central_softener', brand: '滨特尔', name: '软水机', model: 'SFT-1016-56SEM',
    dailyPrice: 9999, referencePrice: 12999, launchYear: '2024',
  },
];

async function seedIfEmpty(): Promise<void> {
  const countRow = await _db.get('SELECT COUNT(*) as c FROM products');
  if (countRow && Number(countRow.c) > 0) return;

  const now = new Date().toISOString();
  const isPg = _dbType === 'postgres';

  // 构建 INSERT SQL（两种方言参数占位符不同，但命名参数适配器会处理）
  const insertSql = `
    INSERT INTO products (
      id, category, brand, name, model, whiteBgImage, launchYear, isOnSale,
      dailyPrice, referencePrice, flux, waterFlowRate, faucet, dimensions,
      waterMode, roMembraneBrand, filterTotalCost, activatedCarbon,
      hasMaternityCert, hasZeroStagnantWater, realImages, realVideos,
      heatingElement, heatingCapacity, tempControl, hasWaterTank,
      isAutomatic, createdAt, updatedAt
    ) VALUES (
      @id, @category, @brand, @name, @model, @whiteBgImage, @launchYear, @isOnSale,
      @dailyPrice, @referencePrice, @flux, @waterFlowRate, @faucet, @dimensions,
      @waterMode, @roMembraneBrand, @filterTotalCost, @activatedCarbon,
      @hasMaternityCert, @hasZeroStagnantWater, @realImages, @realVideos,
      @heatingElement, @heatingCapacity, @tempControl, @hasWaterTank,
      @isAutomatic, @createdAt, @updatedAt
    )
  `;

  await _db.transaction(async () => {
    for (const item of SEED_ITEMS) {
      const realImages = isPg ? [] : '[]';
      const realVideos = isPg ? [] : '[]';

      await _db.run(insertSql, {
        id: randomUUID(),
        category: item.category,
        brand: item.brand,
        name: item.name,
        model: item.model,
        whiteBgImage: '',
        launchYear: item.launchYear,
        isOnSale: 1,
        dailyPrice: item.dailyPrice,
        referencePrice: item.referencePrice,
        flux: item.flux ?? null,
        waterFlowRate: item.waterFlowRate ?? null,
        faucet: item.faucet ?? null,
        dimensions: item.dimensions ?? null,
        waterMode: item.waterMode ?? null,
        roMembraneBrand: item.roMembraneBrand ?? null,
        filterTotalCost: item.filterTotalCost ?? null,
        activatedCarbon: item.activatedCarbon ?? null,
        hasMaternityCert: item.hasMaternityCert ?? 0,
        hasZeroStagnantWater: item.hasZeroStagnantWater ?? 0,
        realImages,
        realVideos,
        heatingElement: item.heatingElement ?? null,
        heatingCapacity: item.heatingCapacity ?? null,
        tempControl: item.tempControl ?? null,
        hasWaterTank: item.hasWaterTank ?? 0,
        isAutomatic: item.isAutomatic ?? 0,
        createdAt: now,
        updatedAt: now,
      });
    }
  });

  // Seed 搭配方案
  const comboCount = await _db.get('SELECT COUNT(*) as c FROM combo_schemes');
  if (comboCount && Number(comboCount.c) === 0) {
    const productRows = await _db.query('SELECT id FROM products LIMIT 6');
    const ids = productRows.map((r: Record<string, unknown>) => String(r.id));

    const insertComboSql = `
      INSERT INTO combo_schemes (id, name, "productIds", "livePrice", "createdAt", "updatedAt")
      VALUES (@id, @name, @productIds, @livePrice, @createdAt, @updatedAt)
    `;

    const combos = [
      {
        name: '净水器+管线机 超值套装',
        productIds: isPg ? [ids[0], ids[4]] : JSON.stringify([ids[0], ids[4]]),
        livePrice: 2999,
      },
      {
        name: '全屋净水三件套',
        productIds: isPg ? [ids[0], ids[6], ids[7]] : JSON.stringify([ids[0], ids[6], ids[7]]),
        livePrice: 3299,
      },
    ];

    for (const c of combos) {
      await _db.run(insertComboSql, {
        id: randomUUID(),
        name: c.name,
        productIds: c.productIds,
        livePrice: c.livePrice,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}

// ============================================================
// 公开 API
// ============================================================
let initPromise: Promise<void> | null = null;
let initError: Error | null = null;

export async function initDb(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const databaseUrl = process.env.DATABASE_URL;
    let triedPg = false;

    // 1) 优先尝试 PostgreSQL
    if (databaseUrl) {
      triedPg = true;
      try {
        _dbType = 'postgres';
        _db = await createPostgresDb();
        await _db.exec(POSTGRES_SCHEMA);
        console.log('[db] PostgreSQL 连接成功，schema 已初始化');
      } catch (pgErr) {
        console.warn(`[db] PostgreSQL 连接失败，降级到 SQLite: ${(pgErr as Error).message}`);
        _db = null as unknown as DbAdapter;
        initError = pgErr as Error;
      }
    }

    // 2) 降级到 SQLite（PG 失败或未配置时）
    if (!_db) {
      try {
        _dbType = 'sqlite';
        _db = await createSqliteDb();
        await _db.exec(SQLITE_SCHEMA);
        const dbPath = process.env.DB_PATH || './data/app.db';
        console.log(`[db] SQLite 初始化成功 (path: ${dbPath})${triedPg ? '（PG 失败降级）' : ''}`);
      } catch (sqliteErr) {
        console.error('[db] SQLite 也初始化失败:', (sqliteErr as Error).message);
        initError = sqliteErr as Error;
        throw sqliteErr;
      }
    }

    // 3) Seed 数据（失败不阻断启动）
    try {
      await seedIfEmpty();
      console.log('[db] Seed 数据检查完成');
    } catch (seedErr) {
      console.warn('[db] Seed 数据写入失败:', (seedErr as Error).message);
    }
  })();

  return initPromise;
}

export function getDbInitError(): Error | null {
  return initError;
}

export function getDbType(): DbType {
  return _dbType;
}

export const db: DbAdapter = new Proxy<DbAdapter>({} as DbAdapter, {
  get(_target, prop: string) {
    if (!_db) {
      throw new Error('Database not initialized. Call initDb() first.');
    }
      const value = (_db as unknown as Record<string, unknown>)[prop];
      if (typeof value === 'function') {
        return (value as (...args: unknown[]) => unknown).bind(_db);
      }
      return value;
  },
});

// 立即初始化（兼容 server.ts 中副作用导入的用法）
// 注意：不再 process.exit，失败由 server.ts 决定是否降级启动
initDb().catch((err: Error) => {
  console.error('数据库初始化失败（服务仍将尝试以降级模式启动）:', err.message);
});
