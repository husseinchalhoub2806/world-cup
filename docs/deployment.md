# Deployment Guide

## VPS Setup (Ubuntu 22.04)

### 1. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Install Docker Compose

```bash
sudo apt-get install -y docker-compose-plugin
docker compose version
```

### 3. Clone and configure

```bash
git clone <your-repo> /opt/worldcup
cd /opt/worldcup

cp .env.example .env
nano .env   # Set all values — especially SECRET_KEY and passwords
```

**Critical `.env` settings for production:**
```
SECRET_KEY=<generate with: python3 -c "import secrets; print(secrets.token_hex(32))">
ADMIN_PASSWORD=<strong password>
MYSQL_ROOT_PASSWORD=<strong password>
MYSQL_PASSWORD=<strong password>
CORS_ORIGINS=https://yourdomain.com
VITE_API_URL=https://yourdomain.com
DEBUG=false
```

### 4. Start production stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## HTTPS with Let's Encrypt (Certbot)

### Install Certbot
```bash
sudo apt install -y certbot
```

### Get certificate
```bash
# Temporarily stop nginx if running
sudo certbot certonly --standalone -d yourdomain.com
```

### Copy certificates to nginx/ssl/
```bash
mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
sudo chmod 644 nginx/ssl/cert.pem nginx/ssl/key.pem
```

### Update nginx.prod.conf
Change `server_name _;` to `server_name yourdomain.com;`

### Auto-renewal
```bash
# Add to crontab
0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/worldcup/nginx/ssl/cert.pem && cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/worldcup/nginx/ssl/key.pem && docker compose -f /opt/worldcup/docker-compose.prod.yml exec nginx nginx -s reload
```

---

## One-Command Restart

```bash
cd /opt/worldcup
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Accessing Logs

```bash
# Live backend logs
docker compose -f docker-compose.prod.yml logs -f backend

# Log files (rotate daily, kept 30 days)
tail -f logs/app.log
tail -f logs/error.log

# Nginx logs
docker compose -f docker-compose.prod.yml logs -f nginx
```

---

## Database Backups

### Manual backup
```bash
docker compose -f docker-compose.prod.yml exec db \
  mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Automated daily backup (crontab)
```bash
0 2 * * * cd /opt/worldcup && docker compose -f docker-compose.prod.yml exec -T db mysqldump -u root -p$(grep MYSQL_ROOT_PASSWORD .env | cut -d= -f2) $(grep MYSQL_DATABASE .env | cut -d= -f2) > backups/backup_$(date +\%Y\%m\%d).sql && find backups/ -name "*.sql" -mtime +30 -delete
```

Create the backups directory first: `mkdir -p /opt/worldcup/backups`

### Restore from backup
```bash
docker compose -f docker-compose.prod.yml exec -T db \
  mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} < backup_20240101_020000.sql
```

---

## Useful Commands

```bash
# Check service health
docker compose -f docker-compose.prod.yml ps

# Run database migrations manually
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Open a MySQL shell
docker compose -f docker-compose.prod.yml exec db mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE}

# Reset admin password (from MySQL shell)
# UPDATE users SET hashed_password='<new_bcrypt_hash>' WHERE nickname='admin';

# View real-time resource usage
docker stats
```

---

## Firewall (UFW)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
# Never expose port 3306 (MySQL) or 8000 (FastAPI) directly
```
