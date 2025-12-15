"""
HistoryBuff API - FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import health, factoids, sources, map

app = FastAPI(
    title="HistoryBuff API",
    description="Historical research platform API",
    version="0.1.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL] if settings.FRONTEND_URL else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(factoids.router, prefix="/api/factoids", tags=["factoids"])
app.include_router(sources.router, prefix="/api/sources", tags=["sources"])
app.include_router(map.router, prefix="/api/map", tags=["map"])


@app.get("/")
async def root():
    return {"message": "HistoryBuff API", "docs": "/docs"}
