# Use a versão LTS (Long Term Support) para maior estabilidade
FROM node:20-alpine AS build

# Define o diretório de trabalho
WORKDIR /app

# Copia apenas arquivos de dependências primeiro (aproveita o cache do Docker)
COPY package*.json ./

# Instala dependências (incluindo as de desenvolvimento para o build)
RUN npm install

# Copia o restante dos arquivos
COPY . .

# Executa o build do TypeScript/Angular
RUN npm run build

# Porta da aplicação
EXPOSE 3000

# Comando para iniciar
CMD [ "npm", "run", "start" ]