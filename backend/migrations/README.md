# Database Migrations

## Overview

These SQL migrations set up the HistoryBuff database schema on Supabase.

## Files

1. **001_extensions.sql** - Enables required PostgreSQL extensions (pgvector, pg_trgm)
2. **002_mvp_schema.sql** - Creates all MVP tables, indexes, RLS policies, and triggers
3. **003_seed_data.sql** - Seeds reference frames and achievements

## Running Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run each file in order:
   - First: `001_extensions.sql`
   - Then: `002_mvp_schema.sql`
   - Finally: `003_seed_data.sql`

### Option 2: Using psql

```bash
# Connect to your Supabase database
psql "postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"

# Run migrations in order
\i 001_extensions.sql
\i 002_mvp_schema.sql
\i 003_seed_data.sql
```

### Option 3: Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

## Schema Overview

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | User profiles linked to Supabase Auth |
| `reference_frames` | Chronological frameworks (Default Academic, Evidence-Based) |
| `factoids` | Core historical claims (frame-independent) |
| `factoid_placements` | Frame-dependent date assignments |
| `sources` | Historical documents and references |
| `source_citations` | Citation relationships between sources |
| `factoid_sources` | Links factoids to their sources |
| `actors` | People, institutions, groups |
| `locations` | Geographic entities |
| `connections` | Relationships between any entities |
| `contributions` | Audit log of all changes |
| `achievements` | Gamification achievements |

### Key Design Principles

1. **Frame-dependent dating**: Dates are stored in `factoid_placements`, not on factoids directly. This allows the same factoid to have different dates in different chronological frameworks.

2. **Soft deletes**: All main tables have `deleted_at` column. Data is never truly deleted.

3. **Vector embeddings**: Uses 384-dimensional vectors (all-MiniLM-L6-v2 model) for semantic search.

4. **Row Level Security**: All tables have RLS enabled with appropriate policies.

## Embedding Dimensions

The schema uses 384-dimensional vectors, optimized for the `all-MiniLM-L6-v2` model.

If you want to use OpenAI embeddings (1536 dimensions), change all `VECTOR(384)` to `VECTOR(1536)` in the schema.

## Troubleshooting

### "extension vector does not exist"
Run `001_extensions.sql` first, or enable the vector extension manually:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### "permission denied for schema auth"
The trigger on `auth.users` requires superuser privileges. In Supabase, this should work automatically. If not, create the user profile manually after signup.

### Index creation fails
For large tables, ivfflat indexes require data to exist first. If creating indexes on empty tables fails, either:
- Drop the problematic indexes and create them after data is loaded
- Use HNSW indexes instead (slower to build but work on empty tables)
