// 产品 CRUD + 列表分页 + 批量删除 + Excel 导入
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import xlsx from 'xlsx';
import { db } from '../db/index.js';
import { success, fail, serverError } from '../utils/response.js';
import { EXCEL_COLUMN_MAP } from '../../shared/types.js';
import type { Product, ProductCategory, ProductListResult } from '../../shared/types.js';

export const productsRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

// 数据库行 → 产品对象（解析 JSON 字段、转换 boolean）
function rowToProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    category: row.category as ProductCategory,
    brand: row.brand as string | null,
    name: row.name as string | null,
    model: row.model as string | null,
    whiteBgImage: row.whiteBgImage as string | null,
    launchYear: row.launchYear as string | null,
    isOnSale: Boolean(row.isOnSale),
    dailyPrice: row.dailyPrice as number | null,
    referencePrice: row.referencePrice as number | null,
    flux: row.flux as string | null,
    waterFlowRate: row.waterFlowRate as string | null,
    faucet: row.faucet as string | null,
    dimensions: row.dimensions as string | null,
    waterMode: row.waterMode as string | null,
    roMembraneBrand: row.roMembraneBrand as string | null,
    filterTotalCost: row.filterTotalCost as number | null,
    activatedCarbon: row.activatedCarbon as string | null,
    hasMaternityCert: Boolean(row.hasMaternityCert),
    hasZeroStagnantWater: Boolean(row.hasZeroStagnantWater),
    realImages: row.realImages ? JSON.parse(row.realImages as string) : [],
    realVideos: row.realVideos ? JSON.parse(row.realVideos as string) : [],
    heatingElement: row.heatingElement as string | null,
    heatingCapacity: row.heatingCapacity as string | null,
    tempControl: row.tempControl as string | null,
    hasWaterTank: Boolean(row.hasWaterTank),
    isAutomatic: Boolean(row.isAutomatic),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

// GET /api/products — 列表分页
productsRouter.get('/', (req, res) => {
  try {
    const {
      category,
      keyword,
      brand,
      isOnSale,
      page = '1',
      pageSize = '10',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string, 10) || 10));
    const offset = (pageNum - 1) * pageSizeNum;

    const whereClauses: string[] = [];
    const params: Record<string, unknown> = {};

    if (category) {
      whereClauses.push('category = @category');
      params.category = category;
    }
    if (brand) {
      whereClauses.push('brand = @brand');
      params.brand = brand;
    }
    if (isOnSale !== undefined && isOnSale !== '') {
      whereClauses.push('isOnSale = @isOnSale');
      params.isOnSale = isOnSale === 'true' || isOnSale === '1' ? 1 : 0;
    }
    if (keyword) {
      whereClauses.push('(name LIKE @kw OR model LIKE @kw OR brand LIKE @kw)');
      params.kw = `%${keyword}%`;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = db.prepare(`SELECT COUNT(*) as c FROM products ${whereSql}`).get(params) as { c: number };
    const total = countRow.c;

    const rows = db.prepare(
      `SELECT * FROM products ${whereSql} ORDER BY createdAt DESC LIMIT @limit OFFSET @offset`
    ).all({ ...params, limit: pageSizeNum, offset }) as Record<string, unknown>[];

    const items: Product[] = rows.map(rowToProduct);

    const result: ProductListResult = {
      items,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
    };

    success(res, result);
  } catch (err) {
    serverError(res, err);
  }
});

// GET /api/products/:id — 详情
productsRouter.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) {
      fail(res, '产品不存在', 404);
      return;
    }
    success(res, rowToProduct(row));
  } catch (err) {
    serverError(res, err);
  }
});

