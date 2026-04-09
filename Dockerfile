FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# ── Install dependencies (cached as long as package-lock doesn't change) ──
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

# ── Build ──────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Lean production image ──────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

# Standalone Next.js server (includes a trimmed node_modules copy)
COPY --from=builder /app/.next/standalone ./
# Static assets
COPY --from=builder /app/.next/static ./.next/static
# Public assets
COPY --from=builder /app/public ./public
# Prisma schema (needed for migrate deploy at runtime)
COPY --from=builder /app/prisma ./prisma
# Prisma CLI + engines (needed to run migrate deploy in entrypoint)
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma/engines ./node_modules/@prisma/engines
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
# Static data files (mock seed data, GeoJSON)
COPY --from=builder /app/data ./data
# Entrypoint
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh \
  && mkdir -p data/preview-sessions public/uploads

EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
