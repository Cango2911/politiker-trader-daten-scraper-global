# 🚀 Deployment-Anleitung

Komplette Anleitung für das Deployment auf verschiedenen Plattformen.

## 📋 Inhaltsverzeichnis

- [VPS Deployment (Hostinger, DigitalOcean, AWS)](#vps-deployment)
- [Docker Deployment](#docker-deployment)
- [Heroku Deployment](#heroku-deployment)
- [Vercel/Netlify (Frontend)](#vercel-deployment)
- [GitHub Pages (Dokumentation)](#github-pages)

---

## 🖥️ VPS Deployment

### Voraussetzungen

- Ubuntu 20.04+ oder Debian 11+
- Root oder Sudo-Zugriff
- Domain (optional)

### Schritt 1: Server vorbereiten

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Node.js installieren (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Build-Tools installieren
sudo apt install -y build-essential

# Git installieren
sudo apt install -y git

# PM2 installieren (Process Manager)
sudo npm install -g pm2

# Nginx installieren (Reverse Proxy)
sudo apt install -y nginx

# Certbot für SSL (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
```

### Schritt 2: Code deployen

```bash
# Projektverzeichnis erstellen
sudo mkdir -p /var/www/trader-daten-politiker
cd /var/www/trader-daten-politiker

# Repository klonen
sudo git clone https://github.com/IHR_USERNAME/trader-daten-politiker.git .

# Ownership setzen
sudo chown -R $USER:$USER /var/www/trader-daten-politiker
```

### Schritt 3: Konfiguration

```bash
# .env Datei erstellen
cat > .env << EOF
NODE_ENV=production
PORT=3000
CACHE_ENABLED=true
CACHE_TTL=3600
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
PUPPETEER_HEADLESS=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# MongoDB (optional)
# MONGODB_URI=mongodb://localhost:27017/capitol_trades

# Aktivierte Scraper
ENABLE_USA_SCRAPER=true
ENABLE_UK_SCRAPER=true
ENABLE_RUSSIA_SCRAPER=true
ENABLE_GERMANY_SCRAPER=false
# ... weitere Länder
EOF

# Puppeteer-Abhängigkeiten installieren
sudo apt install -y chromium-browser chromium-codecs-ffmpeg
sudo apt install -y fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libatspi2.0-0 libcairo2 libcups2 libdbus-1-3 libdrm2 libgbm1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libx11-6 libxcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 xdg-utils
```

### Schritt 4: Dependencies installieren

```bash
# Produktions-Dependencies
npm ci --production

# Oder mit Dev-Dependencies (für Development)
npm install
```

### Schritt 5: Mit PM2 starten

```bash
# App starten
pm2 start src/index.js --name capitol-trades-api

# Beim Boot automatisch starten
pm2 startup systemd
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

# Konfiguration speichern
pm2 save

# Logs anzeigen
pm2 logs capitol-trades-api

# Status prüfen
pm2 status
```

### Schritt 6: Nginx konfigurieren

```bash
# Nginx-Config erstellen
sudo nano /etc/nginx/sites-available/capitol-trades
```

Fügen Sie ein:

```nginx
server {
    listen 80;
    server_name IHR_DOMAIN.de www.IHR_DOMAIN.de;

    # Logs
    access_log /var/log/nginx/capitol-trades-access.log;
    error_log /var/log/nginx/capitol-trades-error.log;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts für Scraping
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }

    # Health Check (kein Logging)
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

```bash
# Config aktivieren
sudo ln -s /etc/nginx/sites-available/capitol-trades /etc/nginx/sites-enabled/

# Nginx testen
sudo nginx -t

# Nginx neustarten
sudo systemctl restart nginx
```

### Schritt 7: SSL einrichten

```bash
# Let's Encrypt SSL-Zertifikat
sudo certbot --nginx -d IHR_DOMAIN.de -d www.IHR_DOMAIN.de

# Auto-Renewal testen
sudo certbot renew --dry-run
```

### Schritt 8: Firewall konfigurieren

```bash
# UFW aktivieren
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 🐳 Docker Deployment

### Schritt 1: Docker installieren

```bash
# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose installieren
sudo apt install -y docker-compose

# User zu Docker-Gruppe hinzufügen
sudo usermod -aG docker $USER
newgrp docker
```

### Schritt 2: Mit Docker Compose starten

```bash
# .env Datei erstellen (wie oben)

# Container starten
docker-compose up -d

# Logs anzeigen
docker-compose logs -f

# Status prüfen
docker-compose ps

# Container stoppen
docker-compose down
```

### Schritt 3: Docker Hub (Optional)

```bash
# Image bauen
docker build -t IHR_USERNAME/capitol-trades-scraper:latest .

# Login
docker login

# Push
docker push IHR_USERNAME/capitol-trades-scraper:latest

# Auf Server pullen
docker pull IHR_USERNAME/capitol-trades-scraper:latest
docker run -d -p 3000:3000 --env-file .env IHR_USERNAME/capitol-trades-scraper:latest
```

---

## 🌐 Heroku Deployment

### Schritt 1: Heroku CLI installieren

```bash
# Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login
```

### Schritt 2: App erstellen

```bash
# Neues Heroku App erstellen
heroku create capitol-trades-scraper

# Buildpack setzen
heroku buildpacks:set heroku/nodejs

# Environment Variables setzen
heroku config:set NODE_ENV=production
heroku config:set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
heroku config:set PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
```

### Schritt 3: Procfile erstellen

Erstellen Sie `Procfile`:

```
web: node src/index.js
```

### Schritt 4: Deployen

```bash
# Zu Git hinzufügen
git add .
git commit -m "Prepare for Heroku deployment"

# Zu Heroku pushen
git push heroku main

# Logs anzeigen
heroku logs --tail

# URL öffnen
heroku open
```

---

## 📊 Monitoring & Maintenance

### PM2 Monitoring

```bash
# Real-time Monitoring
pm2 monit

# Web-Dashboard (optional)
pm2 plus
```

### Logs

```bash
# PM2 Logs
pm2 logs capitol-trades-api

# Nginx Logs
sudo tail -f /var/log/nginx/capitol-trades-access.log
sudo tail -f /var/log/nginx/capitol-trades-error.log

# System Logs
sudo journalctl -u pm2-$USER -f
```

### Updates deployen

```bash
# Auf Server
cd /var/www/trader-daten-politiker
git pull origin main
npm install --production
pm2 restart capitol-trades-api
```

### Automatische Backups

```bash
# MongoDB Backup (falls verwendet)
mongodump --out=/backup/$(date +%Y%m%d)

# Logs rotieren
sudo nano /etc/logrotate.d/capitol-trades
```

```
/var/log/capitol-trades/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
}
```

---

## 🔒 Sicherheit

### Best Practices

1. **Environment Variables** niemals committen
2. **SSH-Keys** statt Passwörter verwenden
3. **Firewall** aktivieren
4. **SSL** aktivieren
5. **Rate-Limiting** konfigurieren
6. **Updates** regelmäßig installieren

### Security Headers (Nginx)

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

---

## 🆘 Troubleshooting

### Port bereits belegt

```bash
# Port-Nutzung prüfen
sudo lsof -i :3000

# Prozess beenden
sudo kill -9 PID
```

### PM2 startet nicht

```bash
# PM2 löschen und neu starten
pm2 delete capitol-trades-api
pm2 start src/index.js --name capitol-trades-api
```

### Nginx Fehler

```bash
# Config testen
sudo nginx -t

# Fehler-Logs prüfen
sudo tail -f /var/log/nginx/error.log
```

### Puppeteer Fehler

```bash
# Chromium manuell installieren
sudo apt install -y chromium-browser

# Umgebungsvariable setzen
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

---

## 📞 Support

Bei Problemen:
1. Prüfen Sie die Logs
2. Lesen Sie die Dokumentation
3. Öffnen Sie ein GitHub Issue

---

**Viel Erfolg beim Deployment!** 🚀





