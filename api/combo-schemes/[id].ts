import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { db } from '../../db';
import { comboScheme } from '../../db/schema';
import type { ComboScheme } from '@shared/api.interface';
import { eq } from 'drizzle-orm';

const updateSchema = z.object({
  name: z.string().min(1, '方案名称不能为空').optional(),
  productIds: z.array(z.string()).min(1, '至少选择一个产品').optional(),
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

async function handlePut(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const id = req.query.id as string;

    if (!id) {
      res.status(400).json({ error: '缺少方案 ID' });
      return;
    }

    const body = req.body ?? {};
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      res
        .status(400)
        .json({ error: '数据验证失败', details: parsed.error.errors });
      return;
    }

    const data = parsed.data;
    const patch: Record<string, unknown> = {};

    if (data.name !== undefined) {
      patch.name = data.name.trim();
    }
    if (data.productIds !== undefined) {
      patch.productIds = data.productIds;
    }
    if (data.livePrice !== undefined) {
      patch.livePrice = numericToString(data.livePrice);
    }

    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: '未提供可更新字段' });
      return;
    }

    patch.updatedAt = new Date();

    const rows = await db
      .update(comboScheme)
      .set(patch)
      .where(eq(comboScheme.id, id))
      .returning();

    if (rows.length === 0) {
      res.status(404).json({ error: '方案不存在' });
      return;
    }

    const result = rowToScheme(rows[0]);
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
}

async function handleDelete(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  try {
    const id = req.query.id as string;

    if (!id) {
      res.status(400).json({ error: '缺少方案 ID' });
      return;
    }

    const rows = await db
      .delete(comboScheme)
      .where(eq(comboScheme.id, id))
      .returning({ id: comboScheme.id });

    if (rows.length === 0) {
      res.status(404).json({ error: '方案不存在' });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method === 'PUT') {
    return handlePut(req, res);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
