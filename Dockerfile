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
    DB_PATH=./data/app.db

# 仅安装生产依赖（better-sqlite3, express, cors 等）
COPY package.json ./
RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund

# 从构建阶段复制产物
COPY --from=builder /app/dist ./dist

# 创建 SQLite 数据目录
RUN mkdir -p /app/data

# 健康检查
RUN apk add --no-cache wget
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
