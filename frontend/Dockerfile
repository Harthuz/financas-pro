# Estágio de Compilação
FROM node:20-alpine AS build

WORKDIR /app

# Copia os arquivos de dependência e instala
COPY package*.json ./
RUN npm ci

# Copia os fontes e compila o projeto
COPY . .
RUN npm run build

# Estágio de Execução (Servidor de produção leve)
FROM nginx:alpine

# Copia os arquivos compilados do Vite para a pasta pública do Nginx
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta padrão do Nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
