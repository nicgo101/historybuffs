# HistoryBuff - Project Context for Claude

## Project Overview

HistoryBuff is a historical research platform that structures historical knowledge differently. Every claim is linked to its sources, with confidence scores calculated from source quality, independence, and corroboration. Key differentiator: **frame-dependent dating** - the same factoid can have different dates depending on which chronological framework you view it through.

**Core Value Proposition**: "See the structure of historical knowledge - where it comes from, how confident we can be, and where it fails."

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        SERVICES                              │
├─────────────────────────────────────────────────────────────┤
│  Supabase (Free)     │  Database, Auth, Storage             │
│  Vercel (Free)       │  Frontend hosting                    │
│  Hetzner (€12/mo)    │  Backend API + Celery Workers        │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

**Frontend** (`/frontend`):
- Next.js 16 with App Router
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase SSR client for auth

**Backend** (`/backend`):
- Python FastAPI
- Celery + Redis for background tasks
- Sentence Transformers for embeddings (all-MiniLM-L6-v2, 384 dims)
- Docker Compose deployment

**Database** (Supabase PostgreSQL):
- pgvector extension for semantic search
- pg_trgm for fuzzy text search
- Row Level Security enabled

## Key Concepts

### Frame-Dependent Dating
Factoids store **raw observations** (frame-independent). Dates are stored in `factoid_placements` table, linked to a `reference_frame`. MVP has two frames:
- **Default Academic**: Mainstream scholarly chronology
- **Evidence-Based**: Only trusts scientific dating methods

### Data Model (Simplified)
- `factoids` - Core historical claims (frame-independent)
- `factoid_placements` - Frame-dependent date assignments
- `sources` - Historical documents/references
- `source_citations` - Citation tree (who cites whom)
- `factoid_sources` - Links factoids to their evidence
- `actors` - People, institutions, groups
- `locations` - Geographic entities
- `connections` - Relationships between entities

## Current Deployment

### Backend (Hetzner)
- **Server**: 95.216.207.29
- **Domain**: https://hib.resiliens.se
- **SSH**: `ssh -i ~/.ssh/hetzner_historybuff root@95.216.207.29`
- **App location**: `/opt/historybuff`
- **Services**: Docker Compose (api, redis, celery_worker, celery_beat, caddy)

### Database (Supabase)
- **Project**: oiictwkyoizafbnicelw
- **URL**: https://oiictwkyoizafbnicelw.supabase.co
- **Schema**: MVP tables created via migrations in `/backend/migrations/`

### Frontend (Vercel)
- Not yet deployed
- Ready for deployment from `/frontend` directory

## Skills

Custom skills for Claude Code are stored in `.claude/skills/`:
- [frontend-design.md](.claude/skills/frontend-design.md) - Distinctive, production-grade UI design guidelines

## File Structure

```
historybuff/
├── backend/
│   ├── app/
│   │   ├── api/routes/       # FastAPI endpoints (stubs)
│   │   ├── core/config.py    # Settings from env
│   │   ├── main.py           # FastAPI app
│   │   └── worker.py         # Celery tasks
│   ├── migrations/           # SQL migrations for Supabase
│   │   ├── 001_extensions.sql
│   │   ├── 002_mvp_schema.sql
│   │   └── 003_seed_data.sql
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   ├── components/       # React components
│   │   └── lib/              # Supabase client, API utils
│   └── .env.local            # Environment variables
├── Vision/                   # Design docs (extensive)
├── docker-compose.yml
├── Caddyfile
├── .env                      # Backend env (has secrets)
├── .env.example
├── SETUP-CHECKLIST.md
└── DEPLOYMENT.md
```

## Environment Variables

### Backend (.env)
```
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
DATABASE_URL (direct postgres connection)
SECRET_KEY, ENVIRONMENT=production
ANTHROPIC_API_KEY, OPENAI_API_KEY
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_API_URL=https://hib.resiliens.se
```

