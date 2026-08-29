# ===============================
# Stage 1: Build
# ===============================
FROM node:22-alpine AS builder

WORKDIR /app

# 安装全部依赖（跳过 postinstall，避免 fullstack-cli 缺失报错）
COPY package.json package-lock.json* ./
RUN npm install --ignore-scripts

# 复制源代码
COPY . .

# 构建后端 (NestJS) + 前端 (Vite)
# build:prod = build:server + build:client，不依赖 fullstack-cli
RUN npm run build:prod

# ===============================
# Stage 2: Production
# ===============================
FROM node:22-alpine AS runner

WORKDIR /app

# 安装生产依赖（跳过 postinstall）
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --ignore-scripts

# 从构建阶段复制全部产物
COPY --from=builder /app/dist ./dist

# 环境变量
ENV NODE_ENV=production
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3000/ > /dev/null 2>&1 || exit 1

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/server/main.js"]
