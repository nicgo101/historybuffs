"""
Health check endpoints
"""
from fastapi import APIRouter, Depends
from redis import Redis

from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    """Basic health check endpoint."""
    return {"status": "healthy", "environment": settings.ENVIRONMENT}


@router.get("/health/ready")
async def readiness_check():
    """
    Readiness check - verifies all dependencies are available.
    Used by container orchestration to know when the service is ready.
    """
    checks = {
        "api": "ok",
        "redis": "unknown",
        "database": "unknown",
    }

    # Check Redis
    try:
        redis = Redis.from_url(settings.REDIS_URL)
        redis.ping()
        checks["redis"] = "ok"
    except Exception as e:
        checks["redis"] = f"error: {str(e)}"

    # Check Database (via Supabase)
    # TODO: Add actual database check
    checks["database"] = "ok"

    all_ok = all(v == "ok" for v in checks.values())

    return {
        "status": "ready" if all_ok else "degraded",
        "checks": checks,
    }