## Common Commands

### Server Management
```bash
# SSH to server
ssh -i ~/.ssh/hetzner_historybuff root@95.216.207.29

# On server - manage services
cd /opt/historybuff
docker compose ps
docker compose logs -f [service]
docker compose restart [service]
docker compose up -d --build
```

### Local Development
```bash
# Frontend
cd frontend && npm run dev

# Copy files to server
scp -i ~/.ssh/hetzner_historybuff file root@95.216.207.29:/opt/historybuff/
```

## Current State (as of Dec 2024)

### Completed
- [x] Hetzner server setup with Docker
- [x] Backend API deployed (FastAPI + Celery + Redis + Caddy)
- [x] SSL certificates working (hib.resiliens.se)
- [x] Supabase project configured
- [x] Database schema created (MVP tables)
- [x] Frontend scaffolded (Next.js + shadcn/ui + Supabase auth)

### Pending
- [ ] Deploy frontend to Vercel
- [ ] Wire backend API routes to Supabase (currently stubs)
- [ ] Implement actual data CRUD operations
- [ ] Add seed data for demo
- [ ] Build extraction pipeline (AI-powered)

## Vision Documents

Extensive design docs in `/Vision/` folder:

### Core
- [00-vision.md](Vision/00-vision.md) - Project vision and goals
- [01-core-concepts.md](Vision/01-core-concepts.md) - Fundamental concepts
- [02-data-model.md](Vision/02-data-model.md) - Comprehensive schema design
- [19-mvp-definition.md](Vision/19-mvp-definition.md) - What to build first

### Systems
- [03-source-system.md](Vision/03-source-system.md) - Source management
- [04-chronology-system.md](Vision/04-chronology-system.md) - Frame-dependent dating
- [05-geographic-system.md](Vision/05-geographic-system.md) - Location handling
- [06-environmental-layer.md](Vision/06-environmental-layer.md) - Environmental data
- [15-confidence-system.md](Vision/15-confidence-system.md) - Confidence scoring

### AI & Extraction
- [07-extraction-pipeline.md](Vision/07-extraction-pipeline.md) - AI extraction
- [08-bias-detection.md](Vision/08-bias-detection.md) - Detecting source bias
- [14-ai-generation.md](Vision/14-ai-generation.md) - AI content generation
- [21-source-reader.md](Vision/21-source-reader.md) - Source reading system
- [22-pipeline-architecture.md](Vision/22-pipeline-architecture.md) - Pipeline design

### Features
- [09-users-community.md](Vision/09-users-community.md) - User and community features
- [10-gamification.md](Vision/10-gamification.md) - Gamification elements
- [11-frames-namespaces.md](Vision/11-frames-namespaces.md) - Frames and namespaces
- [12-family-trees.md](Vision/12-family-trees.md) - Genealogy features
- [13-presentation-mode.md](Vision/13-presentation-mode.md) - Presentation features
- [23-entity-identity.md](Vision/23-entity-identity.md) - Entity identification

### Technical & Business
- [17-tech-stack.md](Vision/17-tech-stack.md) - Technology choices
- [18-business-model.md](Vision/18-business-model.md) - Business model
- [20-content-policy.md](Vision/20-content-policy.md) - Content policies
- [16-federation-future.md](Vision/16-federation-future.md) - Future federation plans

### Working Docs
- [Get-maps.md](Vision/Get-maps.md) - Map data notes
- [get-text.md](Vision/get-text.md) - Text extraction notes
- [get-datasources-recomendations.md](Vision/get-datasources-recomendations.md) - Data source recommendations

## Notes

- Backend API routes at `/api/factoids`, `/api/sources` are stubs - need Supabase integration
- Embedding dimension is 384 (all-MiniLM-L6-v2), not 1536 (OpenAI)
- Auth handled by Supabase - backend validates JWT tokens
- The `ignore.md` file in root is gitignored for temp notes
