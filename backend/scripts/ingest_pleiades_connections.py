#!/usr/bin/env python3
"""
Ingest Pleiades connections as a separate pass.

Run this AFTER the main Pleiades location ingestion is complete.
It will:
1. Load all Pleiades locations from the database to build the ID cache
2. Read the Pleiades JSON to get connection data
3. Create connections between locations

Usage:
    python scripts/ingest_pleiades_connections.py [--limit N]
"""

import argparse
import asyncio
import gzip
import json
import logging
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from supabase import create_client
from tqdm import tqdm

from app.core.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


class PleiadesConnectionIngestor:
    """Ingest connections between Pleiades locations."""

    def __init__(self, data_dir: str = "./data"):
        self.data_dir = data_dir
        self.supabase = None
        self.location_cache: dict[str, str] = {}  # pleiades_id -> location_uuid
        self.stats = {
            "connections_created": 0,
            "connections_skipped_missing": 0,
            "connections_skipped_error": 0,
        }

    async def connect(self) -> None:
        """Establish Supabase connection."""
        self.supabase = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY,
        )
        logger.info("Supabase connection established")

    async def build_location_cache(self) -> None:
        """
        Load all Pleiades locations from database to build the ID cache.

        We look for locations where name_historical contains a pleiades:xxx entry.
        """
        logger.info("Loading Pleiades locations from database...")

        # Fetch locations with Pleiades external IDs
        # The external ID is stored in name_historical array
        offset = 0
        batch_size = 1000

        while True:
            result = self.supabase.table("locations").select(
                "id,name_historical"
            ).range(offset, offset + batch_size - 1).execute()

            if not result.data:
                break

            for loc in result.data:
                loc_id = loc["id"]
                hist_names = loc.get("name_historical") or []

                # Find pleiades:xxx in the historical names
                for name in hist_names:
                    if isinstance(name, str) and name.startswith("pleiades:"):
                        pleiades_id = name.replace("pleiades:", "")
                        self.location_cache[pleiades_id] = loc_id
                        break

            logger.info(f"Loaded {offset + len(result.data)} locations, cache has {len(self.location_cache)} Pleiades entries")

            if len(result.data) < batch_size:
                break
            offset += batch_size

        logger.info(f"Location cache built: {len(self.location_cache)} Pleiades locations")

    def load_places(self, json_file: Path) -> list[dict]:
        """Load places from JSON file."""
        logger.info(f"Loading places from {json_file}...")

        if json_file.suffix == '.gz':
            with gzip.open(json_file, 'rt', encoding='utf-8') as f:
                data = json.load(f)
        else:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

        if isinstance(data, dict) and '@graph' in data:
            return data['@graph']
        if isinstance(data, list):
            return data

        raise ValueError(f"Unexpected JSON structure in {json_file}")

    def find_json_file(self) -> Path:
        """Find Pleiades JSON file."""
        data_path = Path(self.data_dir)

        gz_files = list(data_path.glob("pleiades*.json.gz"))
        if gz_files:
            return gz_files[0]

        json_files = list(data_path.glob("pleiades*.json"))
        if json_files:
            return json_files[0]

        raise FileNotFoundError(f"No Pleiades JSON file found in {data_path}")

    def extract_pleiades_id(self, url: str) -> str | None:
        """Extract Pleiades ID from URL."""
        if not url:
            return None
        if "pleiades.stoa.org/places/" in url:
            return url.split("/places/")[-1].split("/")[0]
        if url.isdigit():
            return url
        return None

    def map_connection_type(self, pleiades_type: str) -> str:
        """Map Pleiades connection types to our schema."""
        spatial_types = {
            "at", "on", "near", "in", "bounds", "abuts", "crosses", "intersects",
            "part_of_physical", "part_of_regional", "part_of_admin", "part_of_analytical",
            "north_of", "south_of", "east_of", "west_of",
            "northeast_of", "northwest_of", "southeast_of", "southwest_of",
            "in_territory_of", "port_of",
        }
        temporal_types = {"succeeds", "founded", "relocated_to", "phase"}
        route_types = {"route_next", "communicates", "flows_into", "flows_through"}
        identity_types = {"same_as", "member", "sympoliteia", "isopoliteia", "dependent", "ally"}
        administrative_types = {"capital", "material_source"}

        pt = pleiades_type.lower()

        if pt in spatial_types:
            return f"spatial:{pt}"
        if pt in temporal_types:
            return f"temporal:{pt}"
        if pt in route_types:
            return f"route:{pt}"
        if pt in identity_types:
            return f"identity:{pt}"
        if pt in administrative_types:
            return f"admin:{pt}"

        return f"pleiades:{pt}"

    def map_certainty_to_confidence(self, certainty: str) -> float:
        """Map certainty levels to confidence scores."""
        mapping = {
            "certain": 0.95,
            "confident": 0.85,
            "less-certain": 0.65,
            "uncertain": 0.45,
        }
        return mapping.get(certainty.lower(), 0.75)

    def build_connection_notes(self, conn: dict) -> str | None:
        """Build notes from connection metadata."""
        parts = []

        title = conn.get("title", "")
        if title:
            parts.append(f"Connected to: {title}")

        start = conn.get("start")
        end = conn.get("end")
        if start is not None or end is not None:
            parts.append(f"Period: {start or '?'} - {end or '?'}")

        attestations = conn.get("attestations", [])
        if attestations:
            periods = []
            for att in attestations:
                tp = att.get("timePeriod")
                if tp:
                    if isinstance(tp, dict):
                        periods.append(tp.get("title", str(tp)))
                    else:
                        periods.append(str(tp))
            if periods:
                parts.append(f"Attested: {', '.join(periods)}")

        uri = conn.get("uri")
        if uri:
            parts.append(f"Source: {uri}")

        return "; ".join(parts) if parts else None

    async def process_connections(self, places: list[dict], limit: int | None = None) -> None:
        """Process connections from all places."""
        # Collect all connections
        all_connections = []
        for place in places:
            pleiades_id = place.get("id", "")
            connections = place.get("connections", [])
            for conn in connections:
                all_connections.append((pleiades_id, conn))

        if limit:
            all_connections = all_connections[:limit]

        logger.info(f"Processing {len(all_connections)} connections...")

        for from_pleiades_id, conn in tqdm(all_connections, desc="Connections"):
            try:
                # Get from location
                from_uuid = self.location_cache.get(from_pleiades_id)
                if not from_uuid:
                    self.stats["connections_skipped_missing"] += 1
                    continue

                # Get to location
                connects_to = conn.get("connectsTo", "")
                to_pleiades_id = self.extract_pleiades_id(connects_to)
                if not to_pleiades_id:
                    self.stats["connections_skipped_missing"] += 1
                    continue

                to_uuid = self.location_cache.get(to_pleiades_id)
                if not to_uuid:
                    self.stats["connections_skipped_missing"] += 1
                    continue

                # Map connection type and confidence
                connection_type = self.map_connection_type(conn.get("connectionType", "connection"))
                certainty = conn.get("associationCertainty", "certain")
                confidence = self.map_certainty_to_confidence(certainty)
                notes = self.build_connection_notes(conn)

                # Create connection
                data = {
                    "from_entity_type": "location",
                    "from_entity_id": from_uuid,
                    "to_entity_type": "location",
                    "to_entity_id": to_uuid,
                    "connection_type": connection_type,
                    "confidence": confidence,
                    "notes": notes,
                }
                data = {k: v for k, v in data.items() if v is not None}

                self.supabase.table("connections").insert(data).execute()
                self.stats["connections_created"] += 1

            except Exception as e:
                logger.error(f"Failed to create connection: {e}")
                self.stats["connections_skipped_error"] += 1

    async def run(self, limit: int | None = None) -> dict:
        """Run the connection ingestion."""
        await self.connect()

        try:
            # Build cache from database
            await self.build_location_cache()

            if not self.location_cache:
                logger.error("No Pleiades locations found in database. Run main ingestion first.")
                return self.stats

            # Load places from JSON
            json_file = self.find_json_file()
            places = self.load_places(json_file)
            logger.info(f"Loaded {len(places)} places from {json_file}")

            # Process connections
            await self.process_connections(places, limit)

            logger.info("Connection ingestion complete!")
            logger.info(f"Stats: {self.stats}")

            return self.stats

        finally:
            logger.info("Done")


async def main():
    parser = argparse.ArgumentParser(description="Ingest Pleiades connections")
    parser.add_argument("--limit", type=int, help="Limit number of connections to process")
    parser.add_argument("--data-dir", default="./data", help="Data directory")
    args = parser.parse_args()

    ingestor = PleiadesConnectionIngestor(data_dir=args.data_dir)
    await ingestor.run(limit=args.limit)


if __name__ == "__main__":
    asyncio.run(main())
