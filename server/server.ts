// Express 入口：挂载路由 + 静态文件 + SPA fallback
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';

import { productsRouter } from './api/products.js';
import { comboRouter } from './api/combo.js';
import { fail } from './utils/response.js';
import { initDb, getDbType, getDbInitError } from './db/index.js';

// dist/server.cjs 与 dist/assets、dist/index.html 同级
const distDir = path.resolve(process.cwd(), 'dist');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

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
});

// ========== 中间件 ==========
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========== 健康检查（探针用） ==========
app.get('/healthz', (_req, res) => {
  const err = getDbInitError();
  if (err) {
    res.status(503).json({
      success: false,
      data: { status: 'degraded', dbType: getDbType() },
      message: `数据库降级: ${err.message}`,
    });
    return;
  }
  res.json({
    success: true,
    data: { status: 'ok', dbType: getDbType() },
    message: 'ok',
  });
});

// ========== API 路由 ==========
app.use('/api/products', productsRouter);
app.use('/api/combo-schemes', comboRouter);

// API 404
app.use('/api/*', (req, res) => {
  fail(res, `接口不存在: ${req.method} ${req.path}`, 404);
});

// ========== 静态文件 + SPA fallback ==========
const clientDistPath = distDir;
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath, { index: false }));

  app.get(/^\/(?!api).*/, (_req, res) => {
    const indexPath = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ success: false, data: null, message: 'index.html 不存在' });
    }
  });
} else {
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      data: { service: '净水器直播展示系统 API', version: '1.0.0' },
      message: '后端服务运行中',
    });
  });
}

// ========== 全局错误处理中间件 ==========
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API ERROR]', err.message);
  res.status(500).json({
    success: false,
    data: null,
    message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
  });
});

// ========== 启动：等数据库初始化后再监听 ==========
async function startServer() {
  console.log('========================================');
  console.log('🚀 净水器直播展示系统启动中...');
  console.log(`📍 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 端口: ${PORT}`);
  console.log(`📍 绑定: ${HOST}`);
  console.log(`📍 工作目录: ${process.cwd()}`);
  console.log(`📍 DATABASE_URL: ${process.env.DATABASE_URL ? '已配置' : '未配置（使用 SQLite）'}`);
  console.log(`📍 DB_PATH: ${process.env.DB_PATH || './data/app.db'}`);
  console.log('========================================');

  try {
    await initDb();
    console.log(`✅ 数据库就绪: ${getDbType()}`);
  } catch (dbErr) {
    console.warn('⚠️  数据库初始化失败，服务仍将启动（部分接口不可用）:', (dbErr as Error).message);
  }

  app.listen(PORT, HOST, () => {
    console.log('========================================');
    console.log(`✅ 服务已启动: http://${HOST}:${PORT}`);
    console.log(`✅ 数据库模式: ${getDbType()}`);
    console.log(`✅ 健康检查: http://${HOST}:${PORT}/healthz`);
    console.log('========================================');
  }).on('error', (err: Error) => {
    console.error('❌ 服务启动失败:', err.message);
    console.error(err.stack);
  });
}

startServer();
