FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Em desenvolvimento ou em prod, o docker-compose.yml será responsável 
# por executar a compilação ou inicialização do ambiente
EXPOSE 5173
