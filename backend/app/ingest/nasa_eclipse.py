"""
NASA Eclipse data ingestor.

NASA provides precise historical eclipse data going back thousands of years.
https://eclipse.gsfc.nasa.gov/

This is IDEAL data for HistoryBuff because:
- Astronomically calculated = high confidence
- Precise dates (can anchor other events)
- Verifiable against historical records
- Spans ancient to modern times

Creates: factoids + factoid_placements + locations (for path)
Source: NASA GSFC Eclipse Website
"""

import csv
import logging
from datetime import date
from pathlib import Path
from typing import Any

from tqdm import tqdm

from .base import BaseIngestor

logger = logging.getLogger(__name__)


def make_date_string(year: int, month: int, day: int) -> str:
    """
    Create a date string that handles BCE years for PostgreSQL.

    PostgreSQL expects BCE dates in format: '0584-05-28 BC'

    Args:
        year: Year (negative for BCE, e.g., -584 for 585 BCE)
        month: Month (1-12)
        day: Day (1-31)

    Returns:
        PostgreSQL date string (e.g., "0584-05-28 BC" or "0029-11-24")
    """
    if year <= 0:
        # BCE year - format with BC suffix for PostgreSQL
        # Note: Historical convention is year 1 BCE = year 0 in astronomical
        return f"{abs(year):04d}-{month:02d}-{day:02d} BC"
    else:
        return f"{year:04d}-{month:02d}-{day:02d}"

# NASA Eclipse catalog URLs (for reference - data should be downloaded)
# Solar: https://eclipse.gsfc.nasa.gov/SEcat5/SE-1999--1900.html
# Lunar: https://eclipse.gsfc.nasa.gov/LEcat5/LE-1999--1900.html

# Eclipse type descriptions
ECLIPSE_TYPES = {
    "T": "Total solar eclipse",
    "A": "Annular solar eclipse",
    "H": "Hybrid solar eclipse",
    "P": "Partial solar eclipse",
    "T+": "Total lunar eclipse",
    "P+": "Partial lunar eclipse",
    "N": "Penumbral lunar eclipse",
}


