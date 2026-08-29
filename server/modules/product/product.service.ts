import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { product } from '@server/database/schema';
import {
  eq,
  and,
  or,
  count,
  desc,
  ilike,
  inArray,
} from 'drizzle-orm';
import type {
  Product,
  ProductCategory,
  ProductCreateInput,
  ProductListParams,
  ProductListResult,
  ImportResult,
} from '@shared/api.interface';

type ProductRow = typeof product.$inferSelect;
type ProductInsert = typeof product.$inferInsert;

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private rowToProduct(row: ProductRow): Product {
    const numOrNull = (val: string | number | null): number | null => {
      if (val === null || val === undefined) return null;
      const n = Number(val);
      return Number.isNaN(n) ? null : n;
    };

    return {
      id: row.id,
      category: row.category as ProductCategory,
      brand: row.brand ?? null,
      name: row.name ?? null,
      model: row.model ?? null,
      whiteBgImage: row.whiteBgImage ?? null,
      launchYear: row.launchYear ?? null,
      isOnSale: row.isOnSale ?? true,
      dailyPrice: numOrNull(row.dailyPrice),
      referencePrice: numOrNull(row.referencePrice),
      flux: row.flux ?? null,
      waterFlowRate: row.waterFlowRate ?? null,
      faucet: row.faucet ?? null,
      dimensions: row.dimensions ?? null,
      waterMode: row.waterMode ?? null,
      roMembraneBrand: row.roMembraneBrand ?? null,
      filterTotalCost: numOrNull(row.filterTotalCost),
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

  private inputToInsert(input: ProductCreateInput): Omit<ProductInsert, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'> {
    return {
      category: input.category,
      brand: input.brand ?? null,
      name: input.name ?? null,
      model: input.model ?? null,
      whiteBgImage: input.whiteBgImage ?? null,
      launchYear: input.launchYear ?? null,
      isOnSale: input.isOnSale ?? true,
      dailyPrice: input.dailyPrice != null ? String(input.dailyPrice) : null,
      referencePrice: input.referencePrice != null ? String(input.referencePrice) : null,
      flux: input.flux ?? null,
      waterFlowRate: input.waterFlowRate ?? null,
      faucet: input.faucet ?? null,
      dimensions: input.dimensions ?? null,
      waterMode: input.waterMode ?? null,
      roMembraneBrand: input.roMembraneBrand ?? null,
      filterTotalCost: input.filterTotalCost != null ? String(input.filterTotalCost) : null,
      activatedCarbon: input.activatedCarbon ?? null,
      hasMaternityCert: input.hasMaternityCert ?? false,
      hasZeroStagnantWater: input.hasZeroStagnantWater ?? false,
      realImages: input.realImages ?? [],
      realVideos: input.realVideos ?? [],
      heatingElement: input.heatingElement ?? null,
      heatingCapacity: input.heatingCapacity ?? null,
      tempControl: input.tempControl ?? null,
      hasWaterTank: input.hasWaterTank ?? false,
      isAutomatic: input.isAutomatic ?? false,
    };
  }

  async list(params: ProductListParams): Promise<ProductListResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (params.category) {
      conditions.push(eq(product.category, params.category));
    }
    if (params.brand) {
      conditions.push(eq(product.brand, params.brand));
    }
    if (params.isOnSale !== undefined) {
      conditions.push(eq(product.isOnSale, params.isOnSale));
    }
    if (params.keyword) {
      const kw = `%${params.keyword}%`;
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
      this.db
        .select({ count: count() })
        .from(product)
        .where(whereClause),
      this.db
        .select()
        .from(product)
        .where(whereClause)
        .orderBy(desc(product.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const items: Product[] = rows.map((row: ProductRow) => this.rowToProduct(row));

    return { items, total, page, pageSize };
  }

  async getById(id: string): Promise<Product> {
    const rows = await this.db.select().from(product).where(eq(product.id, id)).limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('产品不存在');
    }
    return this.rowToProduct(rows[0]);
  }

  async create(input: ProductCreateInput, userId: string): Promise<Product> {
    const insertData = this.inputToInsert(input);
    const rows = await this.db
      .insert(product)
      .values({
        ...insertData,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();
    return this.rowToProduct(rows[0]);
  }

  async update(id: string, patch: Partial<ProductCreateInput>, userId: string): Promise<Product> {
    const updateData: Partial<ProductInsert> = {};

    if (patch.category !== undefined) updateData.category = patch.category;
    if (patch.brand !== undefined) updateData.brand = patch.brand;
    if (patch.name !== undefined) updateData.name = patch.name;
    if (patch.model !== undefined) updateData.model = patch.model;
    if (patch.whiteBgImage !== undefined) {
      updateData.whiteBgImage = patch.whiteBgImage || null;
    }
    if (patch.launchYear !== undefined) updateData.launchYear = patch.launchYear;
    if (patch.isOnSale !== undefined) updateData.isOnSale = patch.isOnSale;
    if (patch.dailyPrice !== undefined) {
      updateData.dailyPrice = patch.dailyPrice != null ? String(patch.dailyPrice) : null;
    }
    if (patch.referencePrice !== undefined) {
      updateData.referencePrice = patch.referencePrice != null ? String(patch.referencePrice) : null;
    }
    if (patch.flux !== undefined) updateData.flux = patch.flux;
    if (patch.waterFlowRate !== undefined) updateData.waterFlowRate = patch.waterFlowRate;
    if (patch.faucet !== undefined) updateData.faucet = patch.faucet;
    if (patch.dimensions !== undefined) updateData.dimensions = patch.dimensions;
    if (patch.waterMode !== undefined) updateData.waterMode = patch.waterMode;
    if (patch.roMembraneBrand !== undefined) updateData.roMembraneBrand = patch.roMembraneBrand;
    if (patch.filterTotalCost !== undefined) {
      updateData.filterTotalCost = patch.filterTotalCost != null ? String(patch.filterTotalCost) : null;
    }
    if (patch.activatedCarbon !== undefined) updateData.activatedCarbon = patch.activatedCarbon;
    if (patch.hasMaternityCert !== undefined) updateData.hasMaternityCert = patch.hasMaternityCert;
    if (patch.hasZeroStagnantWater !== undefined) updateData.hasZeroStagnantWater = patch.hasZeroStagnantWater;
    if (patch.realImages !== undefined) {
      updateData.realImages = Array.isArray(patch.realImages) ? patch.realImages : [];
    }
    if (patch.realVideos !== undefined) {
      updateData.realVideos = Array.isArray(patch.realVideos) ? patch.realVideos : [];
    }
    if (patch.heatingElement !== undefined) updateData.heatingElement = patch.heatingElement;
    if (patch.heatingCapacity !== undefined) updateData.heatingCapacity = patch.heatingCapacity;
    if (patch.tempControl !== undefined) updateData.tempControl = patch.tempControl;
    if (patch.hasWaterTank !== undefined) updateData.hasWaterTank = patch.hasWaterTank;
    if (patch.isAutomatic !== undefined) updateData.isAutomatic = patch.isAutomatic;

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    updateData.updatedBy = userId;

    const rows = await this.db
      .update(product)
      .set(updateData)
      .where(eq(product.id, id))
      .returning();

    if (rows.length === 0) {
      throw new NotFoundException('产品不存在');
    }
    return this.rowToProduct(rows[0]);
  }

  async delete(id: string): Promise<void> {
    const rows = await this.db
      .delete(product)
      .where(eq(product.id, id))
      .returning({ id: product.id });
    if (rows.length === 0) {
      throw new NotFoundException('产品不存在');
    }
  }

  async compare(ids: string[]): Promise<Product[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    const rows = await this.db
      .select()
      .from(product)
      .where(inArray(product.id, ids))
      .orderBy(desc(product.createdAt));
    return rows.map((row: ProductRow) => this.rowToProduct(row));
  }

  async importProducts(category: ProductCategory, rows: Record<string, unknown>[]): Promise<ImportResult> {
    const total = rows.length;
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    const validRows: ProductInsert[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNum = i + 2; // 第1行是表头，所以数据从第2行开始
      try {
        const parsed = this.parseImportRow(category, row);
        validRows.push(parsed);
      } catch (err) {
        failed += 1;
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`第${lineNum}行：${msg}`);
      }
    }

    if (validRows.length > 0) {
      try {
        const inserted = await this.db
          .insert(product)
          .values(validRows)
          .returning({ id: product.id });
        success = inserted.length;
      } catch (err) {
        this.logger.error('批量插入失败', JSON.stringify(err));
        failed += validRows.length;
        errors.push('批量插入数据库失败');
      }
    }

    return { total, success, failed, errors };
  }

  private parseImportRow(category: ProductCategory, row: Record<string, unknown>): ProductInsert {
    const parseBool = (val: unknown): boolean => {
      if (typeof val === 'boolean') return val;
      if (typeof val === 'number') return val !== 0;
      if (typeof val === 'string') {
        const v = val.trim().toLowerCase();
        return v === '是' || v === 'true' || v === '1' || v === 'yes' || v === 'y';
      }
      return false;
    };

    const parseNum = (val: unknown): string | null => {
      if (val === null || val === undefined || val === '') return null;
      const n = Number(val);
      return Number.isNaN(n) ? null : String(n);
    };

    const parseStr = (val: unknown): string | null => {
      if (val === null || val === undefined) return null;
      const s = String(val).trim();
      return s === '' ? null : s;
    };

    const parseStrArray = (val: unknown): string[] => {
      if (val === null || val === undefined) return [];
      if (Array.isArray(val)) return val.map(String).filter(Boolean);
      if (typeof val === 'string') {
        return val
          .split(/[,，\n]/)
          .map((s: string) => s.trim())
          .filter(Boolean);
      }
      return [];
    };

    const name = parseStr(row.name);
    const model = parseStr(row.model);
    if (!model) {
      throw new Error('型号不能为空');
    }

    return {
      category,
      brand: parseStr(row.brand),
      name,
      model,
      whiteBgImage: parseStr(row.whiteBgImage),
      launchYear: parseStr(row.launchYear),
      isOnSale: parseBool(row.isOnSale),
      dailyPrice: parseNum(row.dailyPrice),
      referencePrice: parseNum(row.referencePrice),
      flux: parseStr(row.flux),
      waterFlowRate: parseStr(row.waterFlowRate),
      faucet: parseStr(row.faucet),
      dimensions: parseStr(row.dimensions),
      waterMode: parseStr(row.waterMode),
      roMembraneBrand: parseStr(row.roMembraneBrand),
      filterTotalCost: parseNum(row.filterTotalCost),
      activatedCarbon: parseStr(row.activatedCarbon),
      hasMaternityCert: parseBool(row.hasMaternityCert),
      hasZeroStagnantWater: parseBool(row.hasZeroStagnantWater),
      realImages: parseStrArray(row.realImages),
      realVideos: parseStrArray(row.realVideos),
      heatingElement: parseStr(row.heatingElement),
      heatingCapacity: parseStr(row.heatingCapacity),
      tempControl: parseStr(row.tempControl),
      hasWaterTank: parseBool(row.hasWaterTank),
      isAutomatic: parseBool(row.isAutomatic),
    };
  }
}
