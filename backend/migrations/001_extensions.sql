-- Migration: 001_extensions.sql
-- Enable required PostgreSQL extensions
-- Run this first in Supabase SQL Editor

-- pgvector for semantic search embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- uuid-ossp for UUID generation (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
