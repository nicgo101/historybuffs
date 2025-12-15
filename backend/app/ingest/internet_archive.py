"""
Internet Archive data ingestor.

Uses the internetarchive Python library to search and catalog historical texts.
https://archive.org/

CATALOG-ONLY MODE:
This ingestor creates sources only - NO factoids.
We use curated searches to find ~300 specific historical texts, not bulk ingestion.

Creates: sources (secondary/tertiary texts)
Does NOT create: factoids, actors, locations
"""

import logging
from typing import Any

from tqdm import tqdm

from .base import BaseIngestor

logger = logging.getLogger(__name__)

# Curated searches for MVP historical content
# These are small, targeted searches - NOT bulk ingestion
MVP_SEARCHES = [
    {
        "query": "creator:(Herodotus) AND mediatype:texts AND language:eng",
        "name": "Herodotus translations",
        "limit": 10,
        "genre": "historiography",
    },
    {
        "query": "creator:(Thucydides) AND mediatype:texts AND language:eng",
        "name": "Thucydides translations",
        "limit": 10,
        "genre": "historiography",
    },
    {
        "query": "creator:(Plutarch) AND mediatype:texts AND language:eng",
        "name": "Plutarch translations",
        "limit": 15,
        "genre": "biography",
    },
    {
        "query": "creator:(Tacitus) AND mediatype:texts AND language:eng",
        "name": "Tacitus translations",
        "limit": 10,
        "genre": "historiography",
    },
    {
        "query": "creator:(Livy) AND mediatype:texts AND language:eng",
        "name": "Livy translations",
        "limit": 10,
        "genre": "historiography",
    },
    {
        "query": "creator:(Polybius) AND mediatype:texts AND language:eng",
        "name": "Polybius translations",
        "limit": 8,
        "genre": "historiography",
    },
    {
        "query": "creator:(Josephus) AND mediatype:texts AND language:eng",
        "name": "Josephus translations",
        "limit": 10,
        "genre": "historiography",
    },
    {
        "query": "creator:(Diodorus) AND mediatype:texts AND language:eng",
        "name": "Diodorus Siculus translations",
        "limit": 8,
        "genre": "historiography",
    },
    {
        "query": "creator:(Pausanias) AND mediatype:texts AND language:eng",
        "name": "Pausanias translations",
        "limit": 5,
        "genre": "geography",
    },
    {
        "query": "creator:(Strabo) AND mediatype:texts AND language:eng",
        "name": "Strabo translations",
        "limit": 5,
        "genre": "geography",
    },
    {
        "query": 'title:("Cambridge Ancient History") AND mediatype:texts',
        "name": "Cambridge Ancient History",
        "limit": 20,
        "genre": "historiography",
        "source_type": "secondary",
    },
    {
        "query": 'title:("Oxford Classical") AND mediatype:texts',
        "name": "Oxford Classical texts",
        "limit": 10,
        "genre": "reference",
        "source_type": "secondary",
    },
]


class InternetArchiveIngestor(BaseIngestor):
    """
    Ingestor for Internet Archive historical texts.

    CATALOG-ONLY: Creates sources only, no factoids.

    Uses curated searches to find ~200-300 specific classical texts.
    Does NOT do bulk ingestion of millions of items.

    Creates:
    - sources (books/texts marked for future extraction)

    Does NOT create:
    - factoids (requires AI extraction)
    - actors (use Perseus for ancient authors)
    - locations
    """

    def __init__(self, data_dir: str = "./data"):
        super().__init__(data_dir)
        self._ia = None

    def get_source_name(self) -> str:
        return "Internet Archive"

    def _get_ia(self):
        """Lazy load internetarchive module."""
        if self._ia is None:
            try:
                import internetarchive as ia
                self._ia = ia
            except ImportError:
                raise ImportError(
                    "internetarchive library not installed. "
                    "Run: pip install internetarchive"
                )
        return self._ia

    async def ingest(
        self,
        searches: list[dict] | None = None,
        limit_per_search: int | None = None,
    ) -> dict[str, Any]:
        """
        Ingest Internet Archive metadata as a source catalog.

        Args:
            searches: Custom search queries. Uses MVP_SEARCHES if not provided.
            limit_per_search: Override limit for each search.

        Returns:
            Ingestion statistics.
        """
        await self.connect()
        ia = self._get_ia()

        try:
            searches = searches or MVP_SEARCHES
            all_items = []

            self.log_progress(f"Running {len(searches)} curated searches...")

            # Collect items from all searches
            for search_config in searches:
                query = search_config["query"]
                name = search_config["name"]
                limit = limit_per_search or search_config.get("limit", 10)

                self.log_progress(f"  Searching: {name} (limit {limit})")

                try:
                    results = ia.search_items(query, max_results=limit)
                    items = list(results)
                    all_items.extend([(item, search_config) for item in items])
                    self.log_progress(f"    Found {len(items)} items")
                except Exception as e:
                    self.log_error(f"Search failed for '{name}'", e)

            self.log_progress(f"Processing {len(all_items)} total items...")

            # Process each item
            for item_data, search_config in tqdm(all_items, desc="Internet Archive"):
                try:
                    await self._process_item(ia, item_data, search_config)
                except Exception as e:
                    identifier = item_data.get("identifier", "unknown")
                    self.log_error(f"Failed to process item {identifier}", e)

            self.log_progress("Ingestion complete!")
            return self.get_stats()

        finally:
            await self.close()

    async def _process_item(
        self,
        ia,
        item_data: dict,
        search_config: dict,
    ) -> None:
        """Process a single Internet Archive item into a source record."""
        identifier = item_data.get("identifier", "")

        if not identifier:
            self.stats["sources_skipped"] += 1
            return

        # Get full item metadata
        try:
            item = ia.get_item(identifier)
            metadata = item.metadata
        except Exception as e:
            self.log_error(f"Failed to get metadata for {identifier}", e)
            return

        title = metadata.get("title", identifier)
        if isinstance(title, list):
            title = title[0]

        creator = metadata.get("creator", "")
        if isinstance(creator, list):
            creator = "; ".join(creator)

        # Parse publication date
        date_str = metadata.get("date", "") or metadata.get("year", "")
        raw_dating = f"Published: {date_str}" if date_str else None

        # Get language
        language = metadata.get("language", "")
        if isinstance(language, list):
            language = language[0]

        # Determine source type
        source_type = search_config.get("source_type", "primary")

        # Determine genre
        genre = search_config.get("genre")

        # Build digital URL
        digital_url = f"https://archive.org/details/{identifier}"

        # Create source record
        await self.create_source(
            title=title,
            source_type=source_type,
            genre=genre,
            raw_dating_evidence=raw_dating,
            original_language=language if language else None,
            digital_url=digital_url,
            external_id=f"ia:{identifier}",
        )


async def search_internet_archive(query: str, limit: int = 10) -> list[dict]:
    """
    Utility function to search Internet Archive without ingesting.

    Useful for testing queries before adding them to MVP_SEARCHES.

    Args:
        query: Search query (uses IA advanced search syntax)
        limit: Maximum number of results

    Returns:
        List of item metadata dictionaries.
    """
    import internetarchive as ia

    results = ia.search_items(query, max_results=limit)
    items = []

    for item_data in results:
        identifier = item_data.get("identifier")
        if identifier:
            item = ia.get_item(identifier)
            items.append({
                "identifier": identifier,
                "title": item.metadata.get("title", ""),
                "creator": item.metadata.get("creator", ""),
                "date": item.metadata.get("date", ""),
                "language": item.metadata.get("language", ""),
                "url": f"https://archive.org/details/{identifier}",
            })

    return items