// POST /api/products — 创建
productsRouter.post('/', (req, res) => {
  try {
    const body = req.body as Partial<Product> & { category?: ProductCategory };
    if (!body.category) {
      fail(res, '类目不能为空');
      return;
    }

    const now = new Date().toISOString();
    const id = randomUUID();

    const realImages = body.realImages ? JSON.stringify(body.realImages) : '[]';
    const realVideos = body.realVideos ? JSON.stringify(body.realVideos) : '[]';

    db.prepare(`
      INSERT INTO products (
        id, category, brand, name, model, whiteBgImage, launchYear, isOnSale,
        dailyPrice, referencePrice, flux, waterFlowRate, faucet, dimensions,
        waterMode, roMembraneBrand, filterTotalCost, activatedCarbon,
        hasMaternityCert, hasZeroStagnantWater, realImages, realVideos,
        heatingElement, heatingCapacity, tempControl, hasWaterTank,
        isAutomatic, createdAt, updatedAt
      ) VALUES (
        @id, @category, @brand, @name, @model, @whiteBgImage, @launchYear, @isOnSale,
        @dailyPrice, @referencePrice, @flux, @waterFlowRate, @faucet, @dimensions,
        @waterMode, @roMembraneBrand, @filterTotalCost, @activatedCarbon,
        @hasMaternityCert, @hasZeroStagnantWater, @realImages, @realVideos,
        @heatingElement, @heatingCapacity, @tempControl, @hasWaterTank,
        @isAutomatic, @createdAt, @updatedAt
      )
    `).run({
      id,
      category: body.category,
      brand: body.brand ?? null,
      name: body.name ?? null,
      model: body.model ?? null,
      whiteBgImage: body.whiteBgImage ?? null,
      launchYear: body.launchYear ?? null,
      isOnSale: body.isOnSale !== undefined ? (body.isOnSale ? 1 : 0) : 1,
      dailyPrice: body.dailyPrice ?? null,
      referencePrice: body.referencePrice ?? null,
      flux: body.flux ?? null,
      waterFlowRate: body.waterFlowRate ?? null,
      faucet: body.faucet ?? null,
      dimensions: body.dimensions ?? null,
      waterMode: body.waterMode ?? null,
      roMembraneBrand: body.roMembraneBrand ?? null,
      filterTotalCost: body.filterTotalCost ?? null,
      activatedCarbon: body.activatedCarbon ?? null,
      hasMaternityCert: body.hasMaternityCert ? 1 : 0,
      hasZeroStagnantWater: body.hasZeroStagnantWater ? 1 : 0,
      realImages,
      realVideos,
      heatingElement: body.heatingElement ?? null,
      heatingCapacity: body.heatingCapacity ?? null,
      tempControl: body.tempControl ?? null,
      hasWaterTank: body.hasWaterTank ? 1 : 0,
      isAutomatic: body.isAutomatic ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    });

    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Record<string, unknown>;
    success(res, rowToProduct(row), '创建成功');
  } catch (err) {
    serverError(res, err);
  }
});

// PATCH /api/products/:id — 更新
productsRouter.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body as Partial<Product>;

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!existing) {
      fail(res, '产品不存在', 404);
      return;
    }

    const sets: string[] = [];
    const params: Record<string, unknown> = { id };

    const textFields: (keyof Product)[] = [
      'category', 'brand', 'name', 'model', 'whiteBgImage', 'launchYear',
      'flux', 'waterFlowRate', 'faucet', 'dimensions', 'waterMode',
      'roMembraneBrand', 'activatedCarbon', 'heatingElement', 'heatingCapacity',
      'tempControl',
    ];
    const numFields: (keyof Product)[] = ['dailyPrice', 'referencePrice', 'filterTotalCost'];
    const boolFields: (keyof Product)[] = [
      'isOnSale', 'hasMaternityCert', 'hasZeroStagnantWater', 'hasWaterTank', 'isAutomatic',
    ];
    const jsonFields: (keyof Product)[] = ['realImages', 'realVideos'];

    for (const f of textFields) {
      if (body[f] !== undefined) {
        sets.push(`${f} = @${f}`);
        params[f] = body[f];
      }
    }
    for (const f of numFields) {
      if (body[f] !== undefined) {
        sets.push(`${f} = @${f}`);
        params[f] = body[f];
      }
    }
    for (const f of boolFields) {
      if (body[f] !== undefined) {
        sets.push(`${f} = @${f}`);
        params[f] = body[f] ? 1 : 0;
      }
    }
    for (const f of jsonFields) {
      if (body[f] !== undefined) {
        sets.push(`${f} = @${f}`);
        params[f] = JSON.stringify(body[f]);
      }
    }

    if (sets.length === 0) {
      fail(res, '未提供可更新字段');
      return;
    }

    sets.push('updatedAt = @updatedAt');
    params.updatedAt = new Date().toISOString();

    const sql = `UPDATE products SET ${sets.join(', ')} WHERE id = @id`;
    db.prepare(sql).run(params);

    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Record<string, unknown>;
    success(res, rowToProduct(row), '更新成功');
  } catch (err) {
    serverError(res, err);
  }
});

// DELETE /api/products/:id — 删除
productsRouter.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
    if (result.changes === 0) {
      fail(res, '产品不存在', 404);
      return;
    }
    success(res, null, '删除成功');
  } catch (err) {
    serverError(res, err);
  }
});

// POST /api/products/batch-delete — 批量删除
productsRouter.post('/batch-delete', (req, res) => {
  try {
    const { ids } = req.body as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      fail(res, '请提供要删除的ID列表');
      return;
    }

    const placeholders = ids.map(() => '?').join(', ');
    const result = db.prepare(`DELETE FROM products WHERE id IN (${placeholders})`).run(...ids);

    success(res, { deleted: result.changes }, `成功删除 ${result.changes} 条`);
  } catch (err) {
    serverError(res, err);
  }
});

