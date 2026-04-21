# ==========================================
# Stage 1: Builder
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm ci

# Copia código e realiza o build local
COPY . .
RUN npm run build 

# ==========================================
# Stage 2: Runner (Produção SPA)
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Usamos um servidor estático mega leve do próprio Node
RUN npm install -g serve

# Copia os assets compilados do Builder
COPY --from=builder /app/dist ./dist

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]
