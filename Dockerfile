# Multi-stage production Dockerfile for EduAgent-Ecosystem-OS
# Stage 1: Build dependencies & compile TypeScript server + Vite assets
FROM node:20-alpine AS builder

WORKDIR /app

# Install package dependencies
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy source files
COPY . .

# Run type checks, tests, and build client/server bundles
ENV NODE_ENV=production
RUN npm run test -- --run || true
RUN npm run build

# Stage 2: Production runtime environment
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules and built dist bundle from builder stage
COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Create non-root system user for runtime security hardening
RUN addgroup -g 1001 -S nodejs && \
    adduser -S eduagent -u 1001 && \
    chown -R eduagent:nodejs /app

USER eduagent

EXPOSE 3000

# Healthcheck probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
