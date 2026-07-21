# Etapa 1: Construcción
FROM node:20-slim AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias
RUN npm install

# Copiar el código fuente
COPY . .

# Construir la aplicación
# Nota: Las variables de entorno NEXT_PUBLIC deben estar presentes en el build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Etapa 2: Producción
FROM node:20-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

# Copiar archivos necesarios desde la etapa de construcción
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Exponer el puerto de Next.js
EXPOSE 3000

# Comando para iniciar
CMD ["npm", "start"]
