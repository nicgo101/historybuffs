# MVP Data Source Recommendations

## Selection Criteria for MVP

| Criterion | Weight | Rationale |
|-----------|--------|-----------|
| **CC0/Public Domain** | Critical | No legal friction, can redistribute |
| **REST API** | High | Easy to integrate, no SPARQL complexity |
| **Bulk Download** | High | Faster initial ingestion |
| **Good Documentation** | High | Reduces development time |
| **Rich Metadata** | Medium | Better for knowledge extraction |
| **Relevance to Focus Areas** | High | Near East, Mediterranean, Egypt, Persia |

---

## PHASE 1: Foundation (Week 1-2)

### 1. Books & Texts - Start Here

#### Primary Source: Internet Archive
```
Why: Largest public domain text collection, excellent API, bulk access
API: https://archive.org/advancedsearch.php
Python: pip install internetarchive

Recommended Collections for MVP:
├── American Libraries (millions of pre-1927 books)
├── Getty Research Institute (art/archaeology)
├── Wellcome Library (medical/scientific history)
├── Princeton Theological Seminary (biblical/ancient Near East)
└── Biodiversity Heritage Library (natural history)
```

**Specific Book Recommendations for Foundation:**

| Book | Author | Archive.org ID | Why Essential |
|------|--------|----------------|---------------|
| *History of Egypt* | James Breasted | `historyofegyptfr00breauoft` | Standard Egyptology reference |
| *Ancient Records of Egypt* (5 vols) | James Breasted | `cu31924085360844` | Primary source translations |
| *History of Babylonia and Assyria* | Goodspeed | `historyofbabylon00good` | Mesopotamian foundation |
| *Chaldean Account of Genesis* | George Smith | `chaldeanaccountg00smit` | Cuneiform text translations |
| *Antiquities of the Jews* | Josephus | `josephuscompletew00jose` | Jewish/Roman period |
| *The Geography* | Strabo | `geaborstrab00stragoog` | Ancient world geography |
| *Histories* | Herodotus | `historyherodotu01herogoog` | Persian Wars, Egypt, Near East |
| *Anabasis* | Xenophon | `workswithenglis01xenogoog` | Persian Empire eyewitness |
| *Persian Letters* | Chardin | `travelsinpersia00unkngoog` | 17th c. Persia travel |
| *Nineveh and Its Remains* | Layard | `ninevehanditsre02layagoog` | Assyrian archaeology |
| *The Decline and Fall of the Roman Empire* | Gibbon | `decloofroam01gibb` | Rome, Persia, Byzantium |
| *History of the Conquest of Peru* | Prescott | `historyofconque00prescgoog` | For American history |
| *The Travels of Marco Polo* | Marco Polo | `marcopolo00polouoft` | Asian connections |
| *Records of the Grand Historian* | Sima Qian | Various | Chinese foundation |

**Query to find ancient history books:**
```python
from internetarchive import search_items

# Find pre-1930 books on ancient Near East
query = 'subject:(ancient history) AND subject:(egypt OR persia OR babylon OR assyria) AND date:[1800 TO 1930] AND mediatype:texts'

for item in search_items(query).iter_as_items():
    print(item.identifier, item.metadata.get('title'))
```

#### Secondary Source: Project Gutenberg (via Gutendex)
```
Why: Human-proofread OCR, highest text quality
API: https://gutendex.com/books/
No auth required

Key texts available:
- Herodotus, Histories
- Thucydides, Peloponnesian War  
- Plutarch, Lives
- Josephus, complete works
- Gibbon, Decline and Fall
- Prescott, Conquest of Mexico/Peru
- Many Arabic Nights translations
```

