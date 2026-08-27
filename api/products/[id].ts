import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { db } from '../../db';
import { product } from '../../db/schema';
import type { Product } from '@shared/api.interface';
import { eq } from 'drizzle-orm';

const productUpdateSchema = z.object({
  category: z
    .enum([
      'water_purifier',
      'pipeline_machine',
      'pre_filter',
      'big_white_bottle',
      'central_purifier',
      'central_softener',
    ])
    .optional(),
  brand: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  whiteBgImage: z.string().nullable().optional(),
  launchYear: z.string().nullable().optional(),
  isOnSale: z.boolean().optional(),
  dailyPrice: z.union([z.string(), z.number()]).nullable().optional(),
  referencePrice: z.union([z.string(), z.number()]).nullable().optional(),
  flux: z.string().nullable().optional(),
  waterFlowRate: z.string().nullable().optional(),
  faucet: z.string().nullable().optional(),
  dimensions: z.string().nullable().optional(),
  waterMode: z.string().nullable().optional(),
  roMembraneBrand: z.string().nullable().optional(),
  filterTotalCost: z.union([z.string(), z.number()]).nullable().optional(),
  activatedCarbon: z.string().nullable().optional(),
  hasMaternityCert: z.boolean().optional(),
  hasZeroStagnantWater: z.boolean().optional(),
  realImages: z.array(z.string()).optional(),
  realVideos: z.array(z.string()).optional(),
  heatingElement: z.string().nullable().optional(),
  heatingCapacity: z.string().nullable().optional(),
  tempControl: z.string().nullable().optional(),
  hasWaterTank: z.boolean().optional(),
  isAutomatic: z.boolean().optional(),
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

function numericToString(
  val: string | number | null | undefined,
): string | null {
  if (val === null || val === undefined) return null;
  return String(val);
}

async function handleGet(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const id = req.query.id as string;

    if (!id) {
      res.status(400).json({ error: '缺少产品 ID' });
      return;
    }

    const rows = await db
      .select()
      .from(product)
      .where(eq(product.id, id))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: '产品不存在' });
      return;
    }

    const result = rowToProduct(rows[0]);
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
}

async function handlePatch(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  try {
    const id = req.query.id as string;

    if (!id) {
      res.status(400).json({ error: '缺少产品 ID' });
      return;
    }

    const body = req.body ?? {};
    const parsed = productUpdateSchema.safeParse(body);

    if (!parsed.success) {
      res
        .status(400)
        .json({ error: '数据验证失败', details: parsed.error.errors });
      return;
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (data.category !== undefined) updateData.category = data.category;
    if (data.brand !== undefined) updateData.brand = data.brand;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.whiteBgImage !== undefined)
      updateData.whiteBgImage = data.whiteBgImage;
    if (data.launchYear !== undefined) updateData.launchYear = data.launchYear;
    if (data.isOnSale !== undefined) updateData.isOnSale = data.isOnSale;
    if (data.dailyPrice !== undefined)
      updateData.dailyPrice = numericToString(data.dailyPrice);
    if (data.referencePrice !== undefined)
      updateData.referencePrice = numericToString(data.referencePrice);
    if (data.flux !== undefined) updateData.flux = data.flux;
    if (data.waterFlowRate !== undefined)
      updateData.waterFlowRate = data.waterFlowRate;
    if (data.faucet !== undefined) updateData.faucet = data.faucet;
    if (data.dimensions !== undefined) updateData.dimensions = data.dimensions;
    if (data.waterMode !== undefined) updateData.waterMode = data.waterMode;
    if (data.roMembraneBrand !== undefined)
      updateData.roMembraneBrand = data.roMembraneBrand;
    if (data.filterTotalCost !== undefined)
      updateData.filterTotalCost = numericToString(data.filterTotalCost);
    if (data.activatedCarbon !== undefined)
      updateData.activatedCarbon = data.activatedCarbon;
    if (data.hasMaternityCert !== undefined)
      updateData.hasMaternityCert = data.hasMaternityCert;
    if (data.hasZeroStagnantWater !== undefined)
      updateData.hasZeroStagnantWater = data.hasZeroStagnantWater;
    if (data.realImages !== undefined) updateData.realImages = data.realImages;
    if (data.realVideos !== undefined) updateData.realVideos = data.realVideos;
    if (data.heatingElement !== undefined)
      updateData.heatingElement = data.heatingElement;
    if (data.heatingCapacity !== undefined)
      updateData.heatingCapacity = data.heatingCapacity;
    if (data.tempControl !== undefined) updateData.tempControl = data.tempControl;
    if (data.hasWaterTank !== undefined)
      updateData.hasWaterTank = data.hasWaterTank;
    if (data.isAutomatic !== undefined)
      updateData.isAutomatic = data.isAutomatic;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: '未提供可更新字段' });
      return;
    }

    updateData.updatedAt = new Date();

    const rows = await db
      .update(product)
      .set(updateData)
      .where(eq(product.id, id))
      .returning();

    if (rows.length === 0) {
      res.status(404).json({ error: '产品不存在' });
      return;
    }

    const result = rowToProduct(rows[0]);
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
      res.status(400).json({ error: '缺少产品 ID' });
      return;
    }

    const rows = await db
      .delete(product)
      .where(eq(product.id, id))
      .returning({ id: product.id });

    if (rows.length === 0) {
      res.status(404).json({ error: '产品不存在' });
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
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'PATCH') {
    return handlePatch(req, res);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
