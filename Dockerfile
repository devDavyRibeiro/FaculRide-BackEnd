# Etapa 1: Build Angular
FROM node:22 as build
WORKDIR /app

COPY .env ./
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD [ "npm","run","start" ]