#### Tertiary: Perseus Digital Library
```
Why: Gold-standard Greek/Latin with morphological analysis
Bulk: https://github.com/PerseusDL/canonical-greekLit
      https://github.com/PerseusDL/canonical-latinLit
License: CC BY-SA

Essential texts with original + translation:
- Homer (Iliad, Odyssey)
- Greek historians (Herodotus, Thucydides, Xenophon)
- Greek philosophers (Plato, Aristotle)
- Roman historians (Livy, Tacitus, Suetonius)
- Bible (Greek Septuagint, Latin Vulgate)
```

---

### 2. Maps - Geographic Foundation

#### Primary: Pleiades + Ancient World Mapping Center

**Pleiades (Ancient Places)**
```
Why: Authoritative ancient place gazetteer, CC BY 3.0
Download: http://atlantides.org/downloads/pleiades/dumps/
Format: CSV, JSON, GeoJSON, KML

What you get:
- 41,824 ancient places
- 44,939 locations with coordinates
- Temporal attestations (when place existed)
- Name variants (Greek, Latin, Arabic, etc.)
- Links to Perseus, Wikipedia, Trismegistos

Essential for: Linking extracted place names to coordinates
```

**Sample Pleiades data structure:**
```json
{
  "id": "687928",
  "title": "Jerusalem",
  "description": "An ancient city in the Judean highlands",
  "names": [
    {"romanized": "Hierosolyma", "language": "la"},
    {"romanized": "Yerushalayim", "language": "he"},
    {"romanized": "al-Quds", "language": "ar"}
  ],
  "locations": [{
    "geometry": {"type": "Point", "coordinates": [35.2304, 31.7857]},
    "start": -2000,
    "end": 2100
  }],
  "connectsWith": ["687890", "687895"]
}
```

**Ancient World Mapping Center (AWMC)**
```
Why: GIS shapefiles for ancient world, CC BY-NC 4.0
Download: https://awmc.unc.edu/gis-data/

What you get:
- Roman Empire roads (vector)
- Ancient coastlines (changed over time!)
- Province boundaries by period
- Major settlements
- Terrain basemaps
```

#### Secondary: David Rumsey (for historical map images)
```
Why: 143,000+ georeferenced historical maps
Access: IIIF manifests, some via DPLA
License: CC BY-NC

Useful for:
- Overlaying historical map images on modern maps
- Showing how geographic knowledge evolved
- Period-appropriate visualizations
```

#### Map Tile Services for Visualization
```javascript
// Antiquity-appropriate base maps
const mapLayers = {
  // Modern reference
  cartoDark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  
  // AWMC ancient world tiles (if available)
  awmcBase: 'https://awmc.unc.edu/tiles/map/{z}/{x}/{y}.png',
  
  // Stamen Watercolor (artistic, good for historical feel)
  watercolor: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg',
  
  // Terrain (shows geography Alexander/armies traversed)
  terrain: 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png'
};
```

---

### 3. Astronomical & Eclipse Data

#### Primary: NASA Eclipse Catalog
```
Why: Definitive eclipse predictions -1999 to +3000, public domain
URL: https://eclipse.gsfc.nasa.gov/

Key Resources:
1. Five Millennium Canon of Solar Eclipses
   https://eclipse.gsfc.nasa.gov/SEpubs/5MCSE.html
   
2. Five Millennium Canon of Lunar Eclipses  
   https://eclipse.gsfc.nasa.gov/LEpubs/5MCLE.html

3. Historical Eclipse Database
   https://eclipse.gsfc.nasa.gov/SEsearch/SEsearch.php

Data Format (Solar Eclipses):
- Date (Julian/Gregorian)
- Time (TD)
- Eclipse type (Total, Annular, Partial, Hybrid)
- Geographic coordinates of maximum eclipse
- Path width
- Duration
```

**Why eclipses matter for history:**
- Herodotus: Eclipse of Thales (May 28, 585 BCE) ended Lydian-Median war
- Assyrian Eponym: Eclipse of June 15, 763 BCE (anchors chronology)
- Chinese records: Thousands of eclipse observations
- Biblical: "Sun stood still" debates
- Dating uncertain events by matching to eclipse records

