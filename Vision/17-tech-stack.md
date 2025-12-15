# Tech Stack

## Overview

Technology choices optimized for: rapid MVP development, scalability to production, reasonable costs, and not foreclosing future options (including federation).

**Primary stack**: Supabase + Next.js/SvelteKit + D3/Mapbox

---

## Guiding Principles

### 1. Start Simple, Scale Later
Don't over-engineer for scale we don't have. Optimize for development speed now; refactor when needed.

### 2. Leverage Managed Services
For MVP, use managed services (Supabase, Vercel). Control costs, reduce ops burden. Self-host later if needed.

### 3. Open Standards
Where possible, use open standards and avoid lock-in. PostgreSQL over proprietary DB. Standard APIs over custom protocols.

### 4. Developer Experience
Fast iteration matters. Choose tools that enable quick development, good debugging, and easy deployment.

---

## Backend

### Architecture Decision: Python + Supabase

**Why Python backend instead of Edge Functions:**
- The extraction pipeline IS the core product differentiation
- AI/ML ecosystem is Python-first (sentence-transformers, LangChain, OCR libraries)
- Complex pipelines need proper backend, not serverless limitations
- FastAPI provides modern async Python with excellent DX

**Why keep Supabase:**
- PostgreSQL with pgvector - excellent for our needs
- Auth system - JWT validation works with any backend
- Storage - S3-compatible API accessible from Python
- Realtime - WebSocket subscriptions for frontend
- Self-hostable for open source deployment

### Database: Supabase (PostgreSQL)

```yaml
database:
  engine: "PostgreSQL 15"
  extensions:
    - pgvector  # Vector embeddings for semantic search
    - pg_trgm   # Fuzzy text search
    - uuid-ossp # UUID generation
  connection: "Direct from FastAPI via asyncpg"

auth:
  provider: "Supabase Auth"
  methods:
    - Email/password
    - Magic link
    - OAuth (Google, GitHub)
  backend_integration: "Validate Supabase JWTs in FastAPI middleware"

storage:
  provider: "Supabase Storage"
  use_cases:
    - Document uploads (sources, PDFs)
    - Generated images
    - Export files
  backend_integration: "S3-compatible API from Python"

realtime:
  use_cases:
    - Pipeline progress updates
    - Collaboration notifications
    - Activity feeds
  note: "Frontend subscribes directly to Supabase Realtime"
```

### API Server: Python + FastAPI

**Why FastAPI:**
- Modern async Python (asyncio native)
- Automatic OpenAPI documentation
- Pydantic for data validation and serialization
- Dependency injection for clean architecture
- Excellent performance (one of fastest Python frameworks)

```yaml
framework: "FastAPI"
python_version: "3.11+"

key_libraries:
  database:
    - asyncpg  # Async PostgreSQL driver
    - sqlalchemy  # ORM (async mode)
    - alembic  # Migrations

  ai_ml:
    - sentence-transformers  # Embeddings
    - anthropic  # Claude API
    - openai  # GPT/embeddings API
    - langchain  # Optional, for complex chains

  extraction:
    - pytesseract  # OCR
    - easyocr  # Alternative OCR
    - pypdf2  # PDF processing
    - beautifulsoup4  # HTML parsing

  utilities:
    - pydantic  # Data validation
    - httpx  # Async HTTP client
    - python-jose  # JWT handling

project_structure:
  app/
    ├── main.py           # FastAPI app entry
    ├── api/
    │   ├── routes/       # API endpoints
    │   ├── deps.py       # Dependencies (auth, db)
    │   └── middleware.py # Auth middleware
    ├── core/
    │   ├── config.py     # Settings
    │   └── security.py   # JWT validation
    ├── models/           # SQLAlchemy models
    ├── schemas/          # Pydantic schemas
    ├── services/         # Business logic
    └── pipeline/         # Extraction pipeline
        ├── nodes/        # Pipeline node implementations
        ├── workflows/    # Workflow definitions
        └── executor.py   # Pipeline runner
```

### Authentication Flow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Browser   │      │  Supabase   │      │   FastAPI   │
│  (Next.js)  │      │    Auth     │      │   Backend   │
└──────┬──────┘      └──────┬──────┘      └──────┬──────┘
       │                    │                    │
       │  1. Login          │                    │
       │───────────────────>│                    │
       │                    │                    │
       │  2. JWT Token      │                    │
       │<───────────────────│                    │
       │                    │                    │
       │  3. API Request + JWT Header            │
       │────────────────────────────────────────>│
       │                    │                    │
       │                    │  4. Validate JWT   │
       │                    │  (using Supabase   │
       │                    │   public key)      │
       │                    │                    │
       │  5. Response       │                    │
       │<────────────────────────────────────────│
