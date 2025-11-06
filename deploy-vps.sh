#!/bin/bash

###############################################
# ⚪ Whiterock Industrie - VPS Deploy Script
# "Scrape Everything, Give It Back Free"
###############################################

echo "🚀 Deploying Whiterock Industrie to VPS..."
echo "=========================================="

# 1. Navigate to project directory
cd /var/www/politiker-trader-daten-scraper-global || { echo "❌ Project directory not found!"; exit 1; }

# 2. Pull latest code from GitHub
echo "📥 Pulling latest code from GitHub..."
git pull || { echo "❌ Git pull failed!"; exit 1; }

# 3. Install any new dependencies
echo "📦 Installing dependencies..."
npm install --production

# 4. Restart PM2 process
echo "🔄 Restarting PM2 process..."
pm2 restart politiker-api || pm2 start src/index.js --name politiker-api

# 5. Show PM2 status
echo ""
echo "📊 PM2 Status:"
pm2 list

# 6. Test API health
echo ""
echo "🏥 Testing API health..."
sleep 3
curl -s http://localhost:3000/health | head -20

echo ""
echo "=========================================="
echo "✅ Whiterock Industrie deployed successfully!"
echo "🌐 URL: https://api.srv1105698.hstgr.cloud"
echo "🔥 Hybrid Monopol: ONLINE"
echo ""
echo "💡 Nächste Schritte:"
echo "   1. Öffne Browser: https://api.srv1105698.hstgr.cloud"
echo "   2. Drücke STRG + SHIFT + R (Hard Refresh)"
echo "   3. Genieße die neue Whiterock Industrie Plattform!"
echo "=========================================="

