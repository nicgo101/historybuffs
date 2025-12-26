"""
Pleiades Gazetteer data ingestor (JSON format).

Pleiades is a community-built gazetteer of ancient places.
https://pleiades.stoa.org/

This ingestor uses the comprehensive JSON dump which includes:
- Full names with attestations, languages, date ranges
- Multiple location variants with coordinates and accuracy
- Connections between places
- References and citations

Creates: locations (with extended geographic schema)
Does NOT create: factoids, sources, actors
"""

import gzip
import json
import logging
from decimal import Decimal
from pathlib import Path
from typing import Any

from tqdm import tqdm

from .base import BaseIngestor


def convert_decimals(obj):
    """Recursively convert Decimal objects to float for JSON serialization."""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: convert_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_decimals(item) for item in obj]
    return obj

logger = logging.getLogger(__name__)


class PleiadesIngestor(BaseIngestor):
    """
    Ingestor for Pleiades ancient places gazetteer (JSON format).

    Creates: locations (with extended geographic schema) + connections
    Does NOT create: factoids, sources, actors

    Uses the extended schema fields:
    - name_historical: Structured names with languages, periods, attestations
    - uncertainty_notes: From accuracy values and location precision
    - location_changes: From location variants with different date ranges
    - terrain_notes: From place types
    - boundary_geojson: From bbox

    Connections are ingested in a second pass after all locations exist.
    """

    def __init__(self, data_dir: str = "./data"):
        super().__init__(data_dir)
        # Cache: pleiades_id -> location_uuid
        self.location_id_cache: dict[str, str] = {}
        # Store connections for second pass: list of (from_pleiades_id, connection_data)
        self.pending_connections: list[tuple[str, dict]] = []

    def get_source_name(self) -> str:
        return "Pleiades Gazetteer"

    async def ingest(self, limit: int | None = None, skip_connections: bool = False) -> dict[str, Any]:
        """
        Ingest Pleiades places as locations from JSON dump.

        Args:
            limit: Optional limit on number of places to ingest (for testing).
            skip_connections: If True, skip the connections pass (faster for testing).

        Returns:
            Ingestion statistics.
        """
        await self.connect()

        try:
            data_path = Path(self.data_dir)
            json_file = self._find_json_file(data_path)

            self.log_progress(f"Found file: {json_file}")
            self.log_progress("Loading JSON data (this may take a moment)...")

            places = self._load_places(json_file)
            if limit:
                places = places[:limit]

            self.log_progress(f"Processing {len(places)} places...")

            # First pass: Create locations and collect connections
            for place in tqdm(places, desc="Pleiades locations"):
                try:
                    await self._process_place(place)
                except Exception as e:
                    self.log_error(f"Failed to process place {place.get('id', 'unknown')}", e)

            self.log_progress(f"Locations complete. Cache has {len(self.location_id_cache)} entries.")

            # Second pass: Create connections
            if not skip_connections and self.pending_connections:
                self.log_progress(f"Processing {len(self.pending_connections)} connections...")
                await self._process_connections()
            elif self.pending_connections:
                self.log_progress(f"Skipping {len(self.pending_connections)} connections (skip_connections=True)")

            self.log_progress("Ingestion complete!")
            return self.get_stats()

        finally:
            await self.close()

    def _find_json_file(self, data_path: Path) -> Path:
        """Find Pleiades JSON file."""
        # Check for gzipped JSON (preferred)
        gz_files = list(data_path.glob("pleiades*.json.gz"))
        if gz_files:
            return gz_files[0]

        # Check for uncompressed JSON
        json_files = list(data_path.glob("pleiades*.json"))
        if json_files:
            return json_files[0]

        raise FileNotFoundError(
            f"No Pleiades JSON file found in {data_path}. "
            "Download pleiades-places-latest.json.gz from https://pleiades.stoa.org/downloads"
        )

    def _load_places(self, json_file: Path) -> list[dict]:
        """Load places from JSON file using streaming parser for large files."""
        try:
            import ijson
            return self._load_places_streaming(json_file)
        except ImportError:
            # Fall back to full load if ijson not available
            logger.warning("ijson not installed, loading full JSON into memory")
            return self._load_places_full(json_file)

    def _load_places_streaming(self, json_file: Path) -> list[dict]:
        """Stream parse JSON file using ijson (memory efficient)."""
        import ijson
        places = []

        if json_file.suffix == '.gz':
            f = gzip.open(json_file, 'rb')
        else:
            f = open(json_file, 'rb')

        try:
            # Stream parse @graph array items
            parser = ijson.items(f, '@graph.item')
            for place in parser:
                places.append(place)
        finally:
            f.close()

        return places

    def _load_places_full(self, json_file: Path) -> list[dict]:
        """Load all places from JSON file into memory."""
        if json_file.suffix == '.gz':
            with gzip.open(json_file, 'rt', encoding='utf-8') as f:
                data = json.load(f)
        else:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

        # The JSON dump is a dict with @graph containing the places
        if isinstance(data, dict) and '@graph' in data:
            return data['@graph']
        # Or it might be a list directly
        if isinstance(data, list):
            return data
        # Or places might be nested differently
        if isinstance(data, dict) and 'places' in data:
            return data['places']

        raise ValueError(f"Unexpected JSON structure in {json_file}")

    async def _process_place(self, place: dict) -> None:
        """Process a single Pleiades place into a location."""
        # Convert Decimal objects from ijson to float for JSON serialization
        place = convert_decimals(place)

        pleiades_id = place.get("id", "")
        title = place.get("title", "").strip()

        if not title:
            self.stats["locations_skipped"] += 1
            return

        # Get representative point coordinates
        latitude, longitude = self._get_coordinates(place)

        # Determine location type and subtype from placeTypes
        place_types = place.get("placeTypes", [])
        location_type, location_subtype = self._map_place_types(place_types)

        # Build structured historical names from names array
        historical_names = self._build_historical_names(place, pleiades_id)

        # Parse locations into location_changes (different positions over time)
        location_changes = self._parse_location_changes(place)

        # Build uncertainty notes from accuracy and precision
        uncertainty_km, uncertainty_notes = self._build_uncertainty(place)

        # Build boundary from bbox
        boundary_geojson = self._build_boundary(place, location_type)

        # Build terrain notes from place types
        terrain_notes = self._build_terrain_notes(place_types)

        # Build description (without connection count - we'll store actual connections)
        description = self._build_description(place, pleiades_id)

        location_uuid = await self.create_location(
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

        # Cache the location UUID for connection processing
        if location_uuid and pleiades_id:
            self.location_id_cache[pleiades_id] = location_uuid

        # Collect connections for second pass
        connections = place.get("connections", [])
        for conn in connections:
            self.pending_connections.append((pleiades_id, conn))

    async def _process_connections(self) -> None:
        """
        Process collected connections in a second pass.

        This ensures all locations exist before creating connections between them.
        """
        success = 0
        skipped_missing = 0
        skipped_error = 0

        for from_pleiades_id, conn in tqdm(self.pending_connections, desc="Pleiades connections"):
            try:
                # Get the "from" location UUID from cache
                from_uuid = self.location_id_cache.get(from_pleiades_id)
                if not from_uuid:
                    skipped_missing += 1
                    continue

                # Extract the "to" Pleiades ID from the URL
                # URL format: https://pleiades.stoa.org/places/413005
                connects_to = conn.get("connectsTo", "")
                to_pleiades_id = self._extract_pleiades_id(connects_to)
                if not to_pleiades_id:
                    skipped_missing += 1
                    continue

                # Get the "to" location UUID from cache
                to_uuid = self.location_id_cache.get(to_pleiades_id)
                if not to_uuid:
                    skipped_missing += 1
                    continue

                # Map Pleiades connection type to our schema
                connection_type = self._map_connection_type(conn.get("connectionType", "connection"))

                # Map certainty to confidence
                certainty = conn.get("associationCertainty", "certain")
                confidence = self._map_certainty_to_confidence(certainty)

                # Build notes with temporal and attestation info
                notes = self._build_connection_notes(conn)

                # Create the connection
                await self.create_connection(
                    from_entity_type="location",
                    from_entity_id=from_uuid,
                    to_entity_type="location",
                    to_entity_id=to_uuid,
                    connection_type=connection_type,
                    confidence=confidence,
                    notes=notes,
                )
                success += 1

            except Exception as e:
                self.log_error(f"Failed to create connection from {from_pleiades_id}", e)
                skipped_error += 1

        self.log_progress(
            f"Connections: {success} created, {skipped_missing} skipped (missing), {skipped_error} errors"
        )

    def _extract_pleiades_id(self, url: str) -> str | None:
        """Extract Pleiades ID from URL like https://pleiades.stoa.org/places/413005"""
        if not url:
            return None
        # Handle both full URLs and just the ID
        if "pleiades.stoa.org/places/" in url:
            return url.split("/places/")[-1].split("/")[0]
        if url.isdigit():
            return url
        return None

    def _map_connection_type(self, pleiades_type: str) -> str:
        """Map Pleiades connection types to our schema types."""
        # Our schema supports: temporal, spatial, evidential, creative
        # Map Pleiades types to appropriate categories

        spatial_types = {
            "at", "on", "near", "in", "bounds", "abuts", "crosses", "intersects",
            "part_of_physical", "part_of_regional", "part_of_admin", "part_of_analytical",
            "north_of", "south_of", "east_of", "west_of",
            "northeast_of", "northwest_of", "southeast_of", "southwest_of",
            "in_territory_of", "port_of",
        }

        temporal_types = {
            "succeeds", "founded", "relocated_to", "phase",
        }

        route_types = {
            "route_next", "communicates", "flows_into", "flows_through",
        }

        identity_types = {
            "same_as", "member", "sympoliteia", "isopoliteia", "dependent", "ally",
        }

        administrative_types = {
            "capital", "material_source",
        }

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

        # Default: use as-is with "pleiades:" prefix
        return f"pleiades:{pt}"

    def _map_certainty_to_confidence(self, certainty: str) -> float:
        """Map Pleiades certainty levels to confidence scores."""
        mapping = {
            "certain": 0.95,
            "confident": 0.85,
            "less-certain": 0.65,
            "uncertain": 0.45,
        }
        return mapping.get(certainty.lower(), 0.75)

    def _build_connection_notes(self, conn: dict) -> str | None:
        """Build notes string from connection metadata."""
        parts = []

        # Title of the connected place
        title = conn.get("title", "")
        if title:
            parts.append(f"Connected to: {title}")

        # Temporal range
        start = conn.get("start")
        end = conn.get("end")
        if start is not None or end is not None:
            period = f"{start or '?'} - {end or '?'}"
            parts.append(f"Period: {period}")

        # Attestations
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

        # Pleiades reference
        uri = conn.get("uri")
        if uri:
            parts.append(f"Source: {uri}")

        return "; ".join(parts) if parts else None

    def _get_coordinates(self, place: dict) -> tuple[float | None, float | None]:
        """Extract representative coordinates from place."""
        # Try reprPoint first (representative point)
        repr_point = place.get("reprPoint")
        if repr_point and len(repr_point) == 2:
            return repr_point[1], repr_point[0]  # [lon, lat] -> (lat, lon)

        # Try features geometry
        features = place.get("features", [])
        for feature in features:
            geom = feature.get("geometry")
            if geom and geom.get("type") == "Point":
                coords = geom.get("coordinates", [])
                if len(coords) >= 2:
                    return coords[1], coords[0]  # [lon, lat] -> (lat, lon)

        # Try locations array
        locations = place.get("locations", [])
        for loc in locations:
            geom = loc.get("geometry")
            if geom and geom.get("type") == "Point":
                coords = geom.get("coordinates", [])
                if len(coords) >= 2:
                    return coords[1], coords[0]

        return None, None

    def _build_historical_names(self, place: dict, pleiades_id: str) -> list:
        """
        Build structured historical names from Pleiades names array.

        The JSON has rich name data with:
        - attested: The name as attested in sources
        - romanized: Romanized version
        - language: Language code
        - start/end: Date range (years)
        - attestations: Array of {timePeriod, confidence}
        """
        names = []
        title = place.get("title", "").strip()

        # Process each name from the names array
        for name_obj in place.get("names", []):
            attested = name_obj.get("attested", "").strip()
            romanized = name_obj.get("romanized", "").strip()
            language = name_obj.get("language", "")

            # Use attested name if available, otherwise romanized
            name_str = attested or romanized
            if not name_str:
                continue

            name_entry = {"name": name_str}

            # Add language if available
            if language:
                name_entry["language"] = language

            # Add romanized version if different from attested
            if attested and romanized and attested != romanized:
                name_entry["romanized"] = romanized

            # Add date range from start/end years
            start_year = name_obj.get("start")
            end_year = name_obj.get("end")
            if start_year is not None:
                name_entry["period_start"] = self._year_to_date_string(start_year)
            if end_year is not None:
                name_entry["period_end"] = self._year_to_date_string(end_year)

            # Add attestation info
            attestations = name_obj.get("attestations", [])
            if attestations:
                periods = []
                for a in attestations:
                    tp = a.get("timePeriod")
                    if tp:
                        # timePeriod can be a string or a dict with title
                        if isinstance(tp, str):
                            periods.append(tp)
                        elif isinstance(tp, dict):
                            periods.append(tp.get("title", str(tp)))
                if periods:
                    name_entry["attested_periods"] = periods

            name_entry["source"] = "Pleiades Gazetteer"
            names.append(name_entry)

        # If no names from array, use title
        if not names and title:
            names.append({"name": title, "source": "Pleiades Gazetteer"})

        # Add the Pleiades identifier for deduplication
        if pleiades_id:
            names.append(f"pleiades:{pleiades_id}")

        return names

    def _year_to_date_string(self, year: int) -> str:
        """Convert year integer to date string for BCE/CE."""
        if year < 0:
            return f"{abs(year):04d}-01-01 BC"
        else:
            return f"{year:04d}-01-01"

    def _parse_location_changes(self, place: dict) -> list | None:
        """
        Parse Pleiades locations array into location_changes.

        Different locations may represent the place at different times
        or different scholarly interpretations.
        """
        locations = place.get("locations", [])
        if not locations:
            return None

        changes = []
        for loc in locations:
            title = loc.get("title", "")
            start_year = loc.get("start")
            end_year = loc.get("end")

            change = {
                "description": title or "Location variant",
            }

            # Add coordinates if available
            geom = loc.get("geometry")
            if geom and geom.get("type") == "Point":
                coords = geom.get("coordinates", [])
                if len(coords) >= 2:
                    change["coordinates"] = {"x": coords[0], "y": coords[1]}

            # Add date range
            if start_year is not None:
                change["period_start"] = self._year_to_date_string(start_year)
            if end_year is not None:
                change["period_end"] = self._year_to_date_string(end_year)

            # Add accuracy info
            accuracy = loc.get("accuracy")
            if accuracy:
                change["accuracy"] = accuracy

            # Add attestations
            attestations = loc.get("attestations", [])
            if attestations:
                periods = []
                for att in attestations:
                    tp = att.get("timePeriod")
                    confidence = att.get("confidence", "")
                    # timePeriod can be a string or a dict with title
                    if tp:
                        period_title = tp if isinstance(tp, str) else tp.get("title", str(tp))
                        if period_title:
                            periods.append(f"{period_title} ({confidence})" if confidence else period_title)
                if periods:
                    change["attested_periods"] = periods

            changes.append(change)

        return changes if changes else None

    def _build_uncertainty(self, place: dict) -> tuple[float | None, str | None]:
        """Build uncertainty radius and notes from accuracy data."""
        notes_parts = []
        uncertainty_km = None

        # Check locations for accuracy info
        locations = place.get("locations", [])
        accuracies = []
        for loc in locations:
            accuracy = loc.get("accuracy")
            if accuracy:
                accuracies.append(accuracy)

            # Check location precision
            precision = loc.get("location_precision") or loc.get("locationType")
            if precision:
                notes_parts.append(f"Location precision: {precision}")

        if accuracies:
            notes_parts.append(f"Accuracy values: {', '.join(accuracies)}")
            # Try to extract numeric accuracy
            for acc in accuracies:
                if isinstance(acc, str) and 'meters' in acc.lower():
                    try:
                        # Extract number from strings like "200 meters"
                        num = float(''.join(c for c in acc if c.isdigit() or c == '.'))
                        uncertainty_km = num / 1000
                        break
                    except ValueError:
                        pass

        # Check review state
        review_state = place.get("review_state")
        if review_state and review_state != "published":
            notes_parts.append(f"Review state: {review_state}")

        return uncertainty_km, "; ".join(notes_parts) if notes_parts else None

    def _build_boundary(self, place: dict, location_type: str) -> dict | None:
        """Build boundary GeoJSON from bbox."""
        if location_type != "area":
            return None

        bbox = place.get("bbox")
        if not bbox or len(bbox) != 4:
            return None

        try:
            min_lon, min_lat, max_lon, max_lat = bbox
            return {
                "type": "Polygon",
                "coordinates": [[
                    [min_lon, min_lat],
                    [max_lon, min_lat],
                    [max_lon, max_lat],
                    [min_lon, max_lat],
                    [min_lon, min_lat],
                ]]
            }
        except (ValueError, TypeError):
            return None

    def _build_terrain_notes(self, place_types: list) -> str | None:
        """Build terrain notes from place types."""
        if not place_types:
            return None
        return f"Pleiades place types: {', '.join(place_types)}"

    def _build_description(self, place: dict, pleiades_id: str) -> str | None:
        """Build description including metadata and references."""
        parts = []

        # Original description
        desc = place.get("description", "").strip()
        if desc:
            parts.append(desc)

        # Connections
        connects_with = place.get("connectsWith", [])
        if connects_with:
            parts.append(f"Connected to {len(connects_with)} other places")

        # References
        references = place.get("references", [])
        if references:
            ref_count = len(references)
            parts.append(f"Citations: {ref_count} reference(s)")

        # Pleiades URL
        if pleiades_id:
            parts.append(f"Source: https://pleiades.stoa.org/places/{pleiades_id}")

        return "\n\n".join(parts) if parts else None

    def _map_place_types(self, place_types: list) -> tuple[str, str | None]:
        """
        Map Pleiades place types to our location_type/location_subtype.

        location_type: point, area, linear
        location_subtype: more specific classification
        """
        if not place_types:
            return ("point", None)

        types_lower = [t.lower() for t in place_types]
        types_str = " ".join(types_lower)

        # Areas
        if any(x in types_str for x in ["region", "province", "territory", "country", "diocese"]):
            return ("area", "region")
        if any(x in types_str for x in ["island", "peninsula"]):
            return ("area", "landform")
        if any(x in types_str for x in ["bay", "gulf", "strait", "sea", "ocean"]):
            return ("area", "water")

        # Linear features
        if any(x in types_str for x in ["road", "via", "wall", "aqueduct", "canal"]):
            return ("linear", place_types[0] if place_types else None)
        if "river" in types_str:
            return ("linear", "river")

        # Points - settlements
        if any(x in types_str for x in ["settlement", "urban", "city", "town", "village", "polis"]):
            return ("point", "settlement")

        # Points - landmarks
        if any(x in types_str for x in ["temple", "sanctuary", "shrine", "church"]):
            return ("point", "religious")
        if any(x in types_str for x in ["fort", "fortress", "military", "camp", "castrum"]):
            return ("point", "military")
        if any(x in types_str for x in ["port", "harbor", "harbour"]):
            return ("point", "port")
        if any(x in types_str for x in ["mine", "quarry"]):
            return ("point", "resource")
        if any(x in types_str for x in ["bath", "theater", "theatre", "stadium", "arena", "amphitheater"]):
            return ("point", "civic")
        if any(x in types_str for x in ["cemetery", "tomb", "necropolis", "tumulus"]):
            return ("point", "funerary")

        # Natural features
        if any(x in types_str for x in ["mountain", "peak", "hill", "volcano", "mons"]):
            return ("point", "mountain")
        if any(x in types_str for x in ["lake", "spring", "well", "fountain"]):
            return ("point", "water")
        if any(x in types_str for x in ["cape", "promontory"]):
            return ("point", "landform")

        # Default
        return ("point", place_types[0] if place_types else None)