```

```python
# FastAPI JWT validation middleware
from fastapi import Depends, HTTPException
from jose import jwt
import httpx

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Validate Supabase JWT and extract user."""
    try:
        # Supabase JWTs can be validated with their public key
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401)
        return User(id=user_id, email=payload.get("email"))
    except jwt.JWTError:
        raise HTTPException(status_code=401)
```

**Schema considerations:**
```sql
-- CORE DATA vs FRAME DATA separation
-- Core Data: factoids, sources, actors, locations (frame-independent)
-- Frame Data: placements, extensions (frame-dependent)

-- Core Data tables - shared by all frames
-- Factoids store raw observations without dates
CREATE TABLE factoids (
    id UUID PRIMARY KEY,
    raw_observation TEXT NOT NULL,
    source_id UUID REFERENCES sources(id),
    -- NO date columns here - dates live in placements
    embedding vector(1536)  -- For semantic search
);

-- Frame Data tables - frame-specific interpretations
CREATE TABLE factoid_placements (
    id UUID PRIMARY KEY,
    factoid_id UUID REFERENCES factoids(id),
    frame_id UUID REFERENCES reference_frames(id),
    year_point INTEGER,
    confidence DECIMAL(3,2),
    anchor_chain_id UUID
    -- Each frame can place same factoid differently
);

-- Vector search on factoids (Core Data)
CREATE INDEX idx_factoids_embedding ON factoids
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Full-text search on raw observations
CREATE INDEX idx_factoids_fts ON factoids
    USING gin(to_tsvector('english', raw_observation));

-- Fast frame lookups
CREATE INDEX idx_placements_frame ON factoid_placements(frame_id);
CREATE INDEX idx_placements_factoid ON factoid_placements(factoid_id);

-- Row-level security
ALTER TABLE factoids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON factoids
    FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Authenticated insert" ON factoids
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

### API: REST (FastAPI)

**Primary: REST API**
```yaml
implementation: "FastAPI with automatic OpenAPI docs"
style: "RESTful with consistent patterns"
docs: "Auto-generated at /docs (Swagger) and /redoc"

endpoints:
  # Core Data endpoints (frame-independent)
  factoids:
    - GET /api/factoids
    - GET /api/factoids/{id}
    - POST /api/factoids
    - PATCH /api/factoids/{id}
    - DELETE /api/factoids/{id}
    - GET /api/factoids/{id}/sources
    - GET /api/factoids/{id}/placements  # All frame placements

  sources:
    - GET /api/sources
    - GET /api/sources/{id}
    - GET /api/sources/{id}/tree
    - POST /api/sources

  # Frame-dependent endpoints
  frames:
    - GET /api/frames  # List available frames
    - GET /api/frames/{id}
    - POST /api/frames  # Create custom frame
    - GET /api/frames/{id}/placements?factoid={id}  # Placement in frame

  placements:
    - GET /api/placements?frame={frame}&factoid={id}
    - POST /api/placements  # Add placement to frame
    - GET /api/placements/{id}/confidence  # Frame-specific confidence

  # Lens endpoints
  lenses:
    - GET /api/lenses  # Browse lenses
    - GET /api/lenses/{id}
    - POST /api/lenses  # Create lens
    - GET /api/lenses/{id}/factoids?frame={frame}  # Lens contents with frame

  # Community endpoints
  communities:
    - GET /api/communities
    - GET /api/communities/{id}
    - POST /api/communities
    - GET /api/communities/{id}/members

  # Search and timeline (frame-aware)
  search:
    - GET /api/search?q={query}&frame={frame}&filters=...
    - POST /api/search/semantic

  timeline:
    - GET /api/timeline?start={date}&end={date}&frame={frame}
    - GET /api/timeline/compare?frames={frame1,frame2}  # Multi-frame comparison
```

**Optional: GraphQL**
```yaml
consideration: "Add later if complex nested queries become common"
implementation: "Supabase has GraphQL support via pg_graphql"
use_cases:
  - Complex relationship traversal
  - Mobile clients with bandwidth concerns
  - Flexible frontend queries
```

### Background Jobs & Task Queue

**Python Task Queue Options:**

```yaml
option_a_celery:
  description: "Industry standard Python task queue"
  pros:
    - "Battle-tested, massive ecosystem"
    - "Rich feature set (scheduling, retries, chains)"
    - "Multiple broker support (Redis, RabbitMQ)"
    - "Excellent monitoring (Flower)"
  cons:
    - "Can be complex to configure"
    - "Heavier weight"
  best_for: "Production workloads, complex pipelines"

option_b_arq:
  description: "Modern async Python task queue"
  pros:
    - "Async-native (works great with FastAPI)"
    - "Simple, lightweight"
    - "Redis-based"
    - "Good for async workloads"
  cons:
    - "Smaller ecosystem than Celery"
    - "Fewer advanced features"
  best_for: "MVP, simpler pipelines"

option_c_dramatiq:
  description: "Simple, reliable task queue"
  pros:
    - "Simpler than Celery"
    - "Good defaults"
    - "Multiple broker support"
  cons:
    - "Less feature-rich"
  best_for: "Middle ground"

option_d_temporal:
  description: "Workflow orchestration platform"
  pros:
    - "Enterprise-grade reliability"
    - "Complex workflow support"
    - "Durable execution, versioning"
    - "Python SDK available"
  cons:
    - "Complex setup"
    - "Overkill for MVP"
  best_for: "Enterprise scale"
```

**Recommendation: Celery + Redis**
- Proven at scale, extensive documentation
- Handles our complex pipeline orchestration needs
- Celery Canvas for workflow composition (chains, groups, chords)
- Easy to monitor with Flower

### Worker Architecture (Extraction Pipelines)

**The Problem:**
The adaptive extraction pipeline (see 22-pipeline-architecture.md) requires:
- Long-running jobs (minutes to hours for large documents)
- Complex orchestration with branching/routing
- Pipeline state persistence across nodes
- Parallel processing capabilities
- Retry/error handling with recovery

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│                      JOB ORCHESTRATION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │  FastAPI    │────▶│   Redis     │────▶│   Celery    │       │
│  │  (Trigger)  │     │  (Broker)   │     │  (Workers)  │       │
│  └─────────────┘     └─────────────┘     └──────┬──────┘       │
│                                                  │               │
│                                          ┌──────▼──────┐        │
│                                          │  Pipeline   │        │
│                                          │   State     │        │
│                                          │  (Postgres) │        │
│                                          └─────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

**Celery Task Examples:**

```python
from celery import Celery, chain, group
from app.core.config import settings

celery_app = Celery(
    "historybuff",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

# Configure for long-running tasks
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    task_time_limit=3600,  # 1 hour max
    task_soft_time_limit=3000,  # Soft limit for graceful shutdown
    worker_prefetch_multiplier=1,  # One task at a time for heavy work
)

@celery_app.task(bind=True, max_retries=3)
def extract_document(self, document_id: str, workflow: str = "standard"):
    """Main extraction pipeline task."""
    try:
        # Update pipeline state
        update_pipeline_status(document_id, "running")

        # Run extraction workflow
        result = run_workflow(workflow, document_id)

        update_pipeline_status(document_id, "completed")
        return result

    except Exception as e:
        update_pipeline_status(document_id, "failed", error=str(e))
        raise self.retry(exc=e, countdown=60)

@celery_app.task
def generate_embeddings(text_chunks: list[str]) -> list[list[float]]:
    """Generate embeddings for text chunks."""
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer('all-MiniLM-L6-v2')
    return model.encode(text_chunks).tolist()

@celery_app.task
def ocr_document(document_path: str) -> str:
    """OCR a document image/PDF."""
    import pytesseract
    from PIL import Image
    # ... OCR logic
    return extracted_text

# Workflow composition with Canvas
def create_extraction_workflow(document_id: str):
    """Create a complex extraction workflow."""
    return chain(
        fetch_document.s(document_id),
        assess_quality.s(),
        group(
            ocr_document.s(),
            extract_metadata.s(),
        ),
        extract_entities.s(),
        generate_embeddings.s(),
        store_results.s(document_id),
    )
```

**Recommendation by Phase:**
```yaml
mvp:
  approach: "Celery + Redis"
  reasoning: "Proven, well-documented, handles complexity"
  workers: "1-2 worker processes"
  monitoring: "Flower for task monitoring"

growth:
  approach: "Scale Celery workers"
  reasoning: "Add workers as extraction volume grows"
  workers: "Dedicated worker containers, autoscaling"
  monitoring: "Flower + Prometheus metrics"

scale:
  approach: "Celery OR migrate to Temporal"
  reasoning: "Temporal for complex workflow versioning if needed"
  workers: "Kubernetes with HPA"
  monitoring: "Full observability stack"
```

**Pipeline State Management:**
```sql
-- Track pipeline execution state
CREATE TABLE pipeline_runs (
    id UUID PRIMARY KEY,
    workflow_name VARCHAR(100) NOT NULL,
    document_id UUID REFERENCES sources(id),
    status VARCHAR(20) DEFAULT 'pending',
    -- 'pending', 'running', 'paused', 'completed', 'failed'

    -- State snapshot for resume capability
    state JSONB DEFAULT '{}',
    current_node VARCHAR(100),
    completed_nodes VARCHAR[] DEFAULT '{}',

    -- Tracking
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Cost tracking
    tokens_used INTEGER DEFAULT 0,
    api_cost_cents INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pipeline_runs_status ON pipeline_runs(status);
CREATE INDEX idx_pipeline_runs_document ON pipeline_runs(document_id);

-- Track individual node executions
CREATE TABLE pipeline_node_logs (
    id UUID PRIMARY KEY,
    run_id UUID REFERENCES pipeline_runs(id),
    node_id VARCHAR(100) NOT NULL,
    node_type VARCHAR(50) NOT NULL,

    status VARCHAR(20),
    inputs JSONB,
    outputs JSONB,

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,

    error TEXT
);
```

**Worker Container Setup:**
```yaml
# docker-compose.worker.yml
services:
  worker:
    build: ./worker
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    deploy:
      replicas: 2  # Scale based on queue depth
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_data:
```

**Cost Implications:**
```yaml
mvp_inngest:
  free_tier: "25,000 runs/month"
  pro: "$50/month for 100K runs"
  note: "Good for MVP, monitor usage"

self_hosted_workers:
  small_vm: "$20-40/month (shared CPU)"
  medium_vm: "$60-100/month (dedicated)"
  redis_managed: "$15-30/month (small instance)"
  note: "More predictable at scale"
```

---

## Frontend

### Framework: Next.js or SvelteKit

**Next.js (App Router):**
```yaml
pros:
  - Huge ecosystem
  - Excellent documentation
  - Vercel deployment (easy)
  - React Server Components
  - Great for SEO
  
cons:
  - Heavier bundle
  - React learning curve (if not familiar)
  - Some complexity in App Router
  
best_for: "Team familiar with React, needs ecosystem"
```

**SvelteKit:**
```yaml
pros:
  - Smaller bundles
  - Simpler mental model
  - Fast performance
  - Great DX
  
cons:
  - Smaller ecosystem
  - Fewer developers know it
  - Less enterprise adoption
  
best_for: "Small team, performance priority, willing to learn"
```

**Recommendation:** Start with **Next.js** for ecosystem and deployment ease. Consider SvelteKit for specific performance-critical views.

### UI Components

```yaml
options:
  shadcn_ui:
    description: "Copy-paste components built on Radix"
    pros: "Full control, great accessibility, works with Tailwind"
    cons: "More setup"
    
  chakra_ui:
    description: "Component library"
    pros: "Fast development, good defaults"
    cons: "Bundle size, less customizable"
    
recommendation: "shadcn/ui + Tailwind CSS"
```

### Styling

```yaml
primary: "Tailwind CSS"
reasons:
  - Utility-first (fast iteration)
  - Small production bundles
  - Great documentation
  - Component-friendly

organization:
  - Base styles in tailwind.config.js
  - Component classes via @apply sparingly
  - Design tokens for theming
```

---

## Visualization

### Timelines: D3.js

```yaml
d3:
  use: "Core timeline visualization"
  approach:
    - "D3 for data binding and scales"
    - "SVG for rendering"
    - "React wrapper for lifecycle"
    
alternatives_considered:
  vis_timeline: "Simpler but less flexible"
  chart_js: "Not suited for custom timelines"
  
implementation:
  - Custom timeline component
  - Zoom/pan with d3-zoom
  - Brush selection for date ranges
  - Animated transitions
```

### Maps: Mapbox GL / MapLibre

```yaml
recommendation: "MapLibre GL JS (open source fork of Mapbox GL)"

reasons:
  - WebGL rendering (fast, smooth)
  - Custom styling
  - No API key required (MapLibre)
  - Can use Mapbox styles if desired
  
features_needed:
  - Custom markers
  - Historical map overlays
  - Path animations
  - Clustering
  - Geographic filtering
  
alternatives:
  leaflet: "Simpler but slower for many markers"
  mapbox_gl: "Requires API key, pricing at scale"
  openlayers: "Powerful but complex"
```

### Graph Visualization

```yaml
use_case: "Source trees, connection networks"

options:
  d3_force:
    description: "Force-directed graphs in D3"
    pros: "Flexible, integrates with other D3"
    cons: "More code required"
    
  cytoscape_js:
    description: "Dedicated graph library"
    pros: "Rich features, good performance"
    cons: "Another library to learn"
    
  sigma_js:
    description: "Large graph visualization"
    pros: "WebGL, handles big graphs"
    cons: "Less styling flexibility"
    
recommendation: "D3 force for MVP, evaluate Cytoscape for complex graphs"
```

---

## AI Integration

### LLM for Extraction

```yaml
options:
  anthropic_claude:
    models: "Claude 3 Opus/Sonnet/Haiku"
    pros: "Strong reasoning, good at structured extraction"
    pricing: "Per token"
    
  openai_gpt4:
    models: "GPT-4, GPT-4 Turbo"
    pros: "Widely used, good documentation"
    pricing: "Per token"
    
  open_models:
    examples: "Llama 3, Mistral, Mixtral"
    pros: "Self-hostable, no per-token cost"
    cons: "Hosting cost, possibly lower quality"
    
recommendation: "Start with Claude/GPT-4 for quality. Evaluate open models for scale."

implementation:
  - Edge function calls to AI APIs
  - Prompt templates stored in database
  - Response parsing and validation
  - Rate limiting and cost tracking
```

### Embeddings

```yaml
options:
  openai_embeddings:
    model: "text-embedding-3-small"
    dimensions: 1536
    pros: "Good quality, easy API"
    
  cohere_embed:
    model: "embed-english-v3.0"
    dimensions: 1024
    pros: "Good multilingual support"
    
  open_embeddings:
    models: "e5-large-v2, bge-large"
    pros: "Self-hostable"
    cons: "Hosting complexity"
    
recommendation: "OpenAI embeddings for MVP (simple). Consider self-hosted for scale."

usage:
  - Semantic search on factoids
  - Similar factoid detection
  - Document chunk search
```

### Image Generation

```yaml
options:
  midjourney:
    pros: "Highest quality"
    cons: "No API (Discord only), expensive"
    
  dalle_3:
    pros: "Good quality, API available"
    cons: "Sometimes ignores prompts, costs add up"
    
  stable_diffusion:
    pros: "Self-hostable, open source"
    cons: "Hosting cost, lower quality baseline"
    
  replicate:
    pros: "Many models, pay per use"
    cons: "Dependency on service"
    
recommendation: "DALL-E 3 for MVP (API access). Evaluate Stable Diffusion for cost control."
```

---

## Infrastructure

### Hosting (MVP Deployment)

**Hybrid approach: Free tiers + Hetzner server**

```yaml
frontend:
  provider: "Vercel (free tier)"
  reasons:
    - "Automatic Next.js optimization"
    - "Global CDN"
    - "Preview deploys for PRs"
    - "Zero config SSL"
  cost: "$0"

database:
  provider: "Supabase Cloud (free tier)"
  reasons:
    - "Managed PostgreSQL with pgvector"
    - "Auth system included"
    - "File storage (S3 API)"
    - "No backup headaches"
  cost: "$0"
  limits: "500MB database, 1GB storage, 50K auth users"

backend:
  provider: "Hetzner VPS (existing server)"
  specs: "2 vCPU, 8GB RAM, 80GB disk"
  runs:
    - FastAPI application
    - Redis (Celery broker)
    - 2x Celery workers
    - Caddy (reverse proxy, auto SSL)
  cost: "~€12/mo"

ai_apis:
  embeddings: "sentence-transformers (local, free)"
  llm: "Claude/GPT API (pay per use, ~$50-100/mo for MVP)"
  note: "Local LLM (Ollama) needs 16GB+ RAM, defer to scale phase"
```

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                   MANAGED SERVICES (Free)                    │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │     Vercel       │      │    Supabase      │            │
│  │   (Frontend)     │      │   (DB/Auth/S3)   │            │
│  │   Next.js app    │      │   PostgreSQL     │            │
│  └────────┬─────────┘      └────────┬─────────┘            │
└───────────┼─────────────────────────┼───────────────────────┘
            │                         │
            │    HTTPS (internet)     │
            ▼                         ▼
┌─────────────────────────────────────────────────────────────┐
│              HETZNER VPS (€12/mo, 8GB RAM)                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                     Caddy                            │   │
│  │            (Reverse Proxy, Auto SSL)                 │   │
│  │                 api.yourdomain.com                   │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │                   FastAPI                            │   │
│  │              (REST API, Auth)                        │   │
│  │                  :8000                               │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│  ┌──────────┐    ┌──────▼──────┐    ┌──────────────────┐   │
│  │  Redis   │◄───│   Celery    │───►│  Celery Worker   │   │
│  │ (Broker) │    │   (Queue)   │    │  (Extraction)    │   │
│  │  :6379   │    └─────────────┘    │  x2 processes    │   │
│  └──────────┘                       └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**8GB RAM allocation:**
```yaml
memory_budget:
  fastapi: "300 MB"
  redis: "100 MB"
  celery_worker_1: "800 MB"  # includes sentence-transformers model
  celery_worker_2: "800 MB"
  caddy: "50 MB"
  os_overhead: "1 GB"
  buffer: "5 GB"  # headroom for spikes
```

### CDN / Media

```yaml
images_documents:
  primary: "Supabase Storage (S3-compatible)"
  cdn: "Supabase CDN or Cloudflare"
  
video_exports:
  consideration: "Large files, expensive bandwidth"
  options:
    - "Cloudflare R2 (cheap egress)"
    - "Backblaze B2"
    - "Self-hosted MinIO"
```

### Monitoring

```yaml
error_tracking:
  options:
    - "Sentry (comprehensive)"
    - "LogRocket (session replay)"
    - "Vercel Analytics (basic)"
  recommendation: "Sentry for errors, Vercel for performance"
  
logging:
  approach: "Structured JSON logs"
  storage: "Supabase logs + external aggregator if needed"
  
uptime:
  options:
    - "Better Uptime"
    - "Checkly"
    - "UptimeRobot (free tier)"
```

---

## Development Workflow

### Version Control

```yaml
platform: "GitHub"
branching: "GitHub Flow (main + feature branches)"
protection:
  - "Require PR reviews"
  - "Require CI passing"
  - "No direct pushes to main"
```

### CI/CD

```yaml
platform: "GitHub Actions"

workflows:
  backend_checks:
    - "Lint (ruff)"
    - "Type check (mypy)"
    - "Unit tests (pytest)"
    - "Security scan (bandit)"

  frontend_checks:
    - "Lint (ESLint, Prettier)"
    - "Type check (TypeScript)"
    - "Unit tests (Vitest)"
    - "Build test"

  deploy_preview:
    trigger: "PR opened/updated"
    actions:
      - "Deploy frontend preview to Vercel"
      - "Deploy backend to staging (optional)"

  deploy_production:
    trigger: "Merge to main"
    actions:
      - "Deploy frontend to Vercel"
      - "Deploy backend to Railway/Render/Fly"
      - "Run database migrations"

  database_migrations:
    trigger: "Migration files changed"
    action: "Review required, alembic upgrade"
```

### Testing

```yaml
backend_tests:
  framework: "pytest"
  async_support: "pytest-asyncio"
  coverage: "pytest-cov"
  fixtures: "Factory Boy for test data"

  structure:
    tests/
      ├── unit/           # Fast, isolated tests
      ├── integration/    # Database, external services
      └── conftest.py     # Shared fixtures

frontend_tests:
  unit:
    framework: "Vitest"
    coverage: "Focus on business logic"
  e2e:
    framework: "Playwright"
    scope: "Critical paths only for MVP"

integration_tests:
  database: "Test containers (testcontainers-python)"
  api: "httpx TestClient"

strategy:
  mvp: "Focus on backend unit tests (extraction logic)"
  later: "Add E2E for critical user flows"
```

---

## Cost Estimates

### MVP (Your Setup)

```yaml
monthly_costs:
  vercel_free: $0      # Frontend (Next.js)
  supabase_free: $0    # Database, Auth, Storage
  hetzner_vps: €12     # Backend, Workers, Redis (existing server)
  ai_apis: $50-100     # Claude/GPT for extraction
  domain: ~$1          # ($15/year)

total: "~€12 + $50-100 = ~$65-115/month"

notes:
  - "Embeddings run locally (sentence-transformers) - FREE"
  - "Most costs are AI API calls for extraction"
  - "Can reduce AI costs by batching extractions"
```

### Growth (1000 users, moderate usage)

```yaml
monthly_costs:
  vercel_pro: $20           # More bandwidth, analytics
  supabase_pro: $25         # 8GB database, 100GB storage
  hetzner_upgrade: €20-35   # 4 vCPU, 16GB RAM server
  ai_apis: $200-400         # More extractions
  monitoring: $30           # Sentry

total: "~$300-500/month"

notes:
  - "Upgrade Hetzner for more workers + local Ollama"
  - "16GB RAM enables local LLM for some extraction"
  - "Still very cost-effective"
```

### Scale (10,000+ users)

```yaml
monthly_costs:
  vercel_team: $150
  supabase_team: $599
  hetzner_dedicated: €50-100  # Dedicated server, 64GB+ RAM
  # OR multiple VPS + load balancer
  ai_apis: $500-1500          # Mix of local + API
  monitoring: $100
  cdn_bandwidth: $50-100

total: "~$1500-2500/month"

notes:
  - "Local Ollama handles bulk extraction (reduces API costs)"
  - "API calls only for complex/quality-critical tasks"
  - "Consider Hetzner dedicated for better value"
```

### Cost Optimization Tips

```yaml
reduce_ai_costs:
  - "Use local sentence-transformers for ALL embeddings (free)"
  - "Batch extraction jobs during off-peak"
  - "Cache AI responses for similar content"
  - "Use smaller models (Haiku/GPT-3.5) for simple extraction"
  - "At 16GB+ RAM: run Ollama for bulk extraction"

hetzner_value:
  cx21: "€5/mo - 2 vCPU, 4GB - too small"
  cx31: "€12/mo - 2 vCPU, 8GB - MVP sweet spot"
  cx41: "€18/mo - 4 vCPU, 16GB - growth (can run Ollama)"
  cx51: "€35/mo - 8 vCPU, 32GB - serious scale"
```

---

## Technology Decisions Summary

```yaml
definite:
  # Backend
  backend_language: "Python 3.11+"
  backend_framework: "FastAPI"
  task_queue: "Celery + Redis"
  database: "PostgreSQL (via Supabase)"
  auth: "Supabase Auth (JWT validation in FastAPI)"
  storage: "Supabase Storage (S3 API)"

  # Frontend
  frontend_framework: "Next.js (App Router)"
  styling: "Tailwind CSS"
  ui_components: "shadcn/ui"
  timeline_viz: "D3.js"
  maps: "MapLibre GL"

  # Hosting
  frontend_hosting: "Vercel"
  backend_hosting: "Railway / Render / Fly.io"
  database_hosting: "Supabase Cloud"

strong_preference:
  llm: "Claude or GPT-4"
  embeddings: "sentence-transformers (local) or OpenAI API"
  ocr: "pytesseract / easyocr"

evaluate_later:
  graph_viz: "D3 vs Cytoscape"
  image_gen: "DALL-E vs Stable Diffusion"
  workflow_engine: "Celery vs Temporal (at scale)"
  graphql: "Add if needed"
```

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│              Next.js + React + Tailwind + D3/MapLibre           │
│                        (Vercel)                                  │
├─────────────────────────────────────────────────────────────────┤
│                      PYTHON BACKEND                              │
│                FastAPI (REST API + Auth)                         │
│               (Railway / Render / Fly.io)                        │
├──────────────────────┬──────────────────────────────────────────┤
│      API SERVER      │        CELERY WORKERS                     │
│  FastAPI (async)     │    Extraction Pipelines                   │
│  Request handling    │    OCR, AI calls, Embeddings              │
│  Auth validation     │    Long-running tasks                     │
├──────────────────────┴──────────────────────────────────────────┤
│                     REDIS (Message Broker)                       │
│                   Task queue for Celery                          │
├─────────────────────────────────────────────────────────────────┤
│                        DATA LAYER                                │
│                   PostgreSQL (Supabase)                         │
│        Core Data │ Frame Data │ Pipeline State │ Users          │
├─────────────────────────────────────────────────────────────────┤
│                   SUPABASE SERVICES                              │
│            Auth │ Storage (S3) │ Realtime (WebSocket)           │
├─────────────────────────────────────────────────────────────────┤
│                      EXTERNAL SERVICES                           │
│    AI APIs (Claude/GPT) │ Embeddings │ Image Gen │ OCR          │
└─────────────────────────────────────────────────────────────────┘
```

### Request Flow

```
User Action (Browser)
        │
        ▼
┌─────────────────┐
│   Next.js App   │  ← Static/SSR pages from Vercel
│    (Vercel)     │
└────────┬────────┘
         │ API calls with Supabase JWT
         ▼
┌─────────────────┐
│    FastAPI      │  ← Validates JWT, handles request
│   (Backend)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐  ┌─────────────┐
│  DB   │  │   Celery    │  ← Long tasks queued to Redis
│(Supa) │  │   Queue     │
└───────┘  └──────┬──────┘
                  │
                  ▼
           ┌───────────┐
           │  Workers  │  ← Process extraction pipelines
           └───────────┘
```

---

## Open Source & Self-Hosting

### License Strategy

The project uses a **copyleft license** (AGPL/SSPL-style) - see 16-federation-future.md for details.

**Implications for tech choices:**
```yaml
self_hosting_friendly:
  python: "Open source, excellent ecosystem"
  fastapi: "MIT license"
  celery: "BSD license"
  postgresql: "Open source, no licensing issues"
  supabase: "Self-hostable, same API"
  next_js: "MIT license"
  maplibre: "Open source fork, no API keys required"
  d3: "BSD license"
  sentence_transformers: "Apache 2.0, runs locally"

requires_api_keys:
  openai: "User must provide own key OR use local models"
  anthropic: "User must provide own key OR use local models"
  mapbox: "If using Mapbox instead of MapLibre"

self_hosted_alternatives:
  llm: "Ollama (easy), llama.cpp, vLLM for local LLMs"
  embeddings: "sentence-transformers runs locally (no API needed)"
  image_gen: "Stable Diffusion via ComfyUI"
  ocr: "pytesseract, easyocr (both run locally)"
```

### Self-Hosting Package

```yaml
docker_compose:
  core_services:
    supabase:
      description: "Database, auth, storage, realtime"
      image: "supabase/supabase"

    frontend:
      description: "Next.js application"
      build: "./frontend"
      port: 3000

    backend:
      description: "FastAPI application"
      build: "./backend"
      port: 8000

    redis:
      description: "Celery message broker"
      image: "redis:7-alpine"

    celery_worker:
      description: "Extraction pipeline workers"
      build: "./backend"
      command: "celery -A app.worker worker"
      replicas: 2

    celery_beat:
      description: "Scheduled tasks"
      build: "./backend"
      command: "celery -A app.worker beat"

  optional_services:
    ollama:
      description: "Local LLM for extraction"
      image: "ollama/ollama"
      gpu: "recommended"

    flower:
      description: "Celery monitoring"
      image: "mher/flower"
      port: 5555

    comfyui:
      description: "Local image generation"
      gpu: "required"

environment_variables:
  required:
    - DATABASE_URL
    - SUPABASE_URL
    - SUPABASE_ANON_KEY
    - SUPABASE_SERVICE_KEY
    - REDIS_URL
    - SECRET_KEY

  optional_ai:
    - OPENAI_API_KEY
    - ANTHROPIC_API_KEY
    - OLLAMA_URL (default: http://ollama:11434)

  pipeline_config:
    - CELERY_CONCURRENCY (default: 2)
    - MAX_DOCUMENT_SIZE_MB (default: 50)
    - EMBEDDING_MODEL (default: all-MiniLM-L6-v2)

documentation:
  - docker-compose.yml (quick start)
  - docker-compose.local-ai.yml (with Ollama)
  - Environment configuration guide
  - Celery worker scaling guide
  - Federation setup guide (when ready)
```

### Self-Hosted Architecture

```
Self-Hosted Instance (Docker Compose):
┌──────────────────────────────────────────────────────────────┐
│                       Docker Network                          │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Frontend │  │ Backend  │  │  Redis   │  │   Supabase   │ │
│  │ (Next.js)│  │(FastAPI) │  │ (Broker) │  │ (DB/Auth/S3) │ │
│  │  :3000   │  │  :8000   │  │  :6379   │  │    :54321    │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘ │
│       │             │             │               │          │
│       └─────────────┴─────────────┴───────────────┘          │
│                             │                                 │
│  ┌──────────────────────────┴──────────────────────────────┐ │
│  │                    Celery Workers                        │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │ │
│  │  │ Worker 1 │  │ Worker 2 │  │  Flower  │              │ │
│  │  │(Extract) │  │(Extract) │  │(Monitor) │              │ │
│  │  └──────────┘  └──────────┘  └──────────┘              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                             │                                 │
│  ┌──────────────────────────┴──────────────────────────────┐ │
│  │              Optional: Local AI (GPU recommended)        │ │
│  │  ┌──────────┐  ┌──────────┐                             │ │
│  │  │  Ollama  │  │ ComfyUI  │                             │ │
│  │  │  (LLM)   │  │ (Images) │                             │ │
│  │  └──────────┘  └──────────┘                             │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### License Compliance for Self-Hosters

```yaml
non_commercial_use:
  requirement: "Must comply with copyleft (share modifications)"
  allowed: "Personal, academic, research instances"
  not_allowed: "Commercial SaaS without license"

commercial_use:
  options:
    - "Open source entire stack (copyleft compliance)"
    - "Purchase commercial license"
    - "Partner with flagship instance"
```

---

## Open Questions

- **Mobile**: Native app eventually? React Native? PWA sufficient?

- **Offline**: Offline capability needed? Service workers? Local-first architecture?

- **Self-hosting complexity**: How much effort to make self-hostable? Docker compose? Helm charts?

- **Video rendering**: Server-side video generation is expensive. Client-side? External service?

- **Local AI quality**: How good are self-hosted LLMs compared to API services? Acceptable for extraction?

---

## Dependencies

- **02-data-model.md**: Core Data vs Frame Data separation drives database design
- **11-frames-namespaces.md**: Frames, Lenses & Communities define access patterns and API design
- **15-confidence-system.md**: Placement confidence requires anchor hierarchy support
- **16-federation-future.md**: Architecture must not foreclose federation; sync protocols inform data layer
- **18-business-model.md**: Cost structure affects technology choices; licensing affects self-hosting
- **22-pipeline-architecture.md**: Extraction pipeline requirements drive worker architecture

---

## Summary

The stack prioritizes **development speed** and **reasonable costs** for MVP while choosing technologies that scale and don't lock us in.

**Backend (Python):** FastAPI provides a modern, async Python backend optimized for the AI/ML-heavy extraction workloads. Direct access to sentence-transformers, OCR libraries, and LLM SDKs. Celery + Redis handles complex pipeline orchestration.

**Data Layer:** Supabase provides PostgreSQL (with pgvector), Auth (JWT validation in FastAPI), Storage (S3 API), and Realtime (WebSocket). Clear separation between Core Data and Frame Data.

**Frontend (JavaScript):** Next.js with React, Tailwind, D3, and MapLibre. Deployed to Vercel. Communicates with FastAPI backend via REST with Supabase JWTs.

**Extraction Pipeline:** Celery workers process long-running extraction jobs (OCR, AI entity extraction, embedding generation). Pipeline state persisted in PostgreSQL. Flower for monitoring.

**Self-Hosting:** Docker Compose with all services (Frontend, Backend, Workers, Redis, Supabase). Optional local AI (Ollama for LLM, sentence-transformers for embeddings run locally by default). Copyleft licensing protects against commercial exploitation.

**Why two languages?** The extraction pipeline IS the product. Python's AI/ML ecosystem is unmatched. The frontend is visualization-heavy where JavaScript is unavoidable. The REST API boundary is clean - we don't lose much from not sharing types.

Build fast now. Optimize later. Keep options open.
