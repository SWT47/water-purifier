import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import path from 'node:path';
import fs from 'node:fs';
import productsHandler from './api/products';
import productsCompareHandler from './api/products/compare';
import productsByIdHandler from './api/products/[id]';
import comboSchemesHandler from './api/combo-schemes';
import comboSchemesByIdHandler from './api/combo-schemes/[id]';
import uploadHandler from './api/upload';

const app = express();

app.use(express.json());

// ---------------------------------------------------------------
// /api/*  — 业务接口（与 Vercel Functions 对齐）
// 注意：静态路由在前，动态 :id 路由在后
// ---------------------------------------------------------------

// 产品列表 / 创建
app.all('/api/products', (req: Request, res: Response) =>
  productsHandler(req as any, res as any),
);

// 产品对比（静态路由，必须在 /:id 之前）
app.all('/api/products/compare', (req: Request, res: Response) =>
  productsCompareHandler(req as any, res as any),
);

// 产品详情 / 更新 / 删除
app.all('/api/products/:id', (req: Request, res: Response) => {
  (req as any).query.id = req.params.id;
  return productsByIdHandler(req as any, res as any);
});

// 搭配方案列表 / 创建
app.all('/api/combo-schemes', (req: Request, res: Response) =>
  comboSchemesHandler(req as any, res as any),
);

// 搭配方案更新 / 删除
app.all('/api/combo-schemes/:id', (req: Request, res: Response) => {
  (req as any).query.id = req.params.id;
  return comboSchemesByIdHandler(req as any, res as any);
});

// 文件上传
app.all('/api/upload', (req: Request, res: Response) =>
  uploadHandler(req as any, res as any),
);

// 本地上传文件静态服务（仅本地降级模式使用）
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const uploadPath = path.isAbsolute(uploadDir)
  ? uploadDir
  : path.join(process.cwd(), uploadDir);
if (fs.existsSync(uploadPath)) {
  app.use('/uploads', express.static(uploadPath));
} else {
  try {
    fs.mkdirSync(uploadPath, { recursive: true });
    app.use('/uploads', express.static(uploadPath));
  } catch {
    // Vercel serverless 环境只读文件系统，跳过静态目录创建
  }
}

// ---------------------------------------------------------------
// /openapi/*  — 匿名读接口（只读，供公开访问用）
// 写方法（POST/PUT/PATCH/DELETE）直接返回 405
// ---------------------------------------------------------------

function readOnly(
  req: Request,
  res: Response,
  next: NextFunction,
  handler: (req: any, res: any) => Promise<void>,
): void {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  void handler(req as any, res as any);
  next();
}

app.get('/openapi/products', (req: Request, res: Response, next: NextFunction) =>
  readOnly(req, res, next, productsHandler),
);

app.get(
  '/openapi/products/compare',
  (req: Request, res: Response, next: NextFunction) =>
    readOnly(req, res, next, productsCompareHandler),
);

app.get(
  '/openapi/products/:id',
  (req: Request, res: Response, next: NextFunction) => {
    (req as any).query.id = req.params.id;
    return readOnly(req, res, next, productsByIdHandler);
  },
);

app.get(
  '/openapi/combo-schemes',
  (req: Request, res: Response, next: NextFunction) =>
    readOnly(req, res, next, comboSchemesHandler),
);

// ---------------------------------------------------------------
// 静态文件 + SPA fallback
// ---------------------------------------------------------------

app.use(express.static('dist'));

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${port}`);
});
