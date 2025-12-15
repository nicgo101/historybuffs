"""
Data ingestion module for HistoryBuff.

TIERED APPROACH:
- Tier 1 (Direct mapping): Pleiades → locations, NASA Eclipses → factoids+placements
- Tier 2 (Catalog only): Perseus → sources+actors, Internet Archive → sources
- Tier 3 (Future): AI extraction from source texts → factoids

Each ingestor clearly documents what entity types it creates.
"""

from .base import BaseIngestor
from .pleiades import PleiadesIngestor
from .nasa_eclipse import NASAEclipseIngestor
from .perseus import PerseusIngestor
from .internet_archive import InternetArchiveIngestor

__all__ = [
    "BaseIngestor",
    "PleiadesIngestor",
    "NASAEclipseIngestor",
    "PerseusIngestor",
    "InternetArchiveIngestor",
]
