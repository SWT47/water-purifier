// Express 入口：挂载路由 + 静态文件 + SPA fallback
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';

import { productsRouter } from './api/products.js';
import { comboRouter } from './api/combo.js';
import { fail } from './utils/response.js';
import { initDb, getDbType } from './db/index.js';

// dist/server.cjs 与 dist/assets、dist/index.html 同级
const distDir = path.resolve(process.cwd(), 'dist');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API 路由
app.use('/api/products', productsRouter);
app.use('/api/combo-schemes', comboRouter);

// API 404
app.use('/api/*', (req, res) => {
  fail(res, `接口不存在: ${req.method} ${req.path}`, 404);
});

// 静态文件：dist/（vite build 输出到 dist/，esbuild 输出到 dist/server.cjs）
const clientDistPath = distDir;
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath, { index: false }));

  // SPA fallback：所有非 /api 路径返回 index.html
  app.get(/^\/(?!api).*/, (_req, res) => {
    const indexPath = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ success: false, data: null, message: 'index.html 不存在' });
    }
  });
} else {
  // 开发模式：没有前端构建产物时的占位
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      data: { service: '净水器直播展示系统 API', version: '1.0.0' },
      message: '后端服务运行中',
    });
  });
}

// 等数据库初始化完成后再启动服务
initDb()
  .then(() => {
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(
        `🚀 净水器直播展示系统服务已启动: http://localhost:${PORT} (数据库: ${getDbType()})`
      );
    });
  })
  .catch((err: Error) => {
    // eslint-disable-next-line no-console
    console.error('服务启动失败:', err);
    process.exit(1);
  });
