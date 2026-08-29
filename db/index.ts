import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// DATABASE_URL 优先（Docker / CloudBase 标准），POSTGRES_URL 作为兜底（Vercel）
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

let realDb: PostgresJsDatabase<typeof schema> | null = null;
let initError: Error | null = null;
let initPromise: Promise<PostgresJsDatabase<typeof schema> | null> | null = null;

/**
 * 初始化数据库连接（带错误捕获，失败返回 null 而不抛错）
 */
async function initDb(): Promise<PostgresJsDatabase<typeof schema> | null> {
  if (realDb) return realDb;
  if (initPromise) return initPromise;

  if (!connectionString) {
    initError = new Error(
      'DATABASE_URL (or POSTGRES_URL) environment variable is not set',
    );
    console.error('[db]', initError.message);
    initPromise = Promise.resolve(null);
    return null;
  }

  initPromise = (async () => {
    try {
      const sql = postgres(connectionString, {
        max: 10,
        idle_timeout: 30,
        connect_timeout: 15,
        max_lifetime: 60 * 30,
      });

      // 测试连接
      await sql`SELECT 1`;

      realDb = drizzle(sql, { schema });
      console.log('[db] PostgreSQL 连接成功');
      return realDb;
    } catch (err) {
      initError = err as Error;
      console.error('[db] PostgreSQL 连接失败:', (err as Error).message);
      console.error('[db] 错误详情:', (err as Error).stack);
      return null;
    }
  })();

  return initPromise;
}

function getDbInitError(): Error | null {
  return initError;
}

function isDbReady(): boolean {
  return realDb !== null;
}

// Proxy 包装：导入时立即可用，真正访问时才检查状态
const db = new Proxy<PostgresJsDatabase<typeof schema>>({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop: string | symbol) {
    if (!realDb) {
      const msg = initError
        ? `数据库未就绪: ${initError.message}`
        : '数据库未初始化，请先调用 initDb()';
      throw new Error(msg);
    }
    const value = (realDb as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(realDb);
    }
    return value;
  },
});

export { db, initDb, getDbInitError, isDbReady };
export default db;
