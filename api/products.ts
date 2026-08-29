import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { db } from '../db';
import { product } from '../db/schema';
import type { Product, ProductListResult } from '@shared/api.interface';
import {
  eq,
  and,
  or,
  count,
  desc,
  ilike,
  inArray,
} from 'drizzle-orm';

const productCreateSchema = z.object({
  category: z.enum([
    'water_purifier',
    'pipeline_machine',
    'pre_filter',
    'big_white_bottle',
    'central_purifier',
    'central_softener',
  ]),
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
    const {
      category,
      keyword,
      brand,
      isOnSale,
      page = '1',
      pageSize = '20',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSizeNum = Math.min(
      100,
      Math.max(1, parseInt(pageSize as string, 10) || 20),
    );
    const offset = (pageNum - 1) * pageSizeNum;

    const conditions = [];

    // category 支持多选（逗号分隔）
    if (category && typeof category === 'string') {
      const categories = category
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
      if (categories.length > 0) {
        conditions.push(inArray(product.category, categories));
      }
    }

    if (brand && typeof brand === 'string') {
      conditions.push(eq(product.brand, brand));
    }

    if (isOnSale !== undefined && isOnSale !== '') {
      const val = isOnSale === 'true' || isOnSale === '1';
      conditions.push(eq(product.isOnSale, val));
    }

    if (keyword && typeof keyword === 'string') {
      const kw = `%${keyword}%`;
      conditions.push(
        or(
          ilike(product.name, kw),
          ilike(product.model, kw),
          ilike(product.brand, kw),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, rows] = await Promise.all([
      db.select({ count: count() }).from(product).where(whereClause),
      db
        .select()
        .from(product)
        .where(whereClause)
        .orderBy(desc(product.createdAt))
        .limit(pageSizeNum)
        .offset(offset),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const items: Product[] = rows.map((row) => rowToProduct(row));

    const result: ProductListResult = {
      items,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
    };

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
    const parsed = productCreateSchema.safeParse(body);

    if (!parsed.success) {
      res
        .status(400)
        .json({ error: '数据验证失败', details: parsed.error.errors });
      return;
    }

    const data = parsed.data;

    const insertData = {
      category: data.category,
      brand: data.brand ?? null,
      name: data.name ?? null,
      model: data.model ?? null,
      whiteBgImage: data.whiteBgImage ?? null,
      launchYear: data.launchYear ?? null,
      isOnSale: data.isOnSale ?? true,
      dailyPrice: numericToString(data.dailyPrice),
      referencePrice: numericToString(data.referencePrice),
      flux: data.flux ?? null,
      waterFlowRate: data.waterFlowRate ?? null,
      faucet: data.faucet ?? null,
      dimensions: data.dimensions ?? null,
      waterMode: data.waterMode ?? null,
      roMembraneBrand: data.roMembraneBrand ?? null,
      filterTotalCost: numericToString(data.filterTotalCost),
      activatedCarbon: data.activatedCarbon ?? null,
      hasMaternityCert: data.hasMaternityCert ?? false,
      hasZeroStagnantWater: data.hasZeroStagnantWater ?? false,
      realImages: data.realImages ?? [],
      realVideos: data.realVideos ?? [],
      heatingElement: data.heatingElement ?? null,
      heatingCapacity: data.heatingCapacity ?? null,
      tempControl: data.tempControl ?? null,
      hasWaterTank: data.hasWaterTank ?? false,
      isAutomatic: data.isAutomatic ?? false,
    };

    const rows = await db.insert(product).values(insertData).returning();
    const newProduct = rowToProduct(rows[0]);

    res.status(201).json(newProduct);
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
