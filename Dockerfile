# Multi-stage Build für optimierte Image-Größe
FROM node:18-alpine AS builder

# Puppeteer-Abhängigkeiten installieren
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Puppeteer-Umgebungsvariablen setzen
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Package-Dateien kopieren
COPY package*.json ./

# Abhängigkeiten installieren
RUN npm ci --only=production

# Anwendungscode kopieren
COPY . .

# Produktions-Image
FROM node:18-alpine

# Puppeteer-Abhängigkeiten installieren
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev \
    ttf-liberation

# Puppeteer-Umgebungsvariablen setzen
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

# Non-root User erstellen
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Node-Module und Anwendung vom Builder kopieren
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# Auf non-root User wechseln
USER nodejs

# Port exponieren
EXPOSE 3000

# Health-Check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Anwendung starten
CMD ["node", "src/index.js"]

