#!/usr/bin/env bash
# Ubuntu 22.04/24.04 — run once on a fresh EC2 instance (adjust APP_DIR if needed).
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/resume-builder}"

echo "==> Installing Node.js 22.x, nginx, git …"
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg git nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

echo "==> Clone or upload your project to: $APP_DIR"
echo "    Example: git clone https://github.com/YOU/Team14.git \"$APP_DIR\""
echo ""
echo "Then on the server run:"
echo "  cd \"$APP_DIR\""
echo "  cp server/.env.example server/.env   # edit with production values"
echo "  cp client/.env.production.example client/.env.production   # VITE_* for build"
echo "  npm ci --prefix server && npm ci --prefix client"
echo "  npm run build --prefix client"
echo "  pm2 start ecosystem.config.cjs"
echo "  sudo cp deploy/nginx-resuai.conf /etc/nginx/sites-available/resuai"
echo "  sudo ln -sf /etc/nginx/sites-available/resuai /etc/nginx/sites-enabled/"
echo "  sudo rm -f /etc/nginx/sites-enabled/default"
echo "  sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "Open EC2 Security Group: inbound TCP 22 (SSH), 80 (HTTP), optional 443 (HTTPS)."
