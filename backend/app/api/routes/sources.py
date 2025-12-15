"""
Source endpoints - Source management and extraction
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from uuid import UUID
from typing import Optional

router = APIRouter()


class SourceCreate(BaseModel):
    """Request model for creating a source."""
    title: str
    author: Optional[str] = None
    url: Optional[str] = None
    source_type: str = "book"  # book, article, primary, website


class ExtractionRequest(BaseModel):
    """Request model for starting extraction."""
    source_id: UUID
    workflow: str = "standard"  # standard, classical, fragmentary


@router.get("/")
async def list_sources(
    skip: int = 0,
    limit: int = 20,
):
    """List sources with pagination."""
    # TODO: Implement database query
    return {
        "items": [],
        "total": 0,
        "skip": skip,
        "limit": limit,
    }


@router.post("/")
async def create_source(source: SourceCreate):
    """Create a new source."""
    # TODO: Implement database insert
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/{source_id}")
async def get_source(source_id: UUID):
    """Get a single source by ID."""
    # TODO: Implement database query
    raise HTTPException(status_code=404, detail="Source not found")


@router.post("/{source_id}/extract")
async def start_extraction(
    source_id: UUID,
    request: ExtractionRequest,
    background_tasks: BackgroundTasks,
):
    """
    Start extraction pipeline for a source.
    This queues a Celery task for processing.
    """
    from app.worker import extract_document

    # Queue the extraction task
    task = extract_document.delay(str(source_id), request.workflow)

    return {
        "message": "Extraction started",
        "task_id": task.id,
        "source_id": source_id,
        "workflow": request.workflow,
    }


@router.get("/{source_id}/extraction-status")
async def get_extraction_status(source_id: UUID):
    """Get the status of an extraction pipeline."""
    # TODO: Query pipeline_runs table
    return {
        "source_id": source_id,
        "status": "unknown",
        "progress": 0,
    }