// POST /api/products/import — Excel 导入
productsRouter.post('/import', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      fail(res, '请上传Excel文件');
      return;
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      fail(res, 'Excel文件中没有工作表');
      return;
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

    if (rows.length === 0) {
      fail(res, 'Excel中没有数据行');
      return;
    }

    const headers = Object.keys(rows[0]);

    // 构建表头→字段映射
    const headerMap: Record<string, string> = {};
    for (const h of headers) {
      const field = EXCEL_COLUMN_MAP[h.trim()];
      if (field) {
        headerMap[h] = field;
      }
    }

    const now = new Date().toISOString();
    const errors: string[] = [];
    let successCount = 0;

    // 默认类目：如果有类目列就用，没有就默认净水器
    const hasCategoryColumn = headers.some((h: string) =>
      h.trim() === '类目' || h.trim() === '分类' || h.trim() === 'category'
    );

    const insert = db.prepare(`
      INSERT INTO products (
        id, category, brand, name, model, whiteBgImage, launchYear, isOnSale,
        dailyPrice, referencePrice, flux, waterFlowRate, faucet, dimensions,
        waterMode, roMembraneBrand, filterTotalCost, activatedCarbon,
        hasMaternityCert, hasZeroStagnantWater, realImages, realVideos,
        heatingElement, heatingCapacity, tempControl, hasWaterTank,
        isAutomatic, createdAt, updatedAt
      ) VALUES (
        @id, @category, @brand, @name, @model, @whiteBgImage, @launchYear, @isOnSale,
        @dailyPrice, @referencePrice, @flux, @waterFlowRate, @faucet, @dimensions,
        @waterMode, @roMembraneBrand, @filterTotalCost, @activatedCarbon,
        @hasMaternityCert, @hasZeroStagnantWater, @realImages, @realVideos,
        @heatingElement, @heatingCapacity, @tempControl, @hasWaterTank,
        @isAutomatic, @createdAt, @updatedAt
      )
    `);

    const importTx = db.transaction(() => {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const record: Record<string, unknown> = {
            id: randomUUID(),
            category: 'water_purifier',
            brand: null,
            name: null,
            model: null,
            whiteBgImage: null,
            launchYear: null,
            isOnSale: 1,
            dailyPrice: null,
            referencePrice: null,
            flux: null,
            waterFlowRate: null,
            faucet: null,
            dimensions: null,
            waterMode: null,
            roMembraneBrand: null,
            filterTotalCost: null,
            activatedCarbon: null,
            hasMaternityCert: 0,
            hasZeroStagnantWater: 0,
            realImages: '[]',
            realVideos: '[]',
            heatingElement: null,
            heatingCapacity: null,
            tempControl: null,
            hasWaterTank: 0,
            isAutomatic: 0,
            createdAt: now,
            updatedAt: now,
          };

          for (const [header, field] of Object.entries(headerMap)) {
            const raw = row[header];
            if (raw === undefined || raw === '' || raw === null) continue;

            // boolean 字段
            if (field === 'isOnSale' || field === 'hasMaternityCert' ||
                field === 'hasZeroStagnantWater' || field === 'hasWaterTank' ||
                field === 'isAutomatic') {
              const val = String(raw).trim().toLowerCase();
              record[field] = ['1', 'true', '是', '有', 'yes', 'y'].includes(val) ? 1 : 0;
              continue;
            }

            // number 字段
            if (field === 'dailyPrice' || field === 'referencePrice' || field === 'filterTotalCost') {
              const num = Number(raw);
              record[field] = isNaN(num) ? null : num;
              continue;
            }

            // 数组字段（逗号分隔字符串）
            if (field === 'realImages' || field === 'realVideos') {
              const arr = String(raw)
                .split(/[,，\n]/)
                .map((s: string) => s.trim())
                .filter(Boolean);
              record[field] = JSON.stringify(arr);
              continue;
            }

            // 普通文本字段
            record[field] = String(raw).trim();
          }

          // 类目列单独处理
          if (hasCategoryColumn) {
            const catHeader = headers.find((h: string) =>
              h.trim() === '类目' || h.trim() === '分类' || h.trim() === 'category'
            );
            if (catHeader && row[catHeader]) {
              record.category = String(row[catHeader]).trim();
            }
          }

          insert.run(record);
          successCount += 1;
        } catch (rowErr) {
          const msg = rowErr instanceof Error ? rowErr.message : String(rowErr);
          errors.push(`第 ${i + 2} 行: ${msg}`);
        }
      }
    });

    importTx();

    success(res, {
      total: rows.length,
      success: successCount,
      failed: errors.length,
      errors,
    }, `导入完成：成功 ${successCount} 条，失败 ${errors.length} 条`);
  } catch (err) {
    serverError(res, err);
  }
});
