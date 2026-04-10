FROM node:20-bookworm-slim AS deps
WORKDIR /app

# Install only production dependencies with npm ci for reproducible, cached builds.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./package.json
COPY server.js ./server.js
COPY public ./public

EXPOSE 8080
CMD ["npm", "start"]
