FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-factor 2 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm config set audit false \
  && npm config set fund false \
  && (npm ci --no-audit --no-fund || npm ci --no-audit --no-fund)

FROM deps AS builder
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Lean production image ────────────────────────────────────────────────────
# output: "standalone" gives us a self-contained server.js + a trimmed
# node_modules copy (~120 MB vs ~600 MB for the full tree).
# We add only the Prisma CLI on top so entrypoint can run migrations.
FROM base AS runner
ENV NODE_ENV=production
# Standalone Next.js server + its auto-bundled node_modules
COPY --from=builder /app/.next/standalone ./
# Static assets must sit at .next/static relative to CWD
COPY --from=builder /app/.next/static ./.next/static
# Public directory
COPY --from=builder /app/public ./public
# Prisma schema (needed by migrate deploy)
COPY --from=builder /app/prisma ./prisma
# Prisma CLI binary + package (needed for migrate deploy in entrypoint)
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
# Static data files (mock seed data, etc.)
COPY --from=builder /app/data ./data
# Entrypoint
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
RUN mkdir -p data/preview-sessions public/uploads
EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
