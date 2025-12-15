# HistoryBuff Setup Checklist

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        SERVICES                              │
├─────────────────────────────────────────────────────────────┤
│  Supabase (Free)     │  Database, Auth, Storage             │
│  Vercel (Free)       │  Frontend hosting                    │
│  Hetzner (€12/mo)    │  Backend API + Workers               │
│  Domain              │  Your domain for API                 │
│  AI API              │  Claude or OpenAI key                │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Supabase Setup

### Create Project
- [ ] Go to [supabase.com](https://supabase.com) and sign up
- [ ] Click "New Project"
- [ ] Choose organization (or create one)
- [ ] Project name: `historybuff` (or your choice)
- [ ] Database password: Generate strong password, **save it**
- [ ] Region: Choose closest to your users (EU for Hetzner)
- [ ] Click "Create new project" (takes ~2 minutes)

### Get API Keys
- [ ] Go to Settings → API
- [ ] Copy and save:
  - `Project URL` → `SUPABASE_URL`
  - `anon public` key → `SUPABASE_ANON_KEY`
  - `service_role` key → `SUPABASE_SERVICE_KEY` (keep secret!)

### Get Database Connection
- [ ] Go to Settings → Database
- [ ] Copy "Connection string" (URI format)
- [ ] Replace `[YOUR-PASSWORD]` with your database password
- [ ] This is your `DATABASE_URL`

### Get JWT Secret
- [ ] Go to Settings → API
- [ ] Scroll to "JWT Settings"
- [ ] Copy "JWT Secret" → `SUPABASE_JWT_SECRET`

### Enable Extensions
- [ ] Go to Database → Extensions
- [ ] Enable `vector` (for embeddings)
- [ ] Enable `pg_trgm` (for fuzzy search)

### Create Database Schema
- [ ] Go to SQL Editor
- [ ] Run initial migration (we'll create this file)

### Summary - Save These Values
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
SUPABASE_JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

---

## 2. Domain Setup

### Option A: Buy New Domain
- [ ] Buy domain from Namecheap, Cloudflare, or Porkbun
- [ ] Suggested: `historybuff.io`, `historybuff.app`, or similar

### Option B: Use Subdomain of Existing Domain
- [ ] Use `api.yourdomain.com` for backend

### DNS Configuration
- [ ] Add A record pointing to your Hetzner server IP:
  ```
  Type: A
  Name: api (or @ for root)
  Value: YOUR_HETZNER_IP
  TTL: 3600
  ```
- [ ] Wait for DNS propagation (5-30 minutes)
- [ ] Verify: `ping api.yourdomain.com`

---

## 3. Hetzner Setup

### Server (if not already have one)
- [ ] Go to [hetzner.com/cloud](https://www.hetzner.com/cloud)
- [ ] Create new project
- [ ] Add new server:
  - Location: Nuremberg or Falkenstein (EU)
  - Image: Ubuntu 22.04
  - Type: CX31 (2 vCPU, 8GB RAM) - €12/mo
  - SSH key: Add your public key
- [ ] Note the IP address

### Server Setup
SSH into your server:
```bash
ssh root@YOUR_SERVER_IP
```

- [ ] Update system:
  ```bash
  apt update && apt upgrade -y
  ```

- [ ] Install Docker:
  ```bash
  curl -fsSL https://get.docker.com | sh
  ```

- [ ] Install Docker Compose:
  ```bash
  apt install docker-compose-plugin
  ```

- [ ] Verify installation:
  ```bash
  docker --version
  docker compose version
  ```

- [ ] Create app directory:
  ```bash
  mkdir -p /opt/historybuff
  cd /opt/historybuff
  ```

- [ ] Clone repository:
  ```bash
  git clone https://github.com/nicgo101/historybuffs.git .
  ```
  (Or copy files via SCP)

- [ ] Create environment file:
  ```bash
  cp .env.example .env
  nano .env
  ```

- [ ] Fill in all values from Supabase setup

- [ ] Update Caddyfile with your domain:
  ```bash
  nano Caddyfile
  # Replace api.yourdomain.com with your actual domain
  ```

- [ ] Start services:
  ```bash
  docker compose up -d
  ```

- [ ] Check logs:
  ```bash
  docker compose logs -f
  ```

- [ ] Verify API is running:
  ```bash
  curl https://api.yourdomain.com/health
  ```

### Firewall (Optional but Recommended)
- [ ] In Hetzner Cloud Console → Firewalls
- [ ] Create firewall with rules:
  ```
  Inbound:
  - TCP 22 (SSH)
  - TCP 80 (HTTP - for SSL redirect)
  - TCP 443 (HTTPS)

  Outbound:
  - All allowed
  ```
- [ ] Apply to your server

---

## 4. Vercel Setup

### Connect Repository
- [ ] Go to [vercel.com](https://vercel.com) and sign up
- [ ] Click "Add New Project"
- [ ] Import from GitHub: `nicgo101/historybuffs`
- [ ] Configure:
  - Framework: Next.js
  - Root directory: `frontend` (when we create it)
- [ ] Click Deploy

### Environment Variables
- [ ] Go to Project Settings → Environment Variables
- [ ] Add:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
  NEXT_PUBLIC_API_URL=https://api.yourdomain.com
  ```

### Custom Domain (Optional)
- [ ] Go to Project Settings → Domains
- [ ] Add your domain (e.g., `historybuff.com`)
- [ ] Follow DNS instructions

---

## 5. AI API Setup

### Option A: Anthropic (Claude) - Recommended
- [ ] Go to [console.anthropic.com](https://console.anthropic.com)
- [ ] Create account
- [ ] Go to API Keys
- [ ] Create new key → `ANTHROPIC_API_KEY`
- [ ] Add payment method (pay per use)

### Option B: OpenAI
- [ ] Go to [platform.openai.com](https://platform.openai.com)
- [ ] Create account
- [ ] Go to API Keys
- [ ] Create new key → `OPENAI_API_KEY`
- [ ] Add payment method

### Add to Hetzner
- [ ] SSH into server
- [ ] Edit `.env`:
  ```bash
  nano /opt/historybuff/.env
  ```
- [ ] Add your API key(s)
- [ ] Restart services:
  ```bash
  docker compose restart
  ```

---

## 6. Final Verification

### Backend Health Check
```bash
curl https://api.yourdomain.com/health
# Should return: {"status": "healthy", "environment": "production"}

curl https://api.yourdomain.com/health/ready
# Should return: {"status": "ready", "checks": {...}}
```

### Check All Services Running
```bash
ssh root@YOUR_SERVER_IP
docker compose ps
# All should show "Up"
```

### Test Database Connection
```bash
docker compose logs api | grep -i database
# Should show successful connection
```

### Test Celery Workers
```bash
docker compose logs celery_worker
# Should show "ready" and "celery@... ready"
```

---

## Quick Reference

### Environment Variables Summary
```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
SUPABASE_JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres

# App
SECRET_KEY=generate-random-32-char-string
ENVIRONMENT=production

# AI (at least one)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Frontend
FRONTEND_URL=https://yourdomain.com
```

### Useful Commands
```bash
# View logs
docker compose logs -f

# Restart everything
docker compose restart

# Update deployment
git pull && docker compose build && docker compose up -d

# Check resource usage
docker stats
```

### Costs Summary
| Service | Monthly Cost |
|---------|-------------|
| Supabase Free | $0 |
| Vercel Free | $0 |
| Hetzner CX31 | ~€12 |
| Domain | ~$1 (yearly) |
| AI APIs | $50-100 |
| **Total** | **~$65-115** |

---

## Troubleshooting

### "Connection refused" on API
- Check Caddy is running: `docker compose logs caddy`
- Check DNS is pointing to server: `dig api.yourdomain.com`
- Check firewall allows 443

### "Unauthorized" errors
- Verify SUPABASE_JWT_SECRET matches
- Check token is being passed in Authorization header

### Celery tasks not processing
- Check Redis is running: `docker compose logs redis`
- Check worker logs: `docker compose logs celery_worker`

### Out of memory
- Check usage: `docker stats`
- Reduce Celery concurrency in docker-compose.yml
