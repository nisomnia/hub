FROM oven/bun:1.3.14-alpine AS base
WORKDIR /app

FROM base AS installer
COPY package.json bun.lock ./
COPY packages/ ./packages/
COPY apps/api/package.json ./apps/api/
RUN bun install --frozen-lockfile --production

FROM base AS builder
COPY . .
RUN bun install --frozen-lockfile
WORKDIR /app/apps/api
RUN bun run build

FROM base AS runner
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/package.json ./
COPY --from=installer /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/

WORKDIR /app/apps/api
EXPOSE ${SERVER_PORT:-8000}
CMD ["bun", "dist/index.js"]
