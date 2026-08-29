// SQLite 数据库初始化 + schema + seed 数据
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import type { ProductCategory } from '../../shared/types.js';

const DB_PATH = process.env.DB_PATH || './data/app.db';

// 确保数据目录存在
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 建表
db.exec(`
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
`);

// Seed 示例数据（每个类目 3-5 条）
function seedIfEmpty(): void {
  const countRow = db.prepare('SELECT COUNT(*) as c FROM products').get() as { c: number };
  if (countRow.c > 0) return;

  const now = new Date().toISOString();
  const insert = db.prepare(`
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
  `);

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

  const items: SeedItem[] = [
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

  const insertMany = db.transaction((list: SeedItem[]) => {
    for (const item of list) {
      insert.run({
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
        realImages: '[]',
        realVideos: '[]',
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

  insertMany(items);

  // Seed 搭配方案
  const comboCount = db.prepare('SELECT COUNT(*) as c FROM combo_schemes').get() as { c: number };
  if (comboCount.c === 0) {
    // 取前几条产品ID来造搭配
    const productIds = db.prepare('SELECT id FROM products LIMIT 6').all() as { id: string }[];
    const ids = productIds.map((p: { id: string }) => p.id);

    const insertCombo = db.prepare(`
      INSERT INTO combo_schemes (id, name, productIds, livePrice, createdAt, updatedAt)
      VALUES (@id, @name, @productIds, @livePrice, @createdAt, @updatedAt)
    `);

    const combos = [
      {
        name: '净水器+管线机 超值套装',
        productIds: JSON.stringify([ids[0], ids[4]]),
        livePrice: 2999,
      },
      {
        name: '全屋净水三件套',
        productIds: JSON.stringify([ids[0], ids[6], ids[7]]),
        livePrice: 3299,
      },
    ];

    for (const c of combos) {
      insertCombo.run({
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

seedIfEmpty();