**Download approach:**
```python
import requests
from bs4 import BeautifulSoup
import pandas as pd

# NASA doesn't have a formal API, but tables are scrapable
# Example: Get solar eclipses for a century

def get_eclipses(start_year, end_year):
    """Scrape NASA eclipse catalog for date range"""
    url = f"https://eclipse.gsfc.nasa.gov/SEsearch/SEsearch.php"
    params = {
        'Ession': 'all',
        'Eccession': 'all', 
        'Emagval': 'all',
        'Eyear1': start_year,
        'Eyear2': end_year
    }
    # Would need to parse HTML response
    # Or use pre-compiled catalog files
```

**Pre-compiled eclipse data (easier):**
```
Fred Espenak's catalogs (NASA):
- Solar: https://eclipse.gsfc.nasa.gov/SEcat5/SE-0599--0500.html (etc)
- Lunar: https://eclipse.gsfc.nasa.gov/LEcat5/LE-0599--0500.html

Format per eclipse:
Date | Time | Type | Lat | Long | Path Width | Duration
```

#### Secondary: VizieR Historical Star Catalogs
```
Why: Historical astronomical observations for verification
TAP: http://tapvizier.u-strasbg.fr/TAPVizieR/tap
Python: pip install astroquery

Historical catalogs available:
- Ptolemy's Almagest star catalog (2nd c. CE)
- Tycho Brahe's catalog (1602)
- Flamsteed's catalog (1725)
- Messier objects (1771)

Use case: Verify astronomical events mentioned in texts
```

```python
from astroquery.vizier import Vizier

# Find Ptolemy's Almagest catalog
catalogs = Vizier.find_catalogs('Ptolemy Almagest')

# Query historical star positions
v = Vizier(columns=['*'])
result = v.query_constraints(catalog='V/135A')  # Example catalog
```

#### Tertiary: Calendrical Conversion
```
Why: Convert between calendar systems for dating
Libraries:
- convertdate (Python): Julian, Hebrew, Islamic, Persian
- astronomia: Julian day calculations

Key conversions needed:
- Julian ↔ Gregorian (1582 transition)
- Hebrew calendar (biblical dates)
- Islamic calendar (Hijri)
- Persian calendar (Zoroastrian dates)
- Egyptian calendar
- Babylonian calendar (lunar months)
```

```python
from convertdate import julian, islamic, hebrew

# Example: What's the Julian date for Hijri 1 Muharram 1?
gregorian = islamic.to_gregorian(1, 1, 1)
# Returns: (622, 7, 19) - July 19, 622 CE
```

---

## PHASE 2: Expand Coverage (Week 3-4)

### Museum Collections (for artifacts, images)

| Museum | API | Priority | Key Collections |
|--------|-----|----------|-----------------|
| **Metropolitan Museum** | REST, no auth | ★★★ | Egyptian (Dept 10), Ancient Near East (Dept 3) |
| **Cleveland Museum** | REST, no auth | ★★★ | Egyptian, Near Eastern, Greek/Roman |
| **Smithsonian** | REST, free key | ★★☆ | Freer-Sackler (Persian, Islamic) |
| **British Museum** | SPARQL | ★★☆ | Rosetta Stone, Cyrus Cylinder |

**Met Museum starter query:**
```python
import requests

def get_met_objects(department_id, has_images=True):
    """
    Department IDs:
    3 = Ancient Near Eastern Art
    10 = Egyptian Art
    13 = Greek and Roman Art
    14 = Islamic Art
    """
    base = "https://collectionapi.metmuseum.org/public/collection/v1"
    
    # Get object IDs
    resp = requests.get(f"{base}/objects", params={
        "departmentIds": department_id,
        "hasImages": has_images
    })
    object_ids = resp.json()["objectIDs"][:100]  # First 100
    
    # Get object details
    objects = []
    for oid in object_ids:
        obj = requests.get(f"{base}/objects/{oid}").json()
        objects.append({
            "id": obj["objectID"],
            "title": obj["title"],
            "date": obj.get("objectDate"),
            "period": obj.get("period"),
            "culture": obj.get("culture"),
            "medium": obj.get("medium"),
            "image": obj.get("primaryImage"),
            "wikidata": obj.get("objectWikidata_URL")
        })
    return objects

# Get Egyptian artifacts
egyptian_art = get_met_objects(department_id=10)
```

