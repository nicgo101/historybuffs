"""
Base class for data ingestors.

All ingestors follow the HistoryBuff data model:
- locations: Places with coordinates
- actors: People, groups, institutions
- sources: Primary/secondary texts and documents
- factoids: Discrete historical claims (frame-independent)
- factoid_placements: Temporal placement in reference frames
- connections: Relationships between entities
"""

import logging
from abc import ABC, abstractmethod
from datetime import date
from typing import Any
from uuid import UUID

import asyncpg

from app.core.config import settings

logger = logging.getLogger(__name__)


class BaseIngestor(ABC):
    """Base class for all data ingestors."""

    def __init__(self, data_dir: str = "./data"):
        self.data_dir = data_dir
        self.pool: asyncpg.Pool | None = None
        self.default_frame_id: UUID | None = None
        self.stats = {
            "sources_created": 0,
            "sources_skipped": 0,
            "factoids_created": 0,
            "factoids_skipped": 0,
            "placements_created": 0,
            "locations_created": 0,
            "locations_skipped": 0,
            "actors_created": 0,
            "actors_skipped": 0,
            "connections_created": 0,
            "errors": 0,
        }

    async def connect(self) -> None:
        """Establish database connection."""
        self.pool = await asyncpg.create_pool(
            settings.DATABASE_URL,
            min_size=2,
            max_size=10,
        )
        logger.info("Database connection established")

        # Get default reference frame
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT id FROM reference_frames WHERE is_default = TRUE LIMIT 1"
            )
            if row:
                self.default_frame_id = row["id"]
                logger.info(f"Using default frame: {self.default_frame_id}")
            else:
                logger.warning("No default reference frame found!")

    async def close(self) -> None:
        """Close database connection."""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection closed")

    @abstractmethod
    async def ingest(self) -> dict[str, Any]:
        """Run the ingestion process."""
        pass

    @abstractmethod
    def get_source_name(self) -> str:
        """Return the name of this data source."""
        pass

    # ==========================================
    # LOCATIONS
    # ==========================================

    async def create_location(
        self,
        name_modern: str | None,
        name_historical: list[str] | None = None,
        location_type: str = "point",
        location_subtype: str | None = None,
        longitude: float | None = None,
        latitude: float | None = None,
        uncertainty_radius_km: float | None = None,
        description: str | None = None,
        external_id: str | None = None,
    ) -> str | None:
        """
        Create a location record following the schema.

        Returns:
            Location UUID as string, or None if skipped.
        """
        if not self.pool:
            raise RuntimeError("Database not connected")

        if not name_modern and not name_historical:
            self.stats["locations_skipped"] += 1
            return None

        async with self.pool.acquire() as conn:
            # Check for existing by external_id in name_historical
            if external_id:
                existing = await conn.fetchrow(
                    """
                    SELECT id FROM locations
                    WHERE name_historical @> $1::jsonb
                    LIMIT 1
                    """,
                    f'["{external_id}"]',
                )
                if existing:
                    self.stats["locations_skipped"] += 1
                    return str(existing["id"])

            # Prepare historical names
            hist_names = name_historical or []
            if external_id and external_id not in hist_names:
                hist_names.append(external_id)

            import json
            hist_names_json = json.dumps(hist_names)

            result = await conn.fetchrow(
                """
                INSERT INTO locations (
                    name_modern, name_historical, location_type, location_subtype,
                    coordinate_x, coordinate_y, uncertainty_radius_km, description
                )
                VALUES ($1, $2::jsonb, $3, $4, $5, $6, $7, $8)
                RETURNING id
                """,
                name_modern,
                hist_names_json,
                location_type,
                location_subtype,
                longitude,
                latitude,
                uncertainty_radius_km,
                description,
            )
            self.stats["locations_created"] += 1
            return str(result["id"])

    # ==========================================
    # ACTORS
    # ==========================================

    async def create_actor(
        self,
        name_primary: str,
        actor_type: str = "person",
        actor_subtype: str | None = None,
        name_aliases: list[str] | None = None,
        raw_temporal_evidence: str | None = None,
        description: str | None = None,
        known_biases: str | None = None,
        external_id: str | None = None,
    ) -> str | None:
        """
        Create an actor record following the schema.

        Returns:
            Actor UUID as string, or None if skipped.
        """
        if not self.pool:
            raise RuntimeError("Database not connected")

        if not name_primary or len(name_primary) < 2:
            self.stats["actors_skipped"] += 1
            return None

        async with self.pool.acquire() as conn:
            # Check for existing by external_id in aliases
            if external_id:
                existing = await conn.fetchrow(
                    """
                    SELECT id FROM actors
                    WHERE name_aliases @> $1::jsonb
                    LIMIT 1
                    """,
                    f'["{external_id}"]',
                )
                if existing:
                    self.stats["actors_skipped"] += 1
                    return str(existing["id"])

            # Check by name
            existing = await conn.fetchrow(
                "SELECT id FROM actors WHERE name_primary = $1 LIMIT 1",
                name_primary,
            )
            if existing:
                self.stats["actors_skipped"] += 1
                return str(existing["id"])

            # Prepare aliases
            aliases = name_aliases or []
            if external_id and external_id not in aliases:
                aliases.append(external_id)

            import json
            aliases_json = json.dumps(aliases)

            result = await conn.fetchrow(
                """
                INSERT INTO actors (
                    name_primary, name_aliases, actor_type, actor_subtype,
                    raw_temporal_evidence, description, known_biases
                )
                VALUES ($1, $2::jsonb, $3, $4, $5, $6, $7)
                RETURNING id
                """,
                name_primary,
                aliases_json,
                actor_type,
                actor_subtype,
                raw_temporal_evidence,
                description,
                known_biases,
            )
            self.stats["actors_created"] += 1
            return str(result["id"])

    # ==========================================
    # SOURCES
    # ==========================================

    async def create_source(
        self,
        title: str,
        source_type: str = "primary",
        genre: str | None = None,
        author_id: str | None = None,
        raw_dating_evidence: str | None = None,
        raw_period_covered: str | None = None,
        original_language: str | None = None,
        digital_url: str | None = None,
        external_id: str | None = None,
    ) -> str | None:
        """
        Create a source record following the schema.

        Returns:
            Source UUID as string, or None if skipped.
        """
        if not self.pool:
            raise RuntimeError("Database not connected")

        if not title:
            self.stats["sources_skipped"] += 1
            return None

        async with self.pool.acquire() as conn:
            # Check for existing by URL (if provided)
            if digital_url:
                existing = await conn.fetchrow(
                    "SELECT id FROM sources WHERE digital_url = $1 LIMIT 1",
                    digital_url,
                )
                if existing:
                    self.stats["sources_skipped"] += 1
                    return str(existing["id"])

            # Check by title + author
            if author_id:
                existing = await conn.fetchrow(
                    "SELECT id FROM sources WHERE title = $1 AND author_id = $2 LIMIT 1",
                    title,
                    author_id,
                )
            else:
                existing = await conn.fetchrow(
                    "SELECT id FROM sources WHERE title = $1 AND author_id IS NULL LIMIT 1",
                    title,
                )
            if existing:
                self.stats["sources_skipped"] += 1
                return str(existing["id"])

            result = await conn.fetchrow(
                """
                INSERT INTO sources (
                    title, source_type, genre, author_id,
                    raw_dating_evidence, raw_period_covered,
                    original_language, digital_url, extraction_status
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
                RETURNING id
                """,
                title,
                source_type,
                genre,
                author_id,
                raw_dating_evidence,
                raw_period_covered,
                original_language,
                digital_url,
            )
            self.stats["sources_created"] += 1
            return str(result["id"])

    # ==========================================
    # FACTOIDS
    # ==========================================

    async def create_factoid(
        self,
        description: str,
        factoid_type: str,
        layer: str = "attested",
        raw_observation: str | None = None,
        raw_observation_type: str | None = None,
        summary: str | None = None,
        status: str = "sourced",
    ) -> str | None:
        """
        Create a factoid record following the schema.

        Returns:
            Factoid UUID as string, or None if skipped.
        """
        if not self.pool:
            raise RuntimeError("Database not connected")

        if not description or len(description) < 10:
            self.stats["factoids_skipped"] += 1
            return None

        async with self.pool.acquire() as conn:
            result = await conn.fetchrow(
                """
                INSERT INTO factoids (
                    description, summary, factoid_type, layer,
                    raw_observation, raw_observation_type, status
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
                """,
                description,
                summary,
                factoid_type,
                layer,
                raw_observation,
                raw_observation_type,
                status,
            )
            self.stats["factoids_created"] += 1
            return str(result["id"])

    # ==========================================
    # FACTOID PLACEMENTS
    # ==========================================

    async def create_placement(
        self,
        factoid_id: str,
        frame_id: str | None = None,
        date_start: date | None = None,
        date_end: date | None = None,
        date_precision: str = "year",
        placement_confidence: float = 0.8,
        reasoning: str | None = None,
        placement_type: str = "system",
    ) -> str | None:
        """
        Create a factoid placement in a reference frame.

        Returns:
            Placement UUID as string, or None if skipped.
        """
        if not self.pool:
            raise RuntimeError("Database not connected")

        frame_id = frame_id or str(self.default_frame_id)
        if not frame_id:
            logger.warning("No frame_id and no default frame - skipping placement")
            return None

        async with self.pool.acquire() as conn:
            result = await conn.fetchrow(
                """
                INSERT INTO factoid_placements (
                    factoid_id, frame_id, date_start, date_end,
                    date_precision, placement_confidence, reasoning, placement_type
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT DO NOTHING
                RETURNING id
                """,
                factoid_id,
                frame_id,
                date_start,
                date_end,
                date_precision,
                placement_confidence,
                reasoning,
                placement_type,
            )
            if result:
                self.stats["placements_created"] += 1
                return str(result["id"])
            return None

    # ==========================================
    # FACTOID-SOURCE LINKS
    # ==========================================

    async def link_factoid_source(
        self,
        factoid_id: str,
        source_id: str,
        relationship: str = "primary_source",
        relevant_excerpt: str | None = None,
    ) -> None:
        """Link a factoid to its source."""
        if not self.pool:
            raise RuntimeError("Database not connected")

        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO factoid_sources (factoid_id, source_id, relationship, relevant_excerpt)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT DO NOTHING
                """,
                factoid_id,
                source_id,
                relationship,
                relevant_excerpt,
            )

    # ==========================================
    # CONNECTIONS
    # ==========================================

    async def create_connection(
        self,
        from_entity_type: str,
        from_entity_id: str,
        to_entity_type: str,
        to_entity_id: str,
        connection_type: str,
        confidence: float = 0.8,
        notes: str | None = None,
    ) -> str | None:
        """Create a connection between entities."""
        if not self.pool:
            raise RuntimeError("Database not connected")

        async with self.pool.acquire() as conn:
            result = await conn.fetchrow(
                """
                INSERT INTO connections (
                    from_entity_type, from_entity_id,
                    to_entity_type, to_entity_id,
                    connection_type, confidence, notes
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
                """,
                from_entity_type,
                from_entity_id,
                to_entity_type,
                to_entity_id,
                connection_type,
                confidence,
                notes,
            )
            self.stats["connections_created"] += 1
            return str(result["id"])

    # ==========================================
    # UTILITIES
    # ==========================================

    def log_progress(self, message: str) -> None:
        """Log progress message."""
        logger.info(f"[{self.get_source_name()}] {message}")

    def log_error(self, message: str, exc: Exception | None = None) -> None:
        """Log error message."""
        self.stats["errors"] += 1
        if exc:
            logger.error(f"[{self.get_source_name()}] {message}: {exc}")
        else:
            logger.error(f"[{self.get_source_name()}] {message}")

    def get_stats(self) -> dict[str, Any]:
        """Return current ingestion statistics."""
        from datetime import datetime
        return {
            "source": self.get_source_name(),
            "timestamp": datetime.utcnow().isoformat(),
            **self.stats,
        }
