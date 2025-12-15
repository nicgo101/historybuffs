"""
Pleiades Gazetteer data ingestor.

Pleiades is a community-built gazetteer of ancient places.
https://pleiades.stoa.org/

This ingestor creates LOCATIONS ONLY - no factoids.
The Pleiades data maps directly to our locations table.
"""

import csv
import gzip
import logging
from pathlib import Path
from typing import Any

from tqdm import tqdm

from .base import BaseIngestor

logger = logging.getLogger(__name__)


class PleiadesIngestor(BaseIngestor):
    """
    Ingestor for Pleiades ancient places gazetteer.

    Creates: locations (only)
    Does NOT create: factoids, sources, actors
    """

    def get_source_name(self) -> str:
        return "Pleiades Gazetteer"

    async def ingest(self, limit: int | None = None) -> dict[str, Any]:
        """
        Ingest Pleiades places as locations.

        Args:
            limit: Optional limit on number of places to ingest (for testing).

        Returns:
            Ingestion statistics.
        """
        await self.connect()

        try:
            # Find the CSV file
            data_path = Path(self.data_dir)
            csv_file = self._find_csv_file(data_path)

            self.log_progress(f"Found file: {csv_file}")

            # Count rows
            rows = self._load_rows(csv_file)
            if limit:
                rows = rows[:limit]

            self.log_progress(f"Processing {len(rows)} places...")

            for row in tqdm(rows, desc="Pleiades locations"):
                try:
                    await self._process_place(row)
                except Exception as e:
                    self.log_error(f"Failed to process place {row.get('id', 'unknown')}", e)

            self.log_progress("Ingestion complete!")
            return self.get_stats()

        finally:
            await self.close()

    def _find_csv_file(self, data_path: Path) -> Path:
        """Find Pleiades CSV file."""
        # Check for uncompressed
        csv_files = list(data_path.glob("pleiades*.csv"))
        csv_files = [f for f in csv_files if not f.name.endswith('.gz')]
        if csv_files:
            return csv_files[0]

        # Check for gzipped
        gz_files = list(data_path.glob("pleiades*.csv.gz"))
        if gz_files:
            return gz_files[0]

        raise FileNotFoundError(
            f"No Pleiades CSV file found in {data_path}. "
            "Download from https://pleiades.stoa.org/downloads"
        )

    def _load_rows(self, csv_file: Path) -> list[dict]:
        """Load all rows from CSV."""
        if csv_file.suffix == '.gz':
            with gzip.open(csv_file, 'rt', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                return list(reader)
        else:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                return list(reader)

    async def _process_place(self, row: dict) -> None:
        """Process a single Pleiades place into a location."""
        pleiades_id = row.get("id", "").strip()
        title = row.get("title", "").strip()

        if not title:
            self.stats["locations_skipped"] += 1
            return

        # Parse coordinates
        lat_str = row.get("reprLat", "")
        lon_str = row.get("reprLong", "")

        latitude = float(lat_str) if lat_str else None
        longitude = float(lon_str) if lon_str else None

        # Determine location type and subtype
        feature_types = row.get("featureTypes", "").lower()
        location_type, location_subtype = self._map_feature_type(feature_types)

        # Build historical names list
        historical_names = [title]

        # Add the Pleiades URN as identifier
        if pleiades_id:
            historical_names.append(f"pleiades:{pleiades_id}")

        # Build description from Pleiades data
        description = row.get("description", "").strip()
        time_periods = row.get("timePeriods", "")
        min_date = row.get("minDate", "")
        max_date = row.get("maxDate", "")

        if time_periods:
            description = f"{description}\n\nTime periods: {time_periods}" if description else f"Time periods: {time_periods}"
        if min_date and max_date:
            date_range = f"Date range: {min_date} to {max_date}"
            description = f"{description}\n{date_range}" if description else date_range

        # Determine uncertainty from precision
        precision = row.get("locationPrecision", "").lower()
        uncertainty_km = self._precision_to_uncertainty(precision)

        await self.create_location(
            name_modern=title,
            name_historical=historical_names,
            location_type=location_type,
            location_subtype=location_subtype,
            longitude=longitude,
            latitude=latitude,
            uncertainty_radius_km=uncertainty_km,
            description=description.strip() if description else None,
            external_id=f"pleiades:{pleiades_id}",
        )

    def _map_feature_type(self, feature_types: str) -> tuple[str, str | None]:
        """
        Map Pleiades feature types to our location_type/location_subtype.

        location_type: point, area, linear
        location_subtype: more specific classification
        """
        ft = feature_types.lower()

        # Areas
        if any(x in ft for x in ["region", "province", "territory", "country"]):
            return ("area", "region")
        if any(x in ft for x in ["island", "peninsula"]):
            return ("area", "landform")

        # Linear features
        if any(x in ft for x in ["road", "wall", "aqueduct", "canal"]):
            return ("linear", feature_types.split(",")[0].strip() if "," in ft else ft)
        if "river" in ft:
            return ("linear", "river")

        # Points - settlements
        if any(x in ft for x in ["settlement", "urban", "city", "town", "village"]):
            return ("point", "settlement")

        # Points - landmarks
        if any(x in ft for x in ["temple", "sanctuary", "shrine"]):
            return ("point", "religious")
        if any(x in ft for x in ["fort", "fortress", "military", "camp"]):
            return ("point", "military")
        if any(x in ft for x in ["port", "harbor", "harbour"]):
            return ("point", "port")
        if any(x in ft for x in ["mine", "quarry"]):
            return ("point", "resource")
        if any(x in ft for x in ["bath", "theater", "theatre", "stadium", "arena"]):
            return ("point", "civic")
        if any(x in ft for x in ["cemetery", "tomb", "necropolis"]):
            return ("point", "funerary")

        # Natural features
        if any(x in ft for x in ["mountain", "peak", "hill", "volcano"]):
            return ("point", "mountain")
        if any(x in ft for x in ["lake", "spring", "well", "fountain"]):
            return ("point", "water")
        if any(x in ft for x in ["bay", "gulf", "strait", "sea"]):
            return ("area", "water")
        if any(x in ft for x in ["cape", "promontory"]):
            return ("point", "landform")

        # Default
        return ("point", None)

    def _precision_to_uncertainty(self, precision: str) -> float | None:
        """Convert Pleiades precision to uncertainty radius in km."""
        precision_map = {
            "precise": 0.1,
            "rough": 5.0,
            "related": 10.0,
            "unlocated": None,
        }
        return precision_map.get(precision.lower())
