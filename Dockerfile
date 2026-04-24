# =============================================================================
# Stage 1: Build — instala dependências de produção
# =============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
# pg não requer compilação nativa — sem necessidade de python/make/g++
RUN npm ci --omit=dev

# =============================================================================
# Stage 2: Runner — imagem final enxuta
# =============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

# Copiar dependências instaladas e código-fonte
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Usuário não-root para segurança
RUN addgroup --system --gid 1001 botgroup && \
    adduser --system --uid 1001 botuser && \
    chown -R botuser:botgroup /app

USER botuser

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('./src/utils/config')" || exit 1

CMD ["node", "src/index.js"]
