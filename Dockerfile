FROM node:22-alpine

# Dependências para compilar better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar dependências
COPY package.json package-lock.json* ./
RUN npm ci --production

# Copiar código fonte
COPY . .

# Criar diretório de dados
RUN mkdir -p data

# Executar seed na inicialização (se banco não existir)
RUN node src/database/seed.js || true

# Comando de inicialização
CMD ["node", "src/index.js"]
