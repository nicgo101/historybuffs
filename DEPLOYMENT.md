# HistoryBuff Deployment Guide

## Architecture Overview

```
                    MANAGED (Free Tiers)
    ┌─────────────────────────────────────────┐
    │   Vercel          Supabase              │
    │   (Frontend)      (DB/Auth/Storage)     │
    └─────────┬─────────────────┬─────────────┘
              │                 │
              │    Internet     │
              ▼                 ▼
    ┌─────────────────────────────────────────┐
    │         YOUR HETZNER SERVER             │
    │   ┌─────────────────────────────────┐   │
    │   │  Caddy (Reverse Proxy, SSL)     │   │
    │   │  api.yourdomain.com             │   │
    │   └───────────────┬─────────────────┘   │
    │                   │                     │
    │   ┌───────────────▼─────────────────┐   │
    │   │  FastAPI + Celery + Redis       │   │
    │   │  (Docker Compose)               │   │
    │   └─────────────────────────────────┘   │
    └─────────────────────────────────────────┘
```

## Prerequisites

1. **Hetzner VPS** (CX31 - 2vCPU, 8GB RAM)
2. **Domain** pointed to your server
3. **Supabase account** (free tier)
4. **Vercel account** (free tier)

## Quick Start

### 1. Server Setup (Hetzner)

SSH into your server:

```bash
ssh root@your-server-ip
```

Install Docker:

```bash
curl -fsSL https://get.docker.com | sh
apt install docker-compose-plugin
```

Clone the repository:

```bash
git clone https://github.com/your-username/historybuff.git
cd historybuff
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env
```

Fill in your values:
- `SUPABASE_URL` - From Supabase dashboard
- `SUPABASE_ANON_KEY` - From Supabase dashboard > Settings > API
- `SUPABASE_SERVICE_KEY` - From Supabase dashboard > Settings > API
- `DATABASE_URL` - From Supabase dashboard > Settings > Database
- `SECRET_KEY` - Generate with `openssl rand -hex 32`
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` - Your AI API key

### 3. Configure Domain

Edit `Caddyfile`:

```bash
nano Caddyfile
```

Replace `api.yourdomain.com` with your actual domain.

### 4. Start Services

```bash
docker compose up -d
```

Check logs:

```bash
docker compose logs -f
```

### 5. Verify Deployment

```bash
# Health check
curl https://api.yourdomain.com/health

# Should return:
# {"status": "healthy", "environment": "production"}
```

## Service Management

### View logs

```bash
docker compose logs -f api          # API logs
docker compose logs -f celery_worker # Worker logs
docker compose logs -f caddy        # Proxy logs
```

### Restart services

```bash
docker compose restart api
docker compose restart celery_worker
```

### Update deployment

```bash
git pull
docker compose build
docker compose up -d
```

### Stop everything

```bash
docker compose down
```

## Supabase Setup

### 1. Create Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your project URL and API keys

### 2. Run Migrations

From your local machine with `psql`:

```bash
# Get connection string from Supabase Dashboard > Settings > Database
psql "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" -f backend/migrations/001_initial.sql
```

Or use the Supabase SQL Editor in the dashboard.

### 3. Enable pgvector

In Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Vercel Setup (Frontend)

### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Import your repository
3. Set root directory to `frontend`

### 2. Environment Variables

Add in Vercel dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### 3. Deploy

Push to main branch - Vercel will auto-deploy.

## Monitoring

### Enable Flower (Task Monitoring)

Uncomment the `flower` service in `docker-compose.yml`:

```yaml
flower:
  image: mher/flower:2.0
  ...
```

Add to `.env`:

```
FLOWER_USER=admin
FLOWER_PASSWORD=your-secure-password
```

Restart:

```bash
docker compose up -d
```

Access at `https://flower.yourdomain.com` (add to Caddyfile first).

### Resource Monitoring

```bash
# Docker stats
docker stats

# System resources
htop
```

## Troubleshooting

### Container won't start

```bash
docker compose logs api
docker compose logs celery_worker
```

### Database connection issues

Check `DATABASE_URL` format:
```
postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
```

### SSL certificate issues

Caddy handles SSL automatically. If issues:

```bash
docker compose logs caddy
docker compose restart caddy
```

### Out of memory

Check which service is using memory:

```bash
docker stats
```

Reduce Celery concurrency in `docker-compose.yml`:

```yaml
command: celery -A app.worker worker --loglevel=info --concurrency=1
```

## Scaling

### More extraction capacity

Upgrade Hetzner to CX41 (16GB RAM), then:

1. Increase Celery workers: `--concurrency=4`
2. Optionally add Ollama for local LLM

### Multiple servers

For high scale, consider:
1. Separate server for workers
2. Managed Redis (Upstash)
3. Load balancer for API

## Costs

| Service | Monthly Cost |
|---------|-------------|
| Hetzner CX31 | ~€12 |
| Vercel Free | $0 |
| Supabase Free | $0 |
| AI APIs | $50-100 |
| **Total** | **~$65-115** |
