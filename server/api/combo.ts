// 搭配方案 CRUD
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db, getDbType } from '../db/index.js';
import { success, fail, serverError } from '../utils/response.js';
import type { ComboScheme } from '../../shared/types.js';

export const comboRouter = Router();

function rowToCombo(row: Record<string, unknown>): ComboScheme {
  return {
    id: String(row.id),
    name: String(row.name),
    productIds: parseJsonArray(row.productIds),
    livePrice: row.livePrice as number | null,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

// JSON 字段适配：SQLite 返回字符串，PostgreSQL 返回数组
function parseJsonArray(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === 'string' && val) {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }
  return [];
}

// JSON 字段写适配
function toJsonArray(val: string[] | undefined): string | string[] {
  if (!val) return getDbType() === 'postgres' ? [] : '[]';
  return getDbType() === 'postgres' ? val : JSON.stringify(val);
}

// GET /api/combo-schemes — 列表
comboRouter.get('/', async (_req, res) => {
  try {
    const rows = await db.query(
      'SELECT * FROM combo_schemes ORDER BY "createdAt" DESC'
    );
    const items: ComboScheme[] = rows.map(rowToCombo);
    success(res, items);
  } catch (err) {
    serverError(res, err);
  }
});

// POST /api/combo-schemes — 创建
comboRouter.post('/', async (req, res) => {
  try {
    const body = req.body as {
      name?: string;
      productIds?: string[];
      livePrice?: number | null;
    };

    if (!body.name || !body.name.trim()) {
      fail(res, '方案名称不能为空');
      return;
    }

    const now = new Date().toISOString();
    const id = randomUUID();
    const productIds = toJsonArray(body.productIds);

    await db.run(`
      INSERT INTO combo_schemes (id, name, "productIds", "livePrice", "createdAt", "updatedAt")
      VALUES (@id, @name, @productIds, @livePrice, @createdAt, @updatedAt)
    `, {
      id,
      name: body.name.trim(),
      productIds,
      livePrice: body.livePrice ?? null,
      createdAt: now,
      updatedAt: now,
    });

    const row = await db.get('SELECT * FROM combo_schemes WHERE id = @id', { id });
    success(res, row ? rowToCombo(row) : null, '创建成功');
  } catch (err) {
    serverError(res, err);
  }
});

// PATCH /api/combo-schemes/:id — 更新
comboRouter.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body as {
      name?: string;
      productIds?: string[];
      livePrice?: number | null;
    };

    const existing = await db.get('SELECT id FROM combo_schemes WHERE id = @id', { id });
    if (!existing) {
      fail(res, '搭配方案不存在', 404);
      return;
    }

    const sets: string[] = [];
    const params: Record<string, unknown> = { id };

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        fail(res, '方案名称不能为空');
        return;
      }
      sets.push('name = @name');
      params.name = body.name.trim();
    }
    if (body.productIds !== undefined) {
      sets.push('"productIds" = @productIds');
      params.productIds = toJsonArray(body.productIds);
    }
    if (body.livePrice !== undefined) {
      sets.push('"livePrice" = @livePrice');
      params.livePrice = body.livePrice;
    }

    if (sets.length === 0) {
      fail(res, '未提供可更新字段');
      return;
    }

    sets.push('"updatedAt" = @updatedAt');
    params.updatedAt = new Date().toISOString();

    const sql = `UPDATE combo_schemes SET ${sets.join(', ')} WHERE id = @id`;
    await db.run(sql, params);

    const row = await db.get('SELECT * FROM combo_schemes WHERE id = @id', { id });
    success(res, row ? rowToCombo(row) : null, '更新成功');
  } catch (err) {
    serverError(res, err);
  }
});

// DELETE /api/combo-schemes/:id — 删除
comboRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.run('DELETE FROM combo_schemes WHERE id = @id', { id });
    if (result.changes === 0) {
      fail(res, '搭配方案不存在', 404);
      return;
    }
    success(res, null, '删除成功');
  } catch (err) {
    serverError(res, err);
  }
});
