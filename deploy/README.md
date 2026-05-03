# Deploy ResuAI on AWS EC2 (Ubuntu)

This app runs as **one Node process** (Express) that serves the **API**, **uploaded files**, and the **built React app**. **Nginx** on port 80 forwards traffic to Node on **5001**.

You need a **MongoDB** reachable from the instance. Easiest: **[MongoDB Atlas](https://www.mongodb.com/atlas)** (free tier). Add your EC2 **public IP** under **Network Access → IP Access List**.

---

## 1. EC2 instance

- **AMI:** Ubuntu Server 22.04 or 24.04 LTS  
- **Security group inbound:**  
  - **22** — SSH (your IP only, if possible)  
  - **80** — HTTP  
  - **443** — optional, for HTTPS after you add a domain  
- Allocate or associate an **Elastic IP** so `MONGO_URI` / Google OAuth origins do not break when the IP changes.

---

## 2. One-time server setup

SSH in, clone the repo, then run the bootstrap script from the repo:

```bash
git clone https://github.com/Akash-K-2424/Team14.git ~/resume-builder
cd ~/resume-builder
chmod +x deploy/ec2-bootstrap.sh && ./deploy/ec2-bootstrap.sh
```

---

## 3. Configure environment

```bash
cp server/.env.example server/.env
nano server/.env
```

Set at minimum:

| Variable | Notes |
|----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | `5001` (default; nginx proxies here) |
| `MONGO_URI` | Atlas connection string or Mongo on the same VPC |
| `JWT_SECRET` | Long random string |
| `CLIENT_URL` | Exact browser URL, e.g. `http://ec2-…amazonaws.com` or `https://yourdomain.com` |
| `GEMINI_API_KEY` | Optional; AI falls back if empty |
| SMTP vars | For real OTP emails; set `ALLOW_DEV_OTP_FALLBACK=false` in production |

Frontend **build-time** variables:

```bash
cp client/.env.production.example client/.env.production
nano client/.env.production
```

Set `VITE_GOOGLE_CLIENT_ID` if you use Google login. In **Google Cloud Console → Credentials → OAuth 2.0 Client**, add **Authorized JavaScript origins** matching `CLIENT_URL` (scheme + host, no path).

---

## 4. Install, build, run

```bash
cd ~/resume-builder   # your clone path
npm ci --prefix server
npm ci --prefix client
npm run build --prefix client
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup    # follow the printed command so PM2 survives reboot
```

---

## 5. Nginx

```bash
sudo cp deploy/nginx-resuai.conf /etc/nginx/sites-available/resuai
sudo ln -sf /etc/nginx/sites-available/resuai /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

When you have a domain, edit `server_name` in that file and use **Certbot** for HTTPS.

---

## 6. Verify

```bash
curl -s http://127.0.0.1:5001/api/health
curl -s http://localhost/api/health
```

Open `http://YOUR_EC2_PUBLIC_DNS` in a browser.

---

## Updates after `git pull`

```bash
cd ~/resume-builder
git pull
npm ci --prefix server && npm ci --prefix client
npm run build --prefix client
pm2 restart resuai
```

---

## Troubleshooting

- **502 from nginx:** Node is down — `pm2 logs resuai`. Check `MONGO_URI` and Atlas IP allowlist.  
- **CORS errors:** `CLIENT_URL` must exactly match the URL in the address bar (including `http` vs `https`).  
- **Google Sign-In fails:** JavaScript origins / OAuth client must match production URL.  
- **Blank page:** Ensure `NODE_ENV=production` and `client/dist` exists (`npm run build --prefix client`).
