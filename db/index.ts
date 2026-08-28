import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// DATABASE_URL 优先（Docker / CloudBase 标准），POSTGRES_URL 作为兜底（Vercel）
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL (or POSTGRES_URL) environment variable is not set',
  );
}

const client = postgres(connectionString, { max: 1 });

export const db = drizzle(client, { schema });
