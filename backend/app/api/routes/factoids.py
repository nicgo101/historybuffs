"""
Factoid endpoints - Core Data management
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from uuid import UUID
from typing import Optional

router = APIRouter()


class FactoidCreate(BaseModel):
    """Request model for creating a factoid (Core Data)."""
    raw_observation: str
    source_id: Optional[UUID] = None
    layer: str = "documented"  # documented, attested, traditional


class FactoidResponse(BaseModel):
    """Response model for a factoid."""
    id: UUID
    raw_observation: str
    source_id: Optional[UUID]
    layer: str


@router.get("/")
async def list_factoids(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
):
    """
    List factoids with pagination.
    This returns Core Data (frame-independent).
    """
    # TODO: Implement database query
    return {
        "items": [],
        "total": 0,
        "skip": skip,
        "limit": limit,
    }


@router.post("/", response_model=FactoidResponse)
async def create_factoid(factoid: FactoidCreate):
    """
    Create a new factoid (Core Data).
    Factoids are frame-independent observations.
    Placements (dates) are added separately per frame.
    """
    # TODO: Implement database insert
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/{factoid_id}")
async def get_factoid(factoid_id: UUID):
    """Get a single factoid by ID."""
    # TODO: Implement database query
    raise HTTPException(status_code=404, detail="Factoid not found")


@router.get("/{factoid_id}/placements")
async def get_factoid_placements(factoid_id: UUID):
    """
    Get all placements for a factoid across frames.
    Returns frame-dependent date information.
    """
    # TODO: Implement database query
    return {
        "factoid_id": factoid_id,
        "placements": [],
    }
