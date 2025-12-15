#!/usr/bin/env python3
"""
Data ingestion CLI for HistoryBuff.

TIERED APPROACH:
- Tier 1 (structured data): pleiades → locations, eclipses → factoids+placements
- Tier 2 (catalog only): perseus → sources+actors, internet-archive → sources

Usage:
    # Tier 1 - Structured data (creates usable entities)
    python scripts/ingest.py pleiades [--limit N]
    python scripts/ingest.py eclipses [--limit N]

    # Tier 2 - Source catalog (metadata only, for future AI extraction)
    python scripts/ingest.py perseus [--limit N]
    python scripts/ingest.py internet-archive

    # Run recommended MVP set
    python scripts/ingest.py mvp
"""

import argparse
import asyncio
import logging
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.ingest import (
    PleiadesIngestor,
    NASAEclipseIngestor,
    PerseusIngestor,
    InternetArchiveIngestor,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def print_banner():
    """Print ingestion banner."""
    print("""
╔═══════════════════════════════════════════════════════════════╗
║              HistoryBuff Data Ingestion                       ║
╠═══════════════════════════════════════════════════════════════╣
║  Tier 1 (Structured):                                         ║
║    pleiades  → locations (ancient places with coordinates)    ║
║    eclipses  → factoids + placements (temporal anchors)       ║
║                                                               ║
║  Tier 2 (Catalog):                                            ║
║    perseus   → sources + actors (classical texts catalog)     ║
║    ia        → sources (Internet Archive texts catalog)       ║
╚═══════════════════════════════════════════════════════════════╝
    """)


async def run_pleiades(args):
    """Run Pleiades gazetteer ingestion → locations."""
    logger.info("═" * 50)
    logger.info("PLEIADES GAZETTEER → locations")
    logger.info("═" * 50)
    ingestor = PleiadesIngestor(data_dir=args.data_dir)
    stats = await ingestor.ingest(limit=args.limit)
    print_stats(stats)
    return stats


async def run_eclipses(args):
    """Run NASA Eclipse ingestion → factoids + placements."""
    logger.info("═" * 50)
    logger.info("NASA ECLIPSES → factoids + placements")
    logger.info("═" * 50)
    ingestor = NASAEclipseIngestor(data_dir=args.data_dir)
    stats = await ingestor.ingest(limit=args.limit)
    print_stats(stats)
    return stats


async def run_perseus(args):
    """Run Perseus Digital Library ingestion → sources + actors."""
    logger.info("═" * 50)
    logger.info("PERSEUS DIGITAL LIBRARY → sources + actors (catalog only)")
    logger.info("═" * 50)
    ingestor = PerseusIngestor(data_dir=args.data_dir)
    stats = await ingestor.ingest(limit=args.limit)
    print_stats(stats)
    return stats


async def run_internet_archive(args):
    """Run Internet Archive ingestion → sources."""
    logger.info("═" * 50)
    logger.info("INTERNET ARCHIVE → sources (catalog only)")
    logger.info("═" * 50)
    ingestor = InternetArchiveIngestor(data_dir=args.data_dir)
    stats = await ingestor.ingest()
    print_stats(stats)
    return stats


async def run_mvp(args):
    """
    Run recommended MVP ingestion set.

    This creates a useful starting dataset:
    - ~35,000 ancient locations from Pleiades
    - ~15 historically significant eclipses as factoids with placements
    - ~30 ancient authors as actors
    - ~100 classical works as sources
    """
    logger.info("═" * 50)
    logger.info("MVP INGESTION SET")
    logger.info("═" * 50)
    logger.info("")
    logger.info("This will ingest:")
    logger.info("  • Pleiades ancient places → locations")
    logger.info("  • Historical eclipses → factoids with temporal placements")
    logger.info("  • Perseus classical texts → sources + ancient authors")
    logger.info("")

    results = {}

    # Tier 1: Structured data
    logger.info("─" * 50)
    logger.info("TIER 1: Structured data")
    logger.info("─" * 50)

    # Pleiades locations
    try:
        results["pleiades"] = await run_pleiades(args)
    except Exception as e:
        logger.error(f"Pleiades ingestion failed: {e}")
        results["pleiades"] = {"error": str(e)}

    # NASA Eclipses
    try:
        results["eclipses"] = await run_eclipses(args)
    except Exception as e:
        logger.error(f"Eclipse ingestion failed: {e}")
        results["eclipses"] = {"error": str(e)}

    # Tier 2: Catalog
    logger.info("─" * 50)
    logger.info("TIER 2: Source catalog")
    logger.info("─" * 50)

    # Perseus (sources + actors)
    try:
        results["perseus"] = await run_perseus(args)
    except Exception as e:
        logger.error(f"Perseus ingestion failed: {e}")
        results["perseus"] = {"error": str(e)}

    # Summary
    logger.info("═" * 50)
    logger.info("MVP INGESTION COMPLETE")
    logger.info("═" * 50)

    total_locations = results.get("pleiades", {}).get("locations_created", 0)
    total_factoids = results.get("eclipses", {}).get("factoids_created", 0)
    total_placements = results.get("eclipses", {}).get("placements_created", 0)
    total_sources = results.get("perseus", {}).get("sources_created", 0)
    total_actors = results.get("perseus", {}).get("actors_created", 0)

    logger.info(f"  Locations created: {total_locations}")
    logger.info(f"  Factoids created:  {total_factoids}")
    logger.info(f"  Placements created: {total_placements}")
    logger.info(f"  Sources created:   {total_sources}")
    logger.info(f"  Actors created:    {total_actors}")

    return results


def print_stats(stats: dict):
    """Print ingestion statistics."""
    logger.info("")
    logger.info("Results:")
    for key, value in stats.items():
        if key not in ("source", "timestamp"):
            logger.info(f"  {key}: {value}")
    logger.info("")


def main():
    parser = argparse.ArgumentParser(
        description="HistoryBuff data ingestion CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Test with small batches
    python scripts/ingest.py pleiades --limit 100
    python scripts/ingest.py eclipses --limit 5
    python scripts/ingest.py perseus --limit 20

    # Full MVP ingestion
    python scripts/ingest.py mvp

    # Individual full runs
    python scripts/ingest.py pleiades      # ~35,000 locations
    python scripts/ingest.py perseus       # ~100 sources, ~30 actors
    python scripts/ingest.py internet-archive  # ~100 sources
        """,
    )

    parser.add_argument(
        "--data-dir",
        default="./data",
        help="Directory containing data files (default: ./data)",
    )

    subparsers = parser.add_subparsers(dest="command", help="Ingestion command")

    # Pleiades
    pleiades_parser = subparsers.add_parser(
        "pleiades",
        help="Ingest Pleiades gazetteer → locations",
    )
    pleiades_parser.add_argument("--limit", type=int, help="Limit locations")

    # Eclipses
    eclipse_parser = subparsers.add_parser(
        "eclipses",
        help="Ingest NASA eclipse data → factoids + placements",
    )
    eclipse_parser.add_argument("--limit", type=int, help="Limit eclipses")

    # Perseus
    perseus_parser = subparsers.add_parser(
        "perseus",
        help="Ingest Perseus texts → sources + actors (catalog only)",
    )
    perseus_parser.add_argument("--limit", type=int, help="Limit works")

    # Internet Archive
    ia_parser = subparsers.add_parser(
        "internet-archive",
        aliases=["ia"],
        help="Ingest Internet Archive → sources (catalog only)",
    )

    # MVP set
    mvp_parser = subparsers.add_parser(
        "mvp",
        help="Run recommended MVP ingestion (pleiades + eclipses + perseus)",
    )
    mvp_parser.add_argument("--limit", type=int, help="Limit per source")

    args = parser.parse_args()

    if not args.command:
        print_banner()
        parser.print_help()
        sys.exit(1)

    # Run the appropriate ingestion
    if args.command == "pleiades":
        asyncio.run(run_pleiades(args))
    elif args.command == "eclipses":
        asyncio.run(run_eclipses(args))
    elif args.command == "perseus":
        asyncio.run(run_perseus(args))
    elif args.command in ("internet-archive", "ia"):
        asyncio.run(run_internet_archive(args))
    elif args.command == "mvp":
        asyncio.run(run_mvp(args))
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
