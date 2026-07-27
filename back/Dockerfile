FROM node:20-slim

# curl para healthcheck y pg_dump para respaldos completos
RUN apt-get update && apt-get install -y --no-install-recommends curl postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm install --production

# Copiar el resto del código
COPY . .

# Crear carpetas persistentes si no existen
RUN mkdir -p uploads/documentos uploads/configuracion/logos

# Exponer el puerto configurado
EXPOSE 4000

# Comando para iniciar
CMD ["node", "src/server.js"]
