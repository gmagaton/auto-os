# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

# Evita download repetido
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
COPY --from=deps /app/prisma ./prisma
COPY . .

RUN npm run build

# ============================================
# Stage 3: Production
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Usuário não-root
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

# Copiar apenas o essencial (já com ownership)
COPY --chown=nestjs:nodejs --from=builder /app/dist ./dist
COPY --chown=nestjs:nodejs --from=deps /app/node_modules ./node_modules
COPY --chown=nestjs:nodejs --from=builder /app/prisma ./prisma
COPY --chown=nestjs:nodejs package*.json ./

USER nestjs

EXPOSE 3000

CMD ["sh", "-c", "echo DATABASE_URL=$DATABASE_URL && npx prisma migrate deploy && node dist/main.js"]

