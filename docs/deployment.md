# Deployment Guide

This guide takes you from zero to a live app on the internet. No prior experience needed.

---

## Overview

You will:
1. Put your code on GitHub
2. Rent a cheap server ($6/month)
3. Connect to it and start the app
4. (Optional) add a custom domain + HTTPS

The app runs entirely in Docker — the same way it runs on your laptop, just on a remote machine.

---

## Part 1 — Put Your Code on GitHub

You need GitHub so you can push updates to the server without copying files manually.

1. Go to [github.com](https://github.com) → **New repository** → name it `world-cup` → **Private** → **Create**

2. On your laptop, in the project folder, run:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/world-cup.git
   git add .
   git commit -m "initial commit"
   git push -u origin master
   ```

3. Make sure `.env` is in `.gitignore` so your passwords never get uploaded:
   ```
   # .gitignore should already contain:
   .env
   ```

---

## Part 2 — Get a Server

**Recommended: DigitalOcean** — beginner-friendly, $6/month, cancel anytime.

1. Sign up at [digitalocean.com](https://digitalocean.com)
2. Click **Create → Droplets**
3. Settings:
   - **Region**: closest to you / your family
   - **Image**: Ubuntu 24.04 LTS
   - **Size**: Basic → Regular → **$6/month** (1 GB RAM, 1 CPU, 25 GB disk) — enough for this app
   - **Authentication**: Password (easier) or SSH Key (more secure)
4. Click **Create Droplet**
5. Wait ~1 minute — you'll see your server's **IP address** (e.g. `134.122.45.67`)

---

## Part 3 — Connect to Your Server

Open a terminal on your laptop:

```bash
ssh root@YOUR_SERVER_IP
# Enter the password you set (or use your SSH key)
```

You're now inside the server.

---

## Part 4 — Install Docker on the Server

Run these commands one by one (copy-paste them):

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Let your user run Docker without sudo
sudo usermod -aG docker $USER
newgrp docker

# Verify it works
docker --version
docker compose version
```

---

## Part 5 — Download Your Code onto the Server

```bash
# Install git
apt-get install -y git

# Clone your repo
git clone https://github.com/YOUR_USERNAME/world-cup.git /opt/worldcup
cd /opt/worldcup
```

---

## Part 6 — Set Your Environment Variables

This is where you set your passwords and settings. **Never commit this file.**

```bash
cp .env.example .env
nano .env
```

The `nano` editor opens. Change every value:

```env
# Database — pick strong passwords
MYSQL_ROOT_PASSWORD=SomeStrongRootPass123!
MYSQL_DATABASE=worldcup
MYSQL_USER=worldcup
MYSQL_PASSWORD=SomeStrongPass123!
DATABASE_URL=mysql+pymysql://worldcup:SomeStrongPass123!@db:3306/worldcup

# Security — MUST be a long random string
SECRET_KEY=paste-the-output-of-the-command-below-here

# Admin account (created automatically on first start)
ADMIN_NICKNAME=admin
ADMIN_PASSWORD=YourAdminPassword123!
ADMIN_REAL_NAME=Hussein

# App settings
DEBUG=false
CORS_ORIGINS=http://YOUR_SERVER_IP        # use your actual IP here
```

**To generate a secure SECRET_KEY**, open a second terminal and run:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```
Copy the output and paste it as the `SECRET_KEY` value.

**Save and exit nano:** press `Ctrl+X`, then `Y`, then `Enter`.

---

## Part 7 — Update the Nginx Config

The default production config requires HTTPS. For a first deploy without a domain, use the HTTP-only config instead:

```bash
# Tell docker-compose.prod.yml to use the HTTP nginx config
```

Open `docker-compose.prod.yml`:
```bash
nano docker-compose.prod.yml
```

Find the `nginx` service volumes section and change `nginx.prod.conf` to `nginx.http.conf`:

```yaml
  nginx:
    volumes:
      - ./nginx/nginx.http.conf:/etc/nginx/nginx.conf:ro   # ← change this line
      - nginx_logs:/var/log/nginx
```

Also remove the SSL port and volume since we don't need them yet:
```yaml
  nginx:
    ports:
      - "80:80"          # ← keep only port 80, remove "443:443"
    volumes:
      - ./nginx/nginx.http.conf:/etc/nginx/nginx.conf:ro   # no ssl volume needed
      - nginx_logs:/var/log/nginx
```

Save and exit (`Ctrl+X`, `Y`, `Enter`).

---

## Part 8 — Start the App

```bash
cd /opt/worldcup
docker compose -f docker-compose.prod.yml up -d --build
```

This will:
- Build the frontend (takes 1-3 minutes on first run)
- Start MySQL, wait for it to be healthy
- Run database migrations automatically
- Create the admin account
- Start nginx on port 80

Check everything started:
```bash
docker compose -f docker-compose.prod.yml ps
```

You should see all services showing `Up` or `healthy`.

**Open your browser:** go to `http://YOUR_SERVER_IP`

Your app is live. Log in with the `ADMIN_NICKNAME` / `ADMIN_PASSWORD` you set.

---

## Part 9 — Open the Firewall

```bash
ufw allow 22/tcp    # SSH (keep this or you'll get locked out!)
ufw allow 80/tcp    # HTTP
ufw enable
```

---

## Part 10 (Optional) — Custom Domain + HTTPS

If you have a domain name (e.g. from Namecheap, ~$10/year):

### Point your domain to the server

In your domain registrar's DNS settings, add an **A record**:
- Host: `@` (or `www`)
- Value: your server's IP address
- TTL: 3600

Wait 5–30 minutes for DNS to propagate.

### Get a free SSL certificate

```bash
# Stop nginx temporarily
docker compose -f docker-compose.prod.yml stop nginx

# Install certbot
apt-get install -y certbot

# Get the certificate (replace with your actual domain)
certbot certonly --standalone -d yourdomain.com

# Copy certs to where nginx can find them
mkdir -p /opt/worldcup/nginx/ssl
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/worldcup/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem  /opt/worldcup/nginx/ssl/key.pem
chmod 644 /opt/worldcup/nginx/ssl/cert.pem /opt/worldcup/nginx/ssl/key.pem
```

### Switch to the HTTPS nginx config

Edit `docker-compose.prod.yml`, update the nginx service:
```yaml
  nginx:
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - nginx_logs:/var/log/nginx
```

Edit `nginx/nginx.prod.conf` — change `server_name _;` to your domain:
```nginx
server_name yourdomain.com;
```

Update `.env`:
```env
CORS_ORIGINS=https://yourdomain.com
```

### Restart everything

```bash
docker compose -f docker-compose.prod.yml up -d --build
ufw allow 443/tcp
```

### Auto-renew SSL (set up once)

```bash
crontab -e
```
Add this line at the bottom:
```
0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/worldcup/nginx/ssl/cert.pem && cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/worldcup/nginx/ssl/key.pem && docker compose -f /opt/worldcup/docker-compose.prod.yml exec nginx nginx -s reload
```

---

## Pushing Updates

When you make changes on your laptop:

### 1. On your laptop — push to GitHub
```bash
git add .
git commit -m "describe what you changed"
git push
```

### 2. On the server — pull and redeploy
```bash
cd /opt/worldcup
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

The `--build` flag rebuilds the containers with your new code. The database is preserved (it lives in a Docker volume).

> Tip: this takes 1-2 minutes. The app goes briefly offline during the rebuild.

---

## Environment Variables — Full Reference

| Variable | What it does | Example |
|---|---|---|
| `MYSQL_ROOT_PASSWORD` | MySQL root password | `StrongRoot123!` |
| `MYSQL_DATABASE` | Database name | `worldcup` |
| `MYSQL_USER` | Database user | `worldcup` |
| `MYSQL_PASSWORD` | Database user password | `StrongPass123!` |
| `DATABASE_URL` | Full DB connection string | `mysql+pymysql://worldcup:pass@db:3306/worldcup` |
| `SECRET_KEY` | JWT signing key — must be long and random | 64-char hex string |
| `ACCESS_TOKEN_EXPIRE_DAYS` | How long login sessions last | `7` |
| `ADMIN_NICKNAME` | Admin login username | `admin` |
| `ADMIN_PASSWORD` | Admin login password | `YourAdminPass!` |
| `ADMIN_REAL_NAME` | Admin display name | `Hussein` |
| `CORS_ORIGINS` | Allowed frontend origins | `https://yourdomain.com` |
| `DEBUG` | Enable debug mode | `false` (always in production) |

**To change a variable after first deploy:**
```bash
nano /opt/worldcup/.env
# make your change
docker compose -f /opt/worldcup/docker-compose.prod.yml up -d
```

Note: changing `ADMIN_PASSWORD` in `.env` after first startup does NOT change the admin's password — that only works on the very first run. To reset the admin password, use the database directly (see below).

---

## Accessing Logs

### App logs (backend application)

```bash
# Live stream — press Ctrl+C to stop
docker compose -f docker-compose.prod.yml logs -f backend

# All info-level logs (rotated daily, kept 30 days)
tail -f /opt/worldcup/logs/app.log

# Errors only
tail -f /opt/worldcup/logs/error.log

# Search logs for a specific user
grep "Hussein" /opt/worldcup/logs/app.log
```

### Nginx logs (web traffic)

```bash
# Live web traffic
docker compose -f docker-compose.prod.yml logs -f nginx

# See all 4xx/5xx errors
docker compose -f docker-compose.prod.yml logs nginx | grep " [45][0-9][0-9] "
```

### Database logs

```bash
docker compose -f docker-compose.prod.yml logs -f db
```

### All services at once

```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Check service health

```bash
docker compose -f docker-compose.prod.yml ps
```

---

## Useful Commands

```bash
# Stop everything
docker compose -f docker-compose.prod.yml down

# Restart one service (e.g. after a config change)
docker compose -f docker-compose.prod.yml restart nginx

# Open a MySQL shell (to inspect data)
docker compose -f docker-compose.prod.yml exec db mysql -u worldcup -p worldcup

# Run a migration manually
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Reset admin password from MySQL shell
# UPDATE users SET hashed_password='<bcrypt_hash>' WHERE nickname='admin';

# See how much disk/CPU/RAM the app uses
docker stats
```

### Database backup

```bash
# Manual backup
docker compose -f docker-compose.prod.yml exec -T db \
  mysqldump -u root -p${MYSQL_ROOT_PASSWORD} worldcup > backup_$(date +%Y%m%d).sql
```

### Restore from backup

```bash
docker compose -f docker-compose.prod.yml exec -T db \
  mysql -u root -p${MYSQL_ROOT_PASSWORD} worldcup < backup_20250518.sql
```
