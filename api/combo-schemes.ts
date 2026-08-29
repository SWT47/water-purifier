import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { db } from '../db';
import { comboScheme } from '../db/schema';
import type { ComboScheme } from '@shared/api.interface';
import { desc } from 'drizzle-orm';

const createSchema = z.object({
  name: z.string().min(1, '方案名称不能为空'),
  productIds: z.array(z.string()).min(1, '至少选择一个产品'),
  livePrice: z.union([z.string(), z.number()]).nullable().optional(),
});

function rowToScheme(row: typeof comboScheme.$inferSelect): ComboScheme {
  return {
    id: row.id,
    name: row.name,
    productIds: row.productIds ?? [],
    livePrice: row.livePrice ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function numericToString(
  val: string | number | null | undefined,
): string | null {
  if (val === null || val === undefined) return null;
  return String(val);
}

async function handleGet(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const rows = await db
      .select()
      .from(comboScheme)
      .orderBy(desc(comboScheme.createdAt));

    const result: ComboScheme[] = rows.map((row) => rowToScheme(row));
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
}

async function handlePost(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  try {
    const body = req.body ?? {};
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      res
        .status(400)
        .json({ error: '数据验证失败', details: parsed.error.errors });
      return;
    }

    const { name, productIds, livePrice } = parsed.data;

    const rows = await db
      .insert(comboScheme)
      .values({
        name: name.trim(),
        productIds,
        livePrice: numericToString(livePrice),
      })
      .returning();

    const newScheme = rowToScheme(rows[0]);
    res.status(201).json(newScheme);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
