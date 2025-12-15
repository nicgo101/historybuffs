"""
Celery Worker Configuration

This module configures Celery for background task processing,
particularly the extraction pipeline.

Usage:
    celery -A app.worker worker --loglevel=info
    celery -A app.worker beat --loglevel=info  # For scheduled tasks
"""
from celery import Celery
from app.core.config import settings

# Initialize Celery
celery_app = Celery(
    "historybuff",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.extraction", "app.tasks.embeddings"],
)

# Celery configuration
celery_app.conf.update(
    # Serialization
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],

    # Time limits (for long-running extraction tasks)
    task_time_limit=3600,  # 1 hour hard limit
    task_soft_time_limit=3000,  # 50 min soft limit

    # Worker settings
    worker_prefetch_multiplier=1,  # One task at a time (heavy tasks)
    worker_concurrency=2,  # Match docker-compose setting

    # Result backend
    result_expires=86400,  # Results expire after 24 hours

    # Task routing (optional, for future scaling)
    task_routes={
        "app.tasks.extraction.*": {"queue": "extraction"},
        "app.tasks.embeddings.*": {"queue": "embeddings"},
    },

    # Retry settings
    task_acks_late=True,  # Acknowledge after completion (safer)
    task_reject_on_worker_lost=True,

    # Beat schedule (for periodic tasks)
    beat_schedule={
        "cleanup-old-pipeline-runs": {
            "task": "app.tasks.maintenance.cleanup_old_runs",
            "schedule": 86400.0,  # Daily
        },
    },
)


# ============================================
# EXTRACTION TASKS
# ============================================

@celery_app.task(bind=True, max_retries=3)
def extract_document(self, document_id: str, workflow: str = "standard"):
    """
    Main extraction pipeline task.

    Args:
        document_id: UUID of the source document
        workflow: Pipeline workflow to use (standard, classical, fragmentary)

    Returns:
        dict with extraction results
    """
    import logging
    logger = logging.getLogger(__name__)

    logger.info(f"Starting extraction for document {document_id} with workflow {workflow}")

    try:
        # TODO: Implement actual extraction pipeline
        # 1. Fetch document from storage
        # 2. Run OCR if needed
        # 3. Extract entities
        # 4. Generate embeddings
        # 5. Store results

        # Placeholder for now
        result = {
            "document_id": document_id,
            "workflow": workflow,
            "status": "completed",
            "entities_extracted": 0,
            "factoids_created": 0,
        }

        logger.info(f"Extraction completed for document {document_id}")
        return result

    except Exception as e:
        logger.error(f"Extraction failed for document {document_id}: {e}")
        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@celery_app.task
def generate_embeddings(text_chunks: list[str]) -> list[list[float]]:
    """
    Generate embeddings for text chunks using sentence-transformers.
    This runs locally - no API costs!

    Args:
        text_chunks: List of text strings to embed

    Returns:
        List of embedding vectors
    """
    from sentence_transformers import SentenceTransformer

    model = SentenceTransformer(settings.EMBEDDING_MODEL)
    embeddings = model.encode(text_chunks)

    return embeddings.tolist()


@celery_app.task
def ocr_document(document_path: str, language: str = "eng") -> str:
    """
    Run OCR on a document image.

    Args:
        document_path: Path to document in storage
        language: Tesseract language code (eng, grc for Greek, etc.)

    Returns:
        Extracted text
    """
    import pytesseract
    from PIL import Image

    # TODO: Fetch from Supabase storage
    # image = fetch_from_storage(document_path)
    # text = pytesseract.image_to_string(image, lang=language)

    return ""


# For direct import
extract_document = extract_document
generate_embeddings = generate_embeddings
