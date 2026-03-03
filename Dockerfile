# Multi-stage build for production
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl openssl-dev
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files with correct ownership (avoids slow chown -R on node_modules)
COPY --chown=nextjs:nodejs --from=builder /app/public ./public
COPY --chown=nextjs:nodejs --from=builder /app/.next/standalone ./
COPY --chown=nextjs:nodejs --from=builder /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs --from=builder /app/prisma ./prisma
COPY --chown=nextjs:nodejs --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000
EXPOSE 3006

ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
