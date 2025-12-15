"""
Base class for data ingestors.

All ingestors follow the HistoryBuff data model:
- locations: Places with coordinates
- actors: People, groups, institutions
- sources: Primary/secondary texts and documents
- factoids: Discrete historical claims (frame-independent)
- factoid_placements: Temporal placement in reference frames
- connections: Relationships between entities

Uses Supabase REST API (not direct PostgreSQL) for reliable connectivity.
"""

import json
import logging
from abc import ABC, abstractmethod
from datetime import date
from typing import Any
from uuid import UUID

from supabase import create_client, Client

from app.core.config import settings

logger = logging.getLogger(__name__)


class BaseIngestor(ABC):
    """Base class for all data ingestors."""

    def __init__(self, data_dir: str = "./data"):
        self.data_dir = data_dir
        self.supabase: Client | None = None
        self.default_frame_id: str | None = None
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
        """Establish Supabase connection."""
        self.supabase = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY,  # Use service key for full access
        )
        logger.info("Supabase connection established")

        # Get default reference frame
        result = self.supabase.table("reference_frames").select("id").eq("is_default", True).limit(1).execute()
        if result.data:
            self.default_frame_id = result.data[0]["id"]
            logger.info(f"Using default frame: {self.default_frame_id}")
        else:
            logger.warning("No default reference frame found!")

    async def close(self) -> None:
        """Close connection (no-op for REST API)."""
        logger.info("Supabase connection closed")

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
        if not self.supabase:
            raise RuntimeError("Supabase not connected")

        if not name_modern and not name_historical:
            self.stats["locations_skipped"] += 1
            return None

        # Prepare historical names
        hist_names = name_historical or []
        if external_id and external_id not in hist_names:
            hist_names.append(external_id)

        # Check for existing by external_id in name_historical
        if external_id:
            result = self.supabase.table("locations").select("id").contains("name_historical", [external_id]).limit(1).execute()
            if result.data:
                self.stats["locations_skipped"] += 1
                return result.data[0]["id"]

        # Insert new location
        data = {
            "name_modern": name_modern,
            "name_historical": hist_names,
            "location_type": location_type,
            "location_subtype": location_subtype,
            "coordinate_x": longitude,
            "coordinate_y": latitude,
            "uncertainty_radius_km": uncertainty_radius_km,
            "description": description,
        }
        # Remove None values
        data = {k: v for k, v in data.items() if v is not None}

        result = self.supabase.table("locations").insert(data).execute()
        if result.data:
            self.stats["locations_created"] += 1
            return result.data[0]["id"]
        return None

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
        if not self.supabase:
            raise RuntimeError("Supabase not connected")

        if not name_primary or len(name_primary) < 2:
            self.stats["actors_skipped"] += 1
            return None

        # Prepare aliases
        aliases = name_aliases or []
        if external_id and external_id not in aliases:
            aliases.append(external_id)

        # Check for existing by external_id in aliases
        if external_id:
            result = self.supabase.table("actors").select("id").contains("name_aliases", [external_id]).limit(1).execute()
            if result.data:
                self.stats["actors_skipped"] += 1
                return result.data[0]["id"]

        # Check by name
        result = self.supabase.table("actors").select("id").eq("name_primary", name_primary).limit(1).execute()
        if result.data:
            self.stats["actors_skipped"] += 1
            return result.data[0]["id"]

        # Insert new actor
        data = {
            "name_primary": name_primary,
            "name_aliases": aliases,
            "actor_type": actor_type,
            "actor_subtype": actor_subtype,
            "raw_temporal_evidence": raw_temporal_evidence,
            "description": description,
            "known_biases": known_biases,
        }
        # Remove None values
        data = {k: v for k, v in data.items() if v is not None}

        result = self.supabase.table("actors").insert(data).execute()
        if result.data:
            self.stats["actors_created"] += 1
            return result.data[0]["id"]
        return None

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
        if not self.supabase:
            raise RuntimeError("Supabase not connected")

        if not title:
            self.stats["sources_skipped"] += 1
            return None

        # Check for existing by URL (if provided)
        if digital_url:
            result = self.supabase.table("sources").select("id").eq("digital_url", digital_url).limit(1).execute()
            if result.data:
                self.stats["sources_skipped"] += 1
                return result.data[0]["id"]

        # Check by title + author
        query = self.supabase.table("sources").select("id").eq("title", title)
        if author_id:
            query = query.eq("author_id", author_id)
        else:
            query = query.is_("author_id", "null")
        result = query.limit(1).execute()
        if result.data:
            self.stats["sources_skipped"] += 1
            return result.data[0]["id"]

        # Insert new source
        data = {
            "title": title,
            "source_type": source_type,
            "genre": genre,
            "author_id": author_id,
            "raw_dating_evidence": raw_dating_evidence,
            "raw_period_covered": raw_period_covered,
            "original_language": original_language,
            "digital_url": digital_url,
            "extraction_status": "pending",
        }
        # Remove None values
        data = {k: v for k, v in data.items() if v is not None}

        result = self.supabase.table("sources").insert(data).execute()
        if result.data:
            self.stats["sources_created"] += 1
            return result.data[0]["id"]
        return None

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
        if not self.supabase:
            raise RuntimeError("Supabase not connected")

        if not description or len(description) < 10:
            self.stats["factoids_skipped"] += 1
            return None

        # Insert new factoid
        data = {
            "description": description,
            "summary": summary,
            "factoid_type": factoid_type,
            "layer": layer,
            "raw_observation": raw_observation,
            "raw_observation_type": raw_observation_type,
            "status": status,
        }
        # Remove None values
        data = {k: v for k, v in data.items() if v is not None}

        result = self.supabase.table("factoids").insert(data).execute()
        if result.data:
            self.stats["factoids_created"] += 1
            return result.data[0]["id"]
        return None

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
        if not self.supabase:
            raise RuntimeError("Supabase not connected")

        frame_id = frame_id or self.default_frame_id
        if not frame_id:
            logger.warning("No frame_id and no default frame - skipping placement")
            return None

        # Insert new placement
        data = {
            "factoid_id": factoid_id,
            "frame_id": frame_id,
            "date_start": date_start.isoformat() if date_start else None,
            "date_end": date_end.isoformat() if date_end else None,
            "date_precision": date_precision,
            "placement_confidence": placement_confidence,
            "reasoning": reasoning,
            "placement_type": placement_type,
        }
        # Remove None values
        data = {k: v for k, v in data.items() if v is not None}

        result = self.supabase.table("factoid_placements").insert(data).execute()
        if result.data:
            self.stats["placements_created"] += 1
            return result.data[0]["id"]
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
        if not self.supabase:
            raise RuntimeError("Supabase not connected")

        data = {
            "factoid_id": factoid_id,
            "source_id": source_id,
            "relationship": relationship,
            "relevant_excerpt": relevant_excerpt,
        }
        # Remove None values
        data = {k: v for k, v in data.items() if v is not None}

        # Use upsert to avoid duplicates
        self.supabase.table("factoid_sources").upsert(data, on_conflict="factoid_id,source_id").execute()

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
        if not self.supabase:
            raise RuntimeError("Supabase not connected")

        data = {
            "from_entity_type": from_entity_type,
            "from_entity_id": from_entity_id,
            "to_entity_type": to_entity_type,
            "to_entity_id": to_entity_id,
            "connection_type": connection_type,
            "confidence": confidence,
            "notes": notes,
        }
        # Remove None values
        data = {k: v for k, v in data.items() if v is not None}

        result = self.supabase.table("connections").insert(data).execute()
        if result.data:
            self.stats["connections_created"] += 1
            return result.data[0]["id"]
        return None

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
