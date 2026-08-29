// 搭配方案 CRUD
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db/index.js';
import { success, fail, serverError } from '../utils/response.js';
import type { ComboScheme } from '../../shared/types.js';

export const comboRouter = Router();

function rowToCombo(row: Record<string, unknown>): ComboScheme {
  return {
    id: String(row.id),
    name: String(row.name),
    productIds: row.productIds ? JSON.parse(row.productIds as string) : [],
    livePrice: row.livePrice as number | null,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

// GET /api/combo-schemes — 列表
comboRouter.get('/', (_req, res) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM combo_schemes ORDER BY createdAt DESC'
    ).all() as Record<string, unknown>[];
    const items: ComboScheme[] = rows.map(rowToCombo);
    success(res, items);
  } catch (err) {
    serverError(res, err);
  }
});

// POST /api/combo-schemes — 创建
comboRouter.post('/', (req, res) => {
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
    const productIds = body.productIds ? JSON.stringify(body.productIds) : '[]';

    db.prepare(`
      INSERT INTO combo_schemes (id, name, productIds, livePrice, createdAt, updatedAt)
      VALUES (@id, @name, @productIds, @livePrice, @createdAt, @updatedAt)
    `).run({
      id,
      name: body.name.trim(),
      productIds,
      livePrice: body.livePrice ?? null,
      createdAt: now,
      updatedAt: now,
    });

    const row = db.prepare('SELECT * FROM combo_schemes WHERE id = ?').get(id) as Record<string, unknown>;
    success(res, rowToCombo(row), '创建成功');
  } catch (err) {
    serverError(res, err);
  }
});

// PATCH /api/combo-schemes/:id — 更新
comboRouter.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body as {
      name?: string;
      productIds?: string[];
      livePrice?: number | null;
    };

    const existing = db.prepare('SELECT id FROM combo_schemes WHERE id = ?').get(id);
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
      sets.push('productIds = @productIds');
      params.productIds = JSON.stringify(body.productIds);
    }
    if (body.livePrice !== undefined) {
      sets.push('livePrice = @livePrice');
      params.livePrice = body.livePrice;
    }

    if (sets.length === 0) {
      fail(res, '未提供可更新字段');
      return;
    }

    sets.push('updatedAt = @updatedAt');
    params.updatedAt = new Date().toISOString();

    const sql = `UPDATE combo_schemes SET ${sets.join(', ')} WHERE id = @id`;
    db.prepare(sql).run(params);

    const row = db.prepare('SELECT * FROM combo_schemes WHERE id = ?').get(id) as Record<string, unknown>;
    success(res, rowToCombo(row), '更新成功');
  } catch (err) {
    serverError(res, err);
  }
});

// DELETE /api/combo-schemes/:id — 删除
comboRouter.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM combo_schemes WHERE id = ?').run(id);
    if (result.changes === 0) {
      fail(res, '搭配方案不存在', 404);
      return;
    }
    success(res, null, '删除成功');
  } catch (err) {
    serverError(res, err);
  }
});
