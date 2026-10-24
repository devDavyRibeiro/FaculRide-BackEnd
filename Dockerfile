# Estágio 1: Build da aplicação (compila o TypeScript)
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Estágio 2: Execução em produção (leve e limpo)
FROM node:22-alpine AS runner

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

# Copia apenas o resultado compilado do estágio anterior
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]