### Reference/Authority Data

| Source | Priority | Use Case |
|--------|----------|----------|
| **Wikidata** | ★★★ | Entity linking (people, places, events) |
| **Getty TGN** | ★★☆ | Historical place name variants |
| **GeoNames** | ★★☆ | Modern place coordinates |
| **VIAF** | ★☆☆ | Author authority records |

**Wikidata for historical figures:**
```python
from SPARQLWrapper import SPARQLWrapper, JSON

sparql = SPARQLWrapper("https://query.wikidata.org/sparql")
sparql.setReturnFormat(JSON)

# Find all ancient Persian rulers
query = """
SELECT ?person ?personLabel ?birthDate ?deathDate ?image WHERE {
  ?person wdt:P31 wd:Q5 .           # is human
  ?person wdt:P27 wd:Q389688 .      # citizenship: Achaemenid Empire
  OPTIONAL { ?person wdt:P569 ?birthDate }
  OPTIONAL { ?person wdt:P570 ?deathDate }
  OPTIONAL { ?person wdt:P18 ?image }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}
LIMIT 100
"""

sparql.setQuery(query)
results = sparql.query().convert()
```

---

## PHASE 3: Specialized Sources (Week 5+)

### For Near East / Cuneiform
```
CDLI (Cuneiform Digital Library Initiative)
- 500,000+ tablets
- API: https://cdli.mpiwg-berlin.mpg.de/docs/api
- Bulk: Daily dumps on GitHub
- Essential for Mesopotamian content
```

### For Egypt
```
Trismegistos
- 950,000+ text records
- API: REST (some features require subscription)
- Best metadata for Egyptian texts
- Cross-references to papyri.info, CDLI
```

### For Biblical / Religious Texts
```
- Internet Archive: Multiple Bible translations
- Perseus: Greek Septuagint, Latin Vulgate
- SWORD Project: Many translations in structured format
- Dead Sea Scrolls Digital Library (images)
```

### For Asian History
```
Chinese Text Project (ctext.org)
- 30,000+ pre-modern Chinese texts
- API: https://api.ctext.org/
- Requires: CJK text handling

CBETA (Chinese Buddhist texts)
- 200M+ characters
- GitHub bulk download
```

---

## Recommended MVP Data Pipeline

```
INGESTION PIPELINE
==================

1. TEXTS (Internet Archive + Gutenberg)
   │
   ├── Download PDFs/EPUBs → Extract text
   │   └── Use: PyPDF2, ebooklib
   │
   ├── OCR if needed → Tesseract
   │
   └── Chunk by chapter/section
       └── Store in PostgreSQL with metadata

2. CHUNKING + EMBEDDING
   │
   ├── Split into ~500 token chunks
   │   └── Overlap 50 tokens
   │
   ├── Add bilingual context for ancient texts
   │   └── Original language + English translation
   │
   └── Generate embeddings (Cohere/OpenAI)
       └── Store in pgvector

3. KNOWLEDGE EXTRACTION (LLM)
   │
   ├── Extract: Events, People, Places, Dates
   │
   ├── Link to authorities:
   │   ├── Places → Pleiades
   │   ├── People → Wikidata
   │   └── Dates → Verify with eclipse data
   │
   └── Store structured data in PostgreSQL

4. GEOGRAPHIC ENRICHMENT
   │
   ├── Load Pleiades gazetteer
   │
   ├── Match extracted place names
   │   └── Fuzzy match + LLM verification
   │
   └── Add coordinates for visualization

5. VISUALIZATION
   │
   ├── Map: Leaflet + historical tiles
   ├── Timeline: vis.js
   └── Graph: Cytoscape.js
```

---

## Specific File Downloads for MVP

### Immediate Downloads (do this first!)

```bash
# 1. Pleiades gazetteer (ancient places)
wget http://atlantides.org/downloads/pleiades/dumps/pleiades-places-latest.csv.gz
wget http://atlantides.org/downloads/pleiades/dumps/pleiades-names-latest.csv.gz
wget http://atlantides.org/downloads/pleiades/dumps/pleiades-locations-latest.csv.gz

# 2. Getty TGN (historical place names) 
# Download from: https://www.getty.edu/research/tools/vocabularies/obtain/
# Request the N-Triples format

# 3. NASA Eclipse catalogs
# Download PDFs from: https://eclipse.gsfc.nasa.gov/SEpubs/5MCSE.html
# Or scrape the HTML tables

# 4. GeoNames (modern coordinates)
wget https://download.geonames.org/export/dump/allCountries.zip

# 5. Perseus Greek/Latin texts
git clone https://github.com/PerseusDL/canonical-greekLit.git
git clone https://github.com/PerseusDL/canonical-latinLit.git
```

### Internet Archive Books to Download

```python
from internetarchive import download

# Essential ancient history texts
books = [
    "historyofegyptfr00breauoft",      # Breasted's Egypt
    "historyofbabylon00good",           # Goodspeed's Babylon/Assyria
    "geographystrab01stragoog",         # Strabo's Geography
    "historyherodotu01herogoog",        # Herodotus
    "josephuscompletew00jose",          # Josephus
    "ninevehanditsre02layagoog",        # Layard's Nineveh
    "declineandfallof01444gut",         # Gibbon (Gutenberg version)
    "travelsinpersia00unkngoog",        # Chardin's Persia
]

for book_id in books:
    download(book_id, formats=['Text', 'DjVuTXT'])
```

---

## Cost Estimate for MVP Data

| Item | Cost | Notes |
|------|------|-------|
| Book downloads | $0 | Public domain |
| Pleiades/AWMC | $0 | CC BY |
| NASA eclipses | $0 | Public domain |
| Met/Cleveland API | $0 | CC0 |
| Wikidata | $0 | CC0 |
| Embedding (Cohere) | ~$3 | 100 books ≈ 30K chunks |
| Extraction (Claude Haiku) | ~$30-60 | $0.001/chunk |
| **Total** | **~$35-65** | One-time for MVP |

---

## Summary: MVP Priority Stack

```
TIER 1 - START HERE (Week 1)
============================
Texts:     Internet Archive (10-20 foundational books)
Maps:      Pleiades CSV + GeoNames
Astronomy: NASA Eclipse tables (scraped/manual)
Authority: Wikidata (SPARQL queries as needed)

TIER 2 - EXPAND (Week 2-3)
==========================
Texts:     Project Gutenberg + Perseus (Greek/Latin)
Maps:      AWMC shapefiles
Museums:   Met Museum API (Egyptian, Near Eastern depts)
Authority: Getty TGN (place name variants)

TIER 3 - SPECIALIZE (Week 4+)
=============================
Texts:     CDLI (cuneiform), Trismegistos (Egyptian)
Museums:   British Museum SPARQL, Smithsonian
Astronomy: VizieR historical catalogs
Asian:     Chinese Text Project, CBETA
```

This gives you a working knowledge graph with:
- 📚 10-20 foundational texts with extracted events/people/places
- 🗺️ 40,000+ ancient places with coordinates
- 🌑 5,000 years of eclipse data for dating
- 🏛️ 100,000+ museum artifacts with images
- 🔗 Entity linking to Wikidata/Pleiades
