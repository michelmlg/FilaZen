# ==========================================
# Stage 1: Builder
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copia pacotes para instalar dependências
COPY package*.json ./
RUN npm ci

# Copia código fonte
COPY . .

# Gera schema Prisma e realiza o Build (TS -> JS)
RUN npx prisma generate
RUN npm run build

# ==========================================
# Stage 2: Runner (Produção)
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Define ambiente de produção nativamente
ENV NODE_ENV=production

# Copia as definições limpas do builder e instala Apenas dependencias produtivas
COPY package*.json ./
RUN npm ci --omit=dev

# Copia as builds e a pasta gerada localmente do prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

CMD ["node", "dist/server.js"]

