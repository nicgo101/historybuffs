"""
Pleiades Gazetteer data ingestor.

Pleiades is a community-built gazetteer of ancient places.
https://pleiades.stoa.org/

This ingestor creates LOCATIONS ONLY - no factoids.
The Pleiades data maps directly to our locations table with the extended
geographic schema from 004_geographic_extensions.sql.

Implements:
- Structured historical names with time periods
- Uncertainty notes from precision ratings
- Location changes from time period data
- Bounding box to boundary_geojson for areas
- Terrain notes from feature types
"""

import csv
import gzip
import logging
from pathlib import Path
from typing import Any

from tqdm import tqdm

from .base import BaseIngestor

logger = logging.getLogger(__name__)

# Pleiades time period mappings to approximate date ranges
# Based on https://pleiades.stoa.org/vocabularies/time-periods
PLEIADES_PERIODS = {
    "archaic": {"start": "-0800", "end": "-0480", "label": "Archaic Greek"},
    "classical": {"start": "-0480", "end": "-0323", "label": "Classical Greek"},
    "hellenistic-republican": {"start": "-0323", "end": "-0031", "label": "Hellenistic/Republican"},
    "roman": {"start": "-0031", "end": "0300", "label": "Roman Imperial"},
    "late-antique": {"start": "0300", "end": "0640", "label": "Late Antique"},
    "mediaeval-byzantine": {"start": "0640", "end": "1453", "label": "Medieval/Byzantine"},
    "modern": {"start": "1453", "end": None, "label": "Modern"},
    # Earlier periods
    "neolithic": {"start": "-7000", "end": "-3200", "label": "Neolithic"},
    "bronze-age": {"start": "-3200", "end": "-1200", "label": "Bronze Age"},
    "early-bronze-age": {"start": "-3200", "end": "-2000", "label": "Early Bronze Age"},
    "middle-bronze-age": {"start": "-2000", "end": "-1600", "label": "Middle Bronze Age"},
    "late-bronze-age": {"start": "-1600", "end": "-1200", "label": "Late Bronze Age"},
    "iron-age": {"start": "-1200", "end": "-0800", "label": "Iron Age"},
    # Regional variants
    "achaemenid": {"start": "-0550", "end": "-0330", "label": "Achaemenid Persian"},
    "ptolemaic": {"start": "-0323", "end": "-0031", "label": "Ptolemaic Egypt"},
    "sassanid": {"start": "0224", "end": "0651", "label": "Sassanid Persian"},
}


