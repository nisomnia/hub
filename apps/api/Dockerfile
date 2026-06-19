FROM docker.io/oven/bun:1.3.14-alpine AS base
WORKDIR /app

FROM base AS builder
COPY . .
RUN bun install --frozen-lockfile --ignore-scripts
WORKDIR /app/apps/api
RUN bun run build

FROM base AS runner
COPY --from=builder /app/apps/api/dist ./dist
EXPOSE 8000
CMD ["bun", "dist/index.js"]
