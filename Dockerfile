# ===============================
# Stage 1: Build
# ===============================
FROM node:22-alpine AS builder

WORKDIR /app

# 安装全部依赖
COPY package.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

# 复制源代码
COPY . .

# 构建前端 + 后端（vite build + esbuild bundle）
RUN npm run build

# ===============================
# Stage 2: Production
# ===============================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    DB_PATH=./data/app.db

# 仅安装生产依赖（better-sqlite3, pg, express, cors 等）
COPY package.json ./
RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund

# 从构建阶段复制产物
COPY --from=builder /app/dist ./dist

# 创建 SQLite 数据目录
RUN mkdir -p /app/data

# 健康检查（使用 /healthz 端点）
RUN apk add --no-cache curl
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS http://localhost:3000/healthz || exit 1

EXPOSE 3000/tcp

CMD ["node", "dist/server.cjs"]
