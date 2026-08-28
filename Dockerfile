# ============================================================
# 阶段 1：构建
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

# 复制依赖清单并安装全部依赖（含 devDependencies，用于构建）
COPY package*.json ./
RUN npm install

# 复制所有源码
COPY . .

# 构建前端产物 + 打包 server.ts 为 server.js
RUN npm run build
# 将 server.js 重命名为 server.cjs，确保在生产环境以 CommonJS 模式运行（避免 ESM import 问题）
RUN mv server.js server.cjs

# ============================================================
# 阶段 2：运行
# ============================================================
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

# 复制依赖清单并仅安装生产依赖
COPY package*.json ./
RUN npm install --omit=dev

# 从构建阶段复制前端构建产物
COPY --from=builder /app/dist ./dist

# 从构建阶段复制打包后的服务端入口
COPY --from=builder /app/server.cjs ./server.cjs

# 容器暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "server.cjs"]
