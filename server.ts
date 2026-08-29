import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import path from 'node:path';
import productsHandler from './api/products';
import productsCompareHandler from './api/products/compare';
import productsByIdHandler from './api/products/[id]';
import comboSchemesHandler from './api/combo-schemes';
import comboSchemesByIdHandler from './api/combo-schemes/[id]';
import { initDb, getDbInitError, isDbReady } from './db';

// ========== 全局异常兜底，防止进程崩溃 ==========
process.on('uncaughtException', (err: Error) => {
  console.error('[FATAL] uncaughtException:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error(
    '[FATAL] unhandledRejection:',
    reason instanceof Error ? reason.message : String(reason),
  );
  if (reason instanceof Error && reason.stack) {
    console.error(reason.stack);
  }
});

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========== 健康检查（探针用，必须在所有路由之前） ==========
app.get('/healthz', (_req: Request, res: Response) => {
  const err = getDbInitError();
  if (err) {
    // 数据库未就绪时也返回 200，避免探针反复重启容器
    res.status(200).json({
      status: 'degraded',
      dbReady: false,
      message: err.message,
    });
    return;
  }
  res.json({
    status: 'ok',
    dbReady: isDbReady(),
    message: 'ok',
  });
});

// ---------------------------------------------------------------
// /api/*  — 业务接口
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

// ---------------------------------------------------------------
// /openapi/*  — 匿名读接口（只读，供公开访问用）
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

// ========== 全局错误处理中间件 ==========
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API ERROR]', err.message);
  res.status(500).json({
    error:
      process.env.NODE_ENV === 'production' && !err.message.includes('数据库')
        ? '服务器内部错误'
        : err.message,
  });
});

// ---------------------------------------------------------------
// 静态文件 + SPA fallback
// ---------------------------------------------------------------
const distDir = path.join(process.cwd(), 'dist');
app.use(express.static(distDir));

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

// ========== 启动 ==========
async function startServer() {
  console.log('========================================');
  console.log('🚀 净水器直播展示系统启动中...');
  console.log(`📍 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 端口: ${PORT}`);
  console.log(`📍 绑定地址: ${HOST}`);
  console.log(`📍 工作目录: ${process.cwd()}`);
  console.log(`📍 DATABASE_URL: ${process.env.DATABASE_URL ? '已配置' : '未配置'}`);
  console.log(`📍 POSTGRES_URL: ${process.env.POSTGRES_URL ? '已配置' : '未配置'}`);
  console.log('========================================');

  // 初始化数据库（失败不崩溃，服务照常启动）
  const dbOk = await initDb();
  if (dbOk) {
    console.log('✅ 数据库连接成功');
  } else {
    const err = getDbInitError();
    console.warn('⚠️  数据库连接失败，API 将返回 503 错误，服务仍在运行');
    console.warn(`⚠️  失败原因: ${err?.message}`);
  }

  app.listen(PORT, HOST, () => {
    console.log('========================================');
    console.log(`✅ 服务已启动: http://${HOST}:${PORT}`);
    console.log(`✅ 健康检查: http://${HOST}:${PORT}/healthz`);
    console.log(`✅ 数据库状态: ${isDbReady() ? '已连接' : '未连接'}`);
    console.log('========================================');
  }).on('error', (err: Error) => {
    console.error('❌ 服务启动失败:', err.message);
    console.error(err.stack);
  });
}

startServer();
