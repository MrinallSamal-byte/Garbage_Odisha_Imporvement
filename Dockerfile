FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# ── Install dependencies ───────────────────────────────────────────────────
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
# Generate the Prisma client (puts generated files into node_modules/@prisma/client)
RUN npx prisma generate
# Build Next.js standalone output
RUN npm run build

# ── Lean production image ──────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

# Standalone Next.js server — server.js + its trimmed node_modules
COPY --from=builder /app/.next/standalone ./

# Static and public assets
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma schema (needed for generate + migrate at startup)
COPY --from=builder /app/prisma ./prisma

# Prisma CLI binary (needed in entrypoint to run prisma generate + migrate)
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Prisma engines (native query engine binaries)
COPY --from=builder /app/node_modules/@prisma/engines ./node_modules/@prisma/engines

# Generated @prisma/client — copied to BOTH locations:
#   1. /app/node_modules/ — where server.js resolves modules from at runtime
#   2. /app/node_modules/@prisma/client is already above; also cover the
#      standalone sub-tree in case Next.js resolution walks it first
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Static data files (mock GeoJSON, seed data)
COPY --from=builder /app/data ./data

# Entrypoint — runs prisma generate then starts the server
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh \
  && mkdir -p data/preview-sessions public/uploads

EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
