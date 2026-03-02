# ──────────────────────────────────────────────
# Stage 1: Install dependencies with bun
# ──────────────────────────────────────────────
FROM oven/bun:1 AS deps

WORKDIR /app

COPY package.json bun.lock /app/

COPY frontend/package.json /app/frontend/

WORKDIR /app/frontend

RUN bun install --frozen-lockfile

# ──────────────────────────────────────────────
# Stage 2: Build the Next.js application
# ──────────────────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

COPY ./frontend/package.json ./bun.lock /app/frontend/
COPY ./frontend /app/frontend
COPY --from=deps /app/frontend/node_modules /app/frontend/node_modules

WORKDIR /app/frontend

RUN bun install

ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN bunx next build

# ──────────────────────────────────────────────
# Stage 3: Slim production runtime
# ──────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static

USER nextjs

EXPOSE ${PORT}

CMD ["node", "server.js"]