class PleiadesIngestor(BaseIngestor):
    """
    Ingestor for Pleiades ancient places gazetteer.

    Creates: locations (with extended geographic schema)
    Does NOT create: factoids, sources, actors

    Uses the extended schema fields:
    - name_historical: Structured with period_start/period_end
    - uncertainty_notes: From Pleiades precision
    - location_changes: From time periods
    - terrain_notes: From feature types
    - boundary_geojson: From bounding box (for areas)
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

        # Build structured historical names
        historical_names = self._build_historical_names(row, pleiades_id)

        # Parse time periods into location_changes structure
        location_changes = self._parse_time_periods(row)

        # Build uncertainty notes from precision
        precision = row.get("locationPrecision", "").lower()
        uncertainty_km = self._precision_to_uncertainty(precision)
        uncertainty_notes = self._build_uncertainty_notes(precision, row)

        # Build boundary_geojson for areas from bounding box
        boundary_geojson = self._build_boundary(row, location_type)

        # Build terrain notes from feature types
        terrain_notes = self._build_terrain_notes(row)

        # Build description with Pleiades URL
        description = self._build_description(row, pleiades_id)

        await self.create_location(
            name_modern=title,
            name_historical=historical_names,
            location_type=location_type,
            location_subtype=location_subtype,
            longitude=longitude,
            latitude=latitude,
            uncertainty_radius_km=uncertainty_km,
            uncertainty_notes=uncertainty_notes,
            boundary_geojson=boundary_geojson,
            location_changes=location_changes,
            terrain_notes=terrain_notes,
            description=description,
            external_id=f"pleiades:{pleiades_id}",
        )

    def _build_historical_names(self, row: dict, pleiades_id: str) -> list:
        """
        Build structured historical names with period information.

        Returns list of structured name objects per vision spec.
        """
        names = []
        title = row.get("title", "").strip()
        time_periods = row.get("timePeriodsKeys", "").strip()

        # Determine overall period range from time periods
        period_start, period_end = self._get_period_range(time_periods)

        # Add the main title as a historical name
        if title:
            name_entry = {"name": title}
            if period_start:
                name_entry["period_start"] = period_start
            if period_end:
                name_entry["period_end"] = period_end
            name_entry["source"] = "Pleiades Gazetteer"
            names.append(name_entry)

        # Add the Pleiades identifier for deduplication
        if pleiades_id:
            names.append(f"pleiades:{pleiades_id}")

        return names

    def _get_period_range(self, time_periods_str: str) -> tuple[str | None, str | None]:
        """
        Get overall date range from Pleiades time period keys.

        Returns (period_start, period_end) as date strings.
        """
        if not time_periods_str:
            return None, None

        periods = [p.strip().lower() for p in time_periods_str.split(",") if p.strip()]
        if not periods:
            return None, None

        # Find earliest start and latest end
        earliest_start = None
        latest_end = None

        for period_key in periods:
            period_info = PLEIADES_PERIODS.get(period_key)
            if period_info:
                start = period_info.get("start")
                end = period_info.get("end")

                if start:
                    if earliest_start is None or start < earliest_start:
                        earliest_start = start
                if end:
                    if latest_end is None or end > latest_end:
                        latest_end = end

        return earliest_start, latest_end

    def _parse_time_periods(self, row: dict) -> list | None:
        """
        Parse Pleiades time periods into location_changes structure.

        This captures when a place was known to be active/inhabited.
        """
        time_periods_str = row.get("timePeriodsKeys", "").strip()
        if not time_periods_str:
            return None

        periods = [p.strip().lower() for p in time_periods_str.split(",") if p.strip()]
        if not periods:
            return None

        changes = []
        for period_key in periods:
            period_info = PLEIADES_PERIODS.get(period_key)
            if period_info:
                change = {
                    "period": period_info.get("label", period_key),
                    "period_key": period_key,
                    "description": f"Attested during {period_info.get('label', period_key)} period",
                }
                if period_info.get("start"):
                    change["period_start"] = period_info["start"]
                if period_info.get("end"):
                    change["period_end"] = period_info["end"]
                changes.append(change)

        return changes if changes else None

    def _build_uncertainty_notes(self, precision: str, row: dict) -> str | None:
        """Build uncertainty notes explaining the source of uncertainty."""
        notes_parts = []

        precision_descriptions = {
            "precise": "Pleiades precision: precise - coordinates accurate to < 1 km",
            "rough": "Pleiades precision: rough - coordinates approximate (5 km uncertainty)",
            "related": "Pleiades precision: related - location based on nearby known place (10 km uncertainty)",
            "unlocated": "Pleiades precision: unlocated - exact position unknown",
        }

        if precision and precision in precision_descriptions:
            notes_parts.append(precision_descriptions[precision])

        # Add certainty info if available
        certainty = row.get("certainty", "").strip()
        if certainty:
            notes_parts.append(f"Certainty: {certainty}")

        return "; ".join(notes_parts) if notes_parts else None

    def _build_boundary(self, row: dict, location_type: str) -> dict | None:
        """
        Build boundary_geojson from Pleiades bounding box for area types.
        """
        if location_type != "area":
            return None

        # Pleiades provides bbox as comma-separated: minLon,minLat,maxLon,maxLat
        bbox_str = row.get("bbox", "").strip()
        if not bbox_str:
            return None

        try:
            parts = [float(x.strip()) for x in bbox_str.split(",")]
            if len(parts) == 4:
                min_lon, min_lat, max_lon, max_lat = parts
                # Create GeoJSON Polygon for the bounding box
                return {
                    "type": "Polygon",
                    "coordinates": [[
                        [min_lon, min_lat],
                        [max_lon, min_lat],
                        [max_lon, max_lat],
                        [min_lon, max_lat],
                        [min_lon, min_lat],  # Close the polygon
                    ]]
                }
        except (ValueError, IndexError):
            pass

        return None

    def _build_terrain_notes(self, row: dict) -> str | None:
        """Build terrain notes from feature types."""
        feature_types = row.get("featureTypes", "").strip()
        if not feature_types:
            return None

        return f"Pleiades feature types: {feature_types}"

    def _build_description(self, row: dict, pleiades_id: str) -> str | None:
        """Build description including Pleiades URL and metadata."""
        parts = []

        # Original description
        desc = row.get("description", "").strip()
        if desc:
            parts.append(desc)

        # Time periods in human readable form
        time_periods = row.get("timePeriods", "").strip()
        if time_periods:
            parts.append(f"Active periods: {time_periods}")

        # Date range
        min_date = row.get("minDate", "")
        max_date = row.get("maxDate", "")
        if min_date and max_date:
            parts.append(f"Date range: {min_date} to {max_date}")

        # Pleiades URL for reference
        if pleiades_id:
            parts.append(f"Source: https://pleiades.stoa.org/places/{pleiades_id}")

        return "\n\n".join(parts) if parts else None

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
