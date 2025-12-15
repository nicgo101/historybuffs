"""
Supabase client for backend database operations.
Uses service key for full access (bypasses RLS).
"""
from supabase import create_client, Client
from functools import lru_cache
from app.core.config import settings


@lru_cache()
def get_supabase_client() -> Client:
    """
    Get a Supabase client with service role key.
    Service key bypasses RLS - use carefully.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment"
        )

    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_KEY
    )


def get_db() -> Client:
    """Dependency for FastAPI routes."""
    return get_supabase_client()