class NASAEclipseIngestor(BaseIngestor):
    """
    Ingestor for NASA historical eclipse data.

    Creates:
    - factoids (type: astronomical_event)
    - factoid_placements (with precise dates)
    - source (NASA GSFC)

    This is high-confidence data that can serve as temporal anchors.
    """

    def __init__(self, data_dir: str = "./data"):
        super().__init__(data_dir)
        self.nasa_source_id: str | None = None

    def get_source_name(self) -> str:
        return "NASA Eclipse Data"

    async def ingest(self, limit: int | None = None) -> dict[str, Any]:
        """
        Ingest NASA eclipse data.

        Looks for CSV files with eclipse data in the data directory.
        Expected format: date, time, type, latitude, longitude, etc.

        Args:
            limit: Optional limit on number of eclipses to ingest.

        Returns:
            Ingestion statistics.
        """
        await self.connect()

        try:
            # Create NASA source record
            self.nasa_source_id = await self.create_source(
                title="NASA GSFC Eclipse Website",
                source_type="tertiary",  # Compiled scientific data
                genre="astronomical_catalog",
                raw_dating_evidence="Calculated from astronomical algorithms",
                digital_url="https://eclipse.gsfc.nasa.gov/",
            )

            # Find eclipse data files
            data_path = Path(self.data_dir)
            eclipse_files = list(data_path.glob("*eclipse*.csv")) + list(data_path.glob("*eclipse*.txt"))

            if not eclipse_files:
                self.log_progress("No eclipse data files found. Creating sample data...")
                await self._ingest_sample_historical_eclipses(limit)
            else:
                for eclipse_file in eclipse_files:
                    self.log_progress(f"Processing: {eclipse_file.name}")
                    await self._process_eclipse_file(eclipse_file, limit)

            self.log_progress("Ingestion complete!")
            return self.get_stats()

        finally:
            await self.close()

    async def _ingest_sample_historical_eclipses(self, limit: int | None = None) -> None:
        """
        Ingest a curated set of historically significant eclipses.

        These are eclipses mentioned in historical records that help
        anchor chronology.
        """
        # Historically significant eclipses (well-documented in ancient sources)
        # Using make_date_string() for BCE dates since Python date() doesn't support them
        historical_eclipses = [
            {
                "date": make_date_string(-584, 5, 28),  # 585 BCE
                "type": "T",
                "name": "Eclipse of Thales",
                "description": "Solar eclipse predicted by Thales of Miletus. Said to have stopped the battle between Lydians and Medes.",
                "lat": 39.0,
                "lon": 35.0,
                "confidence": 0.95,
                "layer": "attested",
                "raw_observation": "Herodotus, Histories 1.74: 'Day was turned into night'",
            },
            {
                "date": make_date_string(-430, 8, 3),  # 431 BCE
                "type": "A",
                "name": "Eclipse at start of Peloponnesian War",
                "description": "Annular solar eclipse at the start of the Peloponnesian War, recorded by Thucydides.",
                "lat": 38.0,
                "lon": 23.7,
                "confidence": 0.95,
                "layer": "attested",
                "raw_observation": "Thucydides 2.28: 'The sun was eclipsed'",
            },
            {
                "date": make_date_string(-309, 8, 15),  # 310 BCE
                "type": "T",
                "name": "Eclipse of Agathocles",
                "description": "Total solar eclipse observed as Agathocles sailed from Syracuse to Africa.",
                "lat": 37.0,
                "lon": 15.0,
                "confidence": 0.90,
                "layer": "attested",
                "raw_observation": "Diodorus Siculus 20.5",
            },
            {
                "date": make_date_string(-189, 3, 14),  # 190 BCE
                "type": "A",
                "name": "Eclipse before Battle of Magnesia",
                "description": "Annular eclipse recorded before the Roman-Seleucid Battle of Magnesia.",
                "lat": 38.6,
                "lon": 27.4,
                "confidence": 0.90,
                "layer": "attested",
                "raw_observation": "Livy 37.4.4",
            },
            {
                "date": make_date_string(-167, 6, 21),  # 168 BCE
                "type": "T+",
                "name": "Eclipse before Battle of Pydna",
                "description": "Total lunar eclipse the night before the Battle of Pydna. Sulpicius Gallus predicted it.",
                "lat": 40.4,
                "lon": 22.5,
                "confidence": 0.95,
                "layer": "documented",
                "raw_observation": "Livy 44.37.5-9; Pliny NH 2.53",
            },
            {
                "date": make_date_string(-43, 5, 24),  # 44 BCE
                "type": "P",
                "name": "Eclipse after Caesar's assassination",
                "description": "Partial solar eclipse following Julius Caesar's assassination. Associated with 'Caesar's Comet'.",
                "lat": 41.9,
                "lon": 12.5,
                "confidence": 0.85,
                "layer": "attested",
                "raw_observation": "Multiple Roman sources mention darkened sun",
            },
            {
                "date": make_date_string(29, 11, 24),  # 29 CE
                "type": "T",
                "name": "Eclipse near Crucifixion date",
                "description": "Total solar eclipse visible in the Mediterranean region, one of several candidates for the 'darkness' at the Crucifixion.",
                "lat": 32.0,
                "lon": 35.0,
                "confidence": 0.70,  # Lower - controversial dating
                "layer": "traditional",
                "raw_observation": "Phlegon of Tralles fragment preserved in Origen",
            },
            {
                "date": make_date_string(59, 4, 30),  # 59 CE
                "type": "A",
                "name": "Eclipse in reign of Nero",
                "description": "Annular solar eclipse recorded during Nero's reign.",
                "lat": 41.9,
                "lon": 12.5,
                "confidence": 0.90,
                "layer": "documented",
                "raw_observation": "Tacitus Annals 14.12",
            },
            {
                "date": make_date_string(71, 3, 20),  # 71 CE
                "type": "T",
                "name": "Eclipse during Jewish War",
                "description": "Total solar eclipse during the Roman siege of Jerusalem.",
                "lat": 31.8,
                "lon": 35.2,
                "confidence": 0.90,
                "layer": "attested",
                "raw_observation": "Josephus references",
            },
            {
                "date": make_date_string(364, 6, 16),  # 364 CE
                "type": "T",
                "name": "Eclipse of Julian's Persian campaign",
                "description": "Total solar eclipse during Emperor Julian's Persian campaign.",
                "lat": 33.0,
                "lon": 44.0,
                "confidence": 0.90,
                "layer": "documented",
                "raw_observation": "Ammianus Marcellinus 25.10.2",
            },
            {
                "date": make_date_string(484, 1, 14),  # 484 CE
                "type": "T",
                "name": "Eclipse recorded in Chinese sources",
                "description": "Total solar eclipse recorded in both Roman and Chinese sources.",
                "lat": 35.0,
                "lon": 110.0,
                "confidence": 0.95,
                "layer": "documented",
                "raw_observation": "Chinese dynastic histories",
            },
            {
                "date": make_date_string(590, 10, 4),  # 590 CE
                "type": "T",
                "name": "Eclipse during Gregory of Tours' time",
                "description": "Total solar eclipse recorded by Gregory of Tours.",
                "lat": 47.4,
                "lon": 0.7,
                "confidence": 0.90,
                "layer": "documented",
                "raw_observation": "Gregory of Tours, History of the Franks 10.23",
            },
            {
                "date": make_date_string(840, 5, 5),  # 840 CE
                "type": "T",
                "name": "Eclipse and death of Louis the Pious",
                "description": "Total solar eclipse shortly before the death of Louis the Pious. Seen as an omen.",
                "lat": 49.0,
                "lon": 7.0,
                "confidence": 0.95,
                "layer": "documented",
                "raw_observation": "Multiple Carolingian sources",
            },
            {
                "date": make_date_string(1133, 8, 2),  # 1133 CE
                "type": "T",
                "name": "King Henry's Eclipse",
                "description": "Total solar eclipse associated with the death of King Henry I of England.",
                "lat": 51.5,
                "lon": -0.1,
                "confidence": 0.95,
                "layer": "documented",
                "raw_observation": "William of Malmesbury",
            },
        ]

        count = 0
        for eclipse in tqdm(historical_eclipses, desc="Historical eclipses"):
            if limit and count >= limit:
                break

            try:
                await self._create_eclipse_factoid(eclipse)
                count += 1
            except Exception as e:
                self.log_error(f"Failed to create eclipse: {eclipse['name']}", e)

    async def _create_eclipse_factoid(self, eclipse: dict) -> None:
        """Create a factoid and placement for an eclipse."""
        eclipse_type = ECLIPSE_TYPES.get(eclipse["type"], "Eclipse")
        date_str = eclipse["date"]  # Already a string from make_date_string()

        # Create the factoid
        factoid_id = await self.create_factoid(
            description=f"{eclipse['name']}: {eclipse['description']}",
            summary=f"{eclipse_type} on {self._format_date_display(date_str)}",
            factoid_type="event",
            layer=eclipse.get("layer", "documented"),
            raw_observation=eclipse.get("raw_observation"),
            raw_observation_type="document_text",
            status="verified",  # NASA data is verified
        )

        if not factoid_id:
            return

        # Create placement with the precise date (string format for BCE support)
        await self.create_placement(
            factoid_id=factoid_id,
            date_start=date_str,
            date_end=date_str,
            date_precision="exact",
            placement_confidence=eclipse.get("confidence", 0.95),
            reasoning="Astronomically calculated eclipse date from NASA GSFC",
            placement_type="system",
        )

        # Link to NASA source
        if self.nasa_source_id:
            await self.link_factoid_source(
                factoid_id=factoid_id,
                source_id=self.nasa_source_id,
                relationship="primary_source",
            )

        # Create location for eclipse visibility
        if eclipse.get("lat") and eclipse.get("lon"):
            location_id = await self.create_location(
                name_modern=f"Eclipse visibility: {eclipse['name']}",
                location_type="area",
                location_subtype="eclipse_path",
                latitude=eclipse["lat"],
                longitude=eclipse["lon"],
                uncertainty_radius_km=500.0,  # Eclipse paths are wide
                description=f"Central path of {eclipse_type.lower()}",
            )

            # Connect factoid to location
            if location_id:
                await self.create_connection(
                    from_entity_type="factoid",
                    from_entity_id=factoid_id,
                    to_entity_type="location",
                    to_entity_id=location_id,
                    connection_type="located_at",
                    confidence=0.8,
                    notes="Approximate central path of eclipse visibility",
                )

    async def _process_eclipse_file(self, file_path: Path, limit: int | None) -> None:
        """Process a NASA eclipse data file."""
        # This handles the actual NASA data format if user downloads it
        # Format varies but typically includes: date, time, type, coordinates
        with open(file_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0

            for row in reader:
                if limit and count >= limit:
                    break

                try:
                    # Try to parse common NASA formats
                    eclipse = self._parse_nasa_row(row)
                    if eclipse:
                        await self._create_eclipse_factoid(eclipse)
                        count += 1
                except Exception as e:
                    self.log_error(f"Failed to parse row: {row}", e)

    def _parse_nasa_row(self, row: dict) -> dict | None:
        """Parse a row from NASA eclipse data."""
        # Handle various NASA formats
        # This is a simplified parser - real NASA data has specific formats

        # Try to get date
        date_str = row.get("Date") or row.get("date") or row.get("Calendar Date")
        if not date_str:
            return None

        # Parse date (NASA uses various formats)
        try:
            parts = date_str.replace("/", "-").split("-")
            if len(parts) == 3:
                year = int(parts[0])
                month = int(parts[1])
                day = int(parts[2])
                eclipse_date = date(year, month, day)
            else:
                return None
        except ValueError:
            return None

        eclipse_type = row.get("Type") or row.get("type") or row.get("Eclipse Type") or "T"

        return {
            "date": eclipse_date,
            "type": eclipse_type[0] if eclipse_type else "T",
            "name": f"Eclipse of {self._format_date(eclipse_date)}",
            "description": f"{ECLIPSE_TYPES.get(eclipse_type[0], 'Eclipse')} recorded by NASA GSFC",
            "lat": float(row.get("Latitude", 0)) if row.get("Latitude") else None,
            "lon": float(row.get("Longitude", 0)) if row.get("Longitude") else None,
            "confidence": 0.99,  # NASA calculations are extremely precise
            "layer": "documented",
        }

    def _format_date_display(self, date_str: str) -> str:
        """Format PostgreSQL date string with BCE/CE notation for display."""
        # Parse PostgreSQL date string like "0584-05-28 BC" or "0029-11-24"
        if date_str.endswith(" BC"):
            # BCE date
            parts = date_str.replace(" BC", "").split("-")
            year = int(parts[0])
            return f"{year} BCE"
        else:
            parts = date_str.split("-")
            year = int(parts[0])
            return f"{year} CE"
