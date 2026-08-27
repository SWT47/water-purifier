import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { db } from '../db';
import { product } from '../db/schema';
import type { Product } from '@shared/api.interface';
import { inArray, desc } from 'drizzle-orm';

const compareBodySchema = z.object({
  ids: z.array(z.string()).min(1),
});

function rowToProduct(row: typeof product.$inferSelect): Product {
  return {
    id: row.id,
    category: row.category as Product['category'],
    brand: row.brand ?? null,
    name: row.name ?? null,
    model: row.model ?? null,
    whiteBgImage: row.whiteBgImage ?? null,
    launchYear: row.launchYear ?? null,
    isOnSale: row.isOnSale ?? true,
    dailyPrice: row.dailyPrice ?? null,
    referencePrice: row.referencePrice ?? null,
    flux: row.flux ?? null,
    waterFlowRate: row.waterFlowRate ?? null,
    faucet: row.faucet ?? null,
    dimensions: row.dimensions ?? null,
    waterMode: row.waterMode ?? null,
    roMembraneBrand: row.roMembraneBrand ?? null,
    filterTotalCost: row.filterTotalCost ?? null,
    activatedCarbon: row.activatedCarbon ?? null,
    hasMaternityCert: row.hasMaternityCert ?? false,
    hasZeroStagnantWater: row.hasZeroStagnantWater ?? false,
    realImages: row.realImages ?? [],
    realVideos: row.realVideos ?? [],
    heatingElement: row.heatingElement ?? null,
    heatingCapacity: row.heatingCapacity ?? null,
    tempControl: row.tempControl ?? null,
    hasWaterTank: row.hasWaterTank ?? false,
    isAutomatic: row.isAutomatic ?? false,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function parseIdsQuery(idsParam: string | string[]): string[] {
  if (Array.isArray(idsParam)) {
    // 多个 query 参数重复时拼接
    return idsParam.flatMap((s) => s.split(',').map((x) => x.trim())).filter(Boolean);
  }
  return idsParam
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function handleGet(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const idsParam = req.query.ids;

    if (!idsParam) {
      res.status(400).json({ error: '缺少 ids 参数' });
      return;
    }

    const ids = parseIdsQuery(idsParam as string | string[]);

    if (ids.length === 0) {
      res.status(400).json({ error: 'ids 不能为空' });
      return;
    }

    const rows = await db
      .select()
      .from(product)
      .where(inArray(product.id, ids))
      .orderBy(desc(product.createdAt));

    const result: Product[] = rows.map((row) => rowToProduct(row));
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
    const parsed = compareBodySchema.safeParse(body);

    if (!parsed.success) {
      res
        .status(400)
        .json({ error: '数据验证失败', details: parsed.error.errors });
      return;
    }

    const { ids } = parsed.data;

    const rows = await db
      .select()
      .from(product)
      .where(inArray(product.id, ids))
      .orderBy(desc(product.createdAt));

    const result: Product[] = rows.map((row) => rowToProduct(row));
    res.status(200).json(result);
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
