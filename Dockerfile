# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code (dist is excluded by .dockerignore but generated in this stage)
COPY . .

# Full build: server (NestJS) + client (Vite) + route generation
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS runner

WORKDIR /app

# Copy the entire dist directory from builder (includes pruned node_modules)
COPY --from=builder /app/dist ./dist

# Environment variables
ENV NODE_ENV=production
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3000/ > /dev/null 2>&1 || exit 1

# Expose port
EXPOSE 3000

# Start command (dist/ contains run.sh and pruned node_modules from build pipeline)
CMD ["node", "dist/server/main.js"]
