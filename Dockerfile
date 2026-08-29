FROM node:22-alpine

WORKDIR /app

# 安装生产依赖
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# 复制构建产物
COPY dist/ ./dist/

# 环境变量
ENV NODE_ENV=production
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=3000

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/server/main.js"]
