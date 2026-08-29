import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { comboScheme } from '@server/database/schema';
import { eq, desc } from 'drizzle-orm';
import type {
  ComboScheme,
  ComboSchemeCreateInput,
  ComboSchemeUpdateInput,
} from '@shared/api.interface';

type ComboSchemeRow = typeof comboScheme.$inferSelect;

@Injectable()
export class ComboSchemeService {
  private readonly logger = new Logger(ComboSchemeService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private rowToScheme(row: ComboSchemeRow): ComboScheme {
    const numOrNull = (val: string | number | null): number | null => {
      if (val === null || val === undefined) return null;
      const n = Number(val);
      return Number.isNaN(n) ? null : n;
    };
    return {
      id: row.id,
      name: row.name,
      productIds: row.productIds ?? [],
      livePrice: numOrNull(row.livePrice),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(): Promise<ComboScheme[]> {
    const rows: ComboSchemeRow[] = await this.db
      .select()
      .from(comboScheme)
      .orderBy(desc(comboScheme.updatedAt));
    return rows.map((r: ComboSchemeRow) => this.rowToScheme(r));
  }

  async create(input: ComboSchemeCreateInput): Promise<ComboScheme> {
    if (!input.name?.trim()) {
      throw new BadRequestException('方案名称不能为空');
    }
    if (!input.productIds || input.productIds.length === 0) {
      throw new BadRequestException('至少选择一个产品');
    }
    const rows = await this.db
      .insert(comboScheme)
      .values({
        name: input.name.trim(),
        productIds: input.productIds,
        livePrice: input.livePrice != null ? String(input.livePrice) : null,
      })
      .returning();
    return this.rowToScheme(rows[0]);
  }

  async update(id: string, input: ComboSchemeUpdateInput): Promise<ComboScheme> {
    const patch: Partial<typeof comboScheme.$inferInsert> = {};
    if (input.name !== undefined) {
      if (!input.name.trim()) throw new BadRequestException('方案名称不能为空');
      patch.name = input.name.trim();
    }
    if (input.productIds !== undefined) {
      if (input.productIds.length === 0) {
        throw new BadRequestException('至少选择一个产品');
      }
      patch.productIds = input.productIds;
    }
    if (input.livePrice !== undefined) {
      patch.livePrice = input.livePrice != null ? String(input.livePrice) : null;
    }
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }
    patch.updatedAt = new Date();

    const rows = await this.db
      .update(comboScheme)
      .set(patch)
      .where(eq(comboScheme.id, id))
      .returning();
    if (rows.length === 0) {
      throw new NotFoundException('方案不存在');
    }
    return this.rowToScheme(rows[0]);
  }

  async remove(id: string): Promise<void> {
    const rows = await this.db
      .delete(comboScheme)
      .where(eq(comboScheme.id, id))
      .returning({ id: comboScheme.id });
    if (rows.length === 0) {
      throw new NotFoundException('方案不存在');
    }
  }
}
