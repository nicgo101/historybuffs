"""
Perseus Digital Library / canonical-greekLit data ingestor.

Parses TEI XML files from the Perseus canonical Greek/Latin text collections.
https://github.com/PerseusDL/canonical-greekLit

CATALOG-ONLY MODE:
This ingestor creates sources and actors only - NO factoids.
The actual text content requires AI extraction to become factoids.

Creates: sources (primary texts), actors (ancient authors)
Does NOT create: factoids, locations
"""

import json
import logging
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

from tqdm import tqdm

from .base import BaseIngestor

logger = logging.getLogger(__name__)

# TLG author IDs to names and metadata
TLG_AUTHORS = {
    "tlg0001": {"name": "Apollonius Rhodius", "dates": "3rd century BCE", "type": "person"},
    "tlg0003": {"name": "Thucydides", "dates": "c. 460 - c. 400 BCE", "type": "person"},
    "tlg0004": {"name": "Aristophanes", "dates": "c. 446 - c. 386 BCE", "type": "person"},
    "tlg0005": {"name": "Moschus", "dates": "2nd century BCE", "type": "person"},
    "tlg0006": {"name": "Euripides", "dates": "c. 480 - c. 406 BCE", "type": "person"},
    "tlg0007": {"name": "Plutarch", "dates": "c. 46 - c. 119 CE", "type": "person", "biases": "Pro-Greek, moralistic framing"},
    "tlg0008": {"name": "Athenaeus", "dates": "c. 170 - c. 230 CE", "type": "person"},
    "tlg0010": {"name": "Isocrates", "dates": "436 - 338 BCE", "type": "person"},
    "tlg0011": {"name": "Sophocles", "dates": "c. 496 - c. 406 BCE", "type": "person"},
    "tlg0012": {"name": "Homer", "dates": "c. 8th century BCE", "type": "person"},
    "tlg0013": {"name": "Homeric Hymns", "dates": "7th-6th century BCE", "type": "group"},
    "tlg0014": {"name": "Demosthenes", "dates": "384 - 322 BCE", "type": "person"},
    "tlg0016": {"name": "Herodotus", "dates": "c. 484 - c. 425 BCE", "type": "person", "biases": "Pro-Athenian, includes hearsay"},
    "tlg0017": {"name": "Isaeus", "dates": "c. 420 - c. 350 BCE", "type": "person"},
    "tlg0019": {"name": "Aristides, Aelius", "dates": "117 - c. 181 CE", "type": "person"},
    "tlg0020": {"name": "Hesiod", "dates": "c. 700 BCE", "type": "person"},
    "tlg0059": {"name": "Plato", "dates": "c. 428 - c. 348 BCE", "type": "person"},
    "tlg0060": {"name": "Diodorus Siculus", "dates": "c. 90 - c. 30 BCE", "type": "person"},
    "tlg0062": {"name": "Lucian", "dates": "c. 125 - after 180 CE", "type": "person"},
    "tlg0081": {"name": "Aristotle", "dates": "384 - 322 BCE", "type": "person"},
    "tlg0085": {"name": "Aeschylus", "dates": "c. 525 - c. 456 BCE", "type": "person"},
    "tlg0086": {"name": "Aeschines", "dates": "c. 389 - c. 314 BCE", "type": "person"},
    "tlg0093": {"name": "Theophrastus", "dates": "c. 371 - c. 287 BCE", "type": "person"},
    "tlg0099": {"name": "Xenophon", "dates": "c. 430 - 354 BCE", "type": "person", "biases": "Pro-Spartan"},
    "tlg0284": {"name": "Aelius Aristides", "dates": "117 - c. 181 CE", "type": "person"},
    "tlg0525": {"name": "Josephus", "dates": "c. 37 - c. 100 CE", "type": "person", "biases": "Pro-Roman after defection"},
    "tlg0527": {"name": "Septuagint", "dates": "3rd-2nd century BCE", "type": "group"},
    "tlg0540": {"name": "Lysias", "dates": "c. 445 - c. 380 BCE", "type": "person"},
    "tlg0551": {"name": "Appian", "dates": "c. 95 - c. 165 CE", "type": "person"},
    "tlg0561": {"name": "Polybius", "dates": "c. 200 - c. 118 BCE", "type": "person"},
    "tlg1799": {"name": "Pausanias", "dates": "c. 110 - c. 180 CE", "type": "person"},
}

