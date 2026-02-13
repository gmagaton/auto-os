# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

RUN npx prisma generate

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/generated ./generated
COPY . .

RUN npx nest build

# ============================================
# Stage 3: Production
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Usuario nao-root
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

# Copiar apenas o essencial
COPY --chown=nestjs:nodejs --from=builder /app/dist ./dist
COPY --chown=nestjs:nodejs --from=deps /app/node_modules ./node_modules
COPY --chown=nestjs:nodejs --from=deps /app/generated ./generated
COPY --chown=nestjs:nodejs --from=builder /app/prisma ./prisma
COPY --chown=nestjs:nodejs package*.json ./
COPY --chown=nestjs:nodejs docker-entrypoint.sh ./

USER nestjs

EXPOSE 3000

CMD ["sh", "docker-entrypoint.sh"]