# Genre mapping from work characteristics
GENRE_MAP = {
    "histories": "historiography",
    "history": "historiography",
    "iliad": "epic_poetry",
    "odyssey": "epic_poetry",
    "hymns": "religious_poetry",
    "lives": "biography",
    "moralia": "philosophy",
    "republic": "philosophy",
    "laws": "philosophy",
    "politics": "philosophy",
    "orations": "oratory",
    "speeches": "oratory",
    "antiquities": "historiography",
    "war": "historiography",
    "geography": "geography",
    "description": "geography",
}

# CTS namespace
CTS_NS = {"ti": "http://chs.harvard.edu/xmlns/cts"}


class PerseusIngestor(BaseIngestor):
    """
    Ingestor for Perseus Digital Library Greek texts.

    CATALOG-ONLY: Creates sources and actors, no factoids.

    Creates:
    - actors (ancient authors)
    - sources (primary texts - marked for future AI extraction)

    Does NOT create:
    - factoids (requires AI extraction)
    - locations
    """

    def get_source_name(self) -> str:
        return "Perseus Digital Library"

    async def ingest(self, limit: int | None = None) -> dict[str, Any]:
        """
        Ingest Perseus texts as a source catalog.

        Args:
            limit: Optional limit on number of works to ingest.

        Returns:
            Ingestion statistics.
        """
        await self.connect()

        try:
            # Find the canonical-greekLit directory
            greek_lit_path = Path(self.data_dir) / "canonical-greekLit"
            if not greek_lit_path.exists():
                raise FileNotFoundError(
                    f"canonical-greekLit not found at {greek_lit_path}. "
                    "Clone from https://github.com/PerseusDL/canonical-greekLit"
                )

            data_path = greek_lit_path / "data"

            # Find all author directories
            author_dirs = sorted([d for d in data_path.iterdir() if d.is_dir()])
            self.log_progress(f"Found {len(author_dirs)} author directories")

            works_processed = 0

            for author_dir in tqdm(author_dirs, desc="Perseus Authors"):
                if limit and works_processed >= limit:
                    break

                try:
                    count = await self._process_author(
                        author_dir,
                        limit - works_processed if limit else None,
                    )
                    works_processed += count
                except Exception as e:
                    self.log_error(f"Failed to process author {author_dir.name}", e)

            self.log_progress("Ingestion complete!")
            return self.get_stats()

        finally:
            await self.close()

    async def _process_author(
        self,
        author_dir: Path,
        remaining_limit: int | None,
    ) -> int:
        """Process an author directory and return count of works processed."""
        author_id = author_dir.name  # e.g., "tlg0012"

        # Get author info
        author_info = TLG_AUTHORS.get(author_id, {})
        author_name = self._get_author_name(author_dir / "__cts__.xml", author_id)

        # Create actor for author
        author_actor_id = await self.create_actor(
            name_primary=author_name,
            actor_type=author_info.get("type", "person"),
            raw_temporal_evidence=author_info.get("dates", ""),
            known_biases=author_info.get("biases"),
            external_id=f"tlg:{author_id}",
            description=f"Ancient author. {author_info.get('dates', '')}",
        )

        # Find work directories
        work_dirs = sorted([d for d in author_dir.iterdir() if d.is_dir()])
        works_processed = 0

        for work_dir in work_dirs:
            if remaining_limit and works_processed >= remaining_limit:
                break

            try:
                processed = await self._process_work(
                    work_dir,
                    author_id,
                    author_name,
                    author_actor_id,
                )
                if processed:
                    works_processed += 1
            except Exception as e:
                self.log_error(f"Failed to process work {work_dir.name}", e)

        return works_processed

    async def _process_work(
        self,
        work_dir: Path,
        author_id: str,
        author_name: str,
        author_actor_id: str | None,
    ) -> bool:
        """Process a single work directory. Returns True if work was processed."""
        # Read work CTS metadata
        cts_file = work_dir / "__cts__.xml"
        if not cts_file.exists():
            return False

        work_info = self._parse_work_cts(cts_file)
        if not work_info:
            return False

        work_title = work_info.get("title", work_dir.name)
        work_urn = work_info.get("urn", "")

        # Determine genre
        genre = self._determine_genre(work_title, author_name)

        # Determine original language
        original_lang = work_info.get("lang", "grc")
        if original_lang == "grc":
            original_lang = "Ancient Greek"
        elif original_lang == "lat":
            original_lang = "Latin"

        # Get edition info
        editions = work_info.get("editions", [])
        edition_notes = None
        if editions:
            edition_notes = "; ".join(
                e.get("description", "")[:200] for e in editions if e.get("description")
            )

        # Build period covered from author dates
        author_info = TLG_AUTHORS.get(author_id, {})
        raw_period = author_info.get("dates", "")

        # Create source record
        await self.create_source(
            title=f"{work_title}",
            source_type="primary",
            genre=genre,
            author_id=author_actor_id,
            raw_dating_evidence=raw_period,
            raw_period_covered=f"Written {raw_period}" if raw_period else None,
            original_language=original_lang,
            digital_url=f"https://scaife.perseus.org/reader/urn:cts:greekLit:{author_id}",
        )

        return True

    def _get_author_name(self, cts_file: Path, author_id: str) -> str:
        """Get author name from CTS XML or fallback to TLG lookup."""
        if cts_file.exists():
            try:
                tree = ET.parse(cts_file)
                root = tree.getroot()

                # Try with namespace
                groupname = root.find(".//ti:groupname", CTS_NS)
                if groupname is not None and groupname.text:
                    return groupname.text.strip()

                # Try without namespace
                for elem in root.iter():
                    if elem.tag.endswith("groupname") and elem.text:
                        return elem.text.strip()

            except Exception:
                pass

        # Fallback to TLG lookup
        return TLG_AUTHORS.get(author_id, {}).get("name", author_id)

    def _parse_work_cts(self, cts_file: Path) -> dict | None:
        """Parse work-level CTS XML metadata."""
        try:
            tree = ET.parse(cts_file)
            root = tree.getroot()

            result = {
                "urn": root.get("urn", ""),
                "lang": root.get("{http://www.w3.org/XML/1998/namespace}lang", "grc"),
            }

            # Get title - try various approaches
            title = None

            # Try with namespace
            for title_elem in root.findall(".//ti:title", CTS_NS):
                lang = title_elem.get("{http://www.w3.org/XML/1998/namespace}lang", "")
                if lang == "eng" and title_elem.text:
                    title = title_elem.text.strip()
                    break
                elif title_elem.text and not title:
                    title = title_elem.text.strip()

            # Try without namespace
            if not title:
                for elem in root.iter():
                    if elem.tag.endswith("title") and elem.text:
                        title = elem.text.strip()
                        break

            if title:
                result["title"] = title

            # Get editions/translations info
            editions = []
            for elem in root.iter():
                if elem.tag.endswith(("edition", "translation")):
                    ed_info = {
                        "urn": elem.get("urn", ""),
                        "lang": elem.get("{http://www.w3.org/XML/1998/namespace}lang", ""),
                    }
                    for child in elem:
                        if child.tag.endswith("description") and child.text:
                            ed_info["description"] = child.text.strip()
                    editions.append(ed_info)

            result["editions"] = editions

            return result

        except Exception:
            return None

    def _determine_genre(self, title: str, author: str) -> str | None:
        """Determine genre from title and author."""
        title_lower = title.lower()
        author_lower = author.lower()

        # Check title
        for keyword, genre in GENRE_MAP.items():
            if keyword in title_lower:
                return genre

        # Check author-based defaults
        if "homer" in author_lower:
            return "epic_poetry"
        if any(x in author_lower for x in ["herodotus", "thucydides", "polybius", "diodorus"]):
            return "historiography"
        if any(x in author_lower for x in ["plato", "aristotle"]):
            return "philosophy"
        if any(x in author_lower for x in ["demosthenes", "isocrates", "lysias"]):
            return "oratory"
        if any(x in author_lower for x in ["sophocles", "euripides", "aeschylus"]):
            return "tragedy"
        if "aristophanes" in author_lower:
            return "comedy"
        if "plutarch" in author_lower:
            return "biography"

        return None
