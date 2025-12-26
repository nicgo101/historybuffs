# Public Domain Historical Data Sources: A Technical Reference Guide

**Bottom Line Up Front:** This guide documents **75+ public domain data sources** for historical information covering Western civilization, biblical history, antiquity, and European regions across 10 data categories. **Europeana, Internet Archive, Library of Congress, and the Metropolitan Museum API** emerge as the highest-priority sources, offering robust APIs, clear public domain licensing, and comprehensive coverage. For development teams building ingestion pipelines, approximately **30 sources have production-ready APIs**, while another 20+ support IIIF or OAI-PMH standards enabling standardized access patterns.

---

## 1. Historical books and texts

### Tier 1: Primary Sources (Full API Access)

#### Internet Archive
- **URL:** https://archive.org
- **API Documentation:** https://archive.org/developers/index-apis.html
- **Data Available:** 40+ million texts including books, manuscripts, pamphlets spanning antiquity to present
- **Geographic/Temporal Coverage:** Global; all historical periods; strong Western civilization, Latin, Greek, Hebrew, Arabic texts
- **API Endpoints:**
  - Scraping API: `https://archive.org/services/search/v1/scrape` (cursor-based pagination)
  - Metadata API: `https://archive.org/metadata/{identifier}` (JSON)
  - Advanced Search: `https://archive.org/advancedsearch.php` (Lucene queries, 10K result limit)
  - Open Library API: `https://openlibrary.org/developers/api` (books, authors, ISBNs)
- **Data Formats:** PDF, EPUB, TXT, DJVU, MARC XML, JSON
- **Rate Limits:** ~1 request/second recommended; 429 errors trigger 5-minute IP blocks
- **Licensing:** Public domain items marked "full view"; metadata CC0
- **Quality:** Excellent coverage; OCR quality varies by scan age

#### Perseus Digital Library (Tufts University)
- **URL:** https://www.perseus.tufts.edu
- **API Documentation:** CTS API at `/hopper/CTS`; ATLAS API at `https://atlas.perseus.tufts.edu/library/`
- **Data Available:** 40+ million words Greek, 16+ million words Latin; Homer, Plato, Aristotle, Cicero, Virgil
- **Geographic/Temporal Coverage:** Classical antiquity through Late Antiquity; Greece, Rome
- **API Example:** `http://www.perseus.tufts.edu/hopper/CTS?request=GetPassage&urn=urn:cts:greekLit:tlg0012.tlg001:1.1`
- **Bulk Download:** GitHub repositories (`canonical-greekLit`, `canonical-latinLit`) with TEI-XML
- **Data Formats:** TEI-XML (primary), plain text, MODS/MADS metadata, treebank annotations
- **Licensing:** CC-BY-SA-4.0
- **Quality:** Highest quality classical texts; includes morphological analysis

#### Project Gutenberg
- **URL:** https://www.gutenberg.org
- **API:** No official API; use **Gutendex** (https://gutendex.com/books) - JSON REST API
- **Data Available:** 76,000+ free ebooks; English literature, Western classics, translations
- **Catalog Downloads:** RDF (~100MB) at `/cache/epub/feeds/rdf-files.tar.bz2`; CSV at `/cache/epub/feeds/pg_catalog.csv.gz`
- **Data Formats:** HTML5, EPUB3, EPUB2, Plain Text (UTF-8), Kindle/MOBI
- **Licensing:** Full public domain (US copyright pre-1927)
- **Quality:** Clean, proofread texts; limited non-English content

#### Wikisource
- **URL:** https://wikisource.org (multilingual portal)
- **API:** MediaWiki API: `https://{lang}.wikisource.org/w/api.php`
- **Export Tool:** https://ws-export.wmcloud.org/ (EPUB, MOBI, PDF, RTF, TXT)
- **Data Available:** 6.6+ million articles; Latin (`la.wikisource.org`), Greek, Hebrew, Arabic versions
- **Data Formats:** Wikitext, HTML, MediaWiki XML dumps
- **Licensing:** Public domain or CC-BY-SA (varies by work)

#### HathiTrust Digital Library
- **URL:** https://www.hathitrust.org
- **API Documentation:** https://www.hathitrust.org/data
- **APIs:**
  - Bibliographic API: `https://catalog.hathitrust.org/api/volumes/{brief|full}/{id_type}/{id}` (JSON with MARC-XML)
  - Data API: OAuth 1.0a authenticated; returns page images, OCR text, METS XML
  - OAI-PMH: Metadata harvesting in MARC21/Dublin Core
- **Data Available:** 17+ million volumes; 7+ million public domain
- **Bulk Datasets:** `ht_text_pd_open_access` (814K volumes US); requires research proposal
- **Data Formats:** PDF, EPUB, TXT, ZIP, METS XML, MARC-XML
- **Access:** Bulk via rsync; Google-digitized content requires institutional agreement
- **Licensing:** Public domain content free; Google content has additional restrictions

#### Gallica (Bibliothèque nationale de France)
- **URL:** https://gallica.bnf.fr
- **API Documentation:** https://api.bnf.fr
- **APIs:**
  - SRU Search: `https://gallica.bnf.fr/SRU?version=1.2&operation=searchRetrieve&query=`
  - OAI-PMH: `https://gallica.bnf.fr/oai`
  - IIIF Image/Presentation: `https://gallica.bnf.fr/iiif/ark:/12148/{id}/manifest.json`
  - OCR/ALTO: Per-page access available
- **Data Available:** 10+ million documents; 800+ illuminated medieval manuscripts
- **Special Collections:** Mandragore (manuscripts), Bibliothèques d'Orient (Middle Eastern)
- **Rate Limits:** 1 request per 3 seconds recommended
- **Licensing:** Public domain free for non-commercial; attribution required

### Tier 2: Secondary Sources

#### Google Books API
- **URL:** https://books.google.com
- **API Documentation:** https://developers.google.com/books/docs/v1/using
- **Critical Limitation:** **Metadata only—no full text download via API**
- **Filter for Public Domain:** `filter=free-ebooks`
- **Rate Limits:** 1,000 requests/day free tier
- **Use Case:** Discovery and metadata enrichment only

#### Early English Books Online (EEBO-TCP)
- **URL:** https://quod.lib.umich.edu/e/eebogroup/
- **Note:** Primary images require ProQuest subscription; **60,000 TCP transcriptions freely available** as TEI/SGML XML
- **Coverage:** English printed works 1473-1700

---

## 2. Historical images and photographs

### Tier 1: Primary Sources

#### Wikimedia Commons
- **URL:** https://commons.wikimedia.org/
- **API:** `https://commons.wikimedia.org/w/api.php`
- **Data Available:** 100+ million files; photographs, fine art, engravings, illustrations across all periods
- **Key Endpoints:**
  - `action=query&list=allimages` (list images)
  - `action=query&prop=imageinfo&iiprop=extmetadata` (metadata + license)
  - `action=query&generator=categorymembers` (browse categories)
- **Data Formats:** Original uploads (JPEG, PNG, TIFF, SVG); thumbnailing via `iiurlwidth` parameter
- **Metadata:** IPTC-IIM format; license in `extmetadata→LicenseShortName`
- **Rate Limits:** ~200 requests/second unofficial; **User-Agent header required**
- **Bulk Access:** Data dumps at https://dumps.wikimedia.org/
- **Licensing:** CC0, CC-BY, CC-BY-SA, Public Domain (filterable)

#### Library of Congress Digital Collections
- **URL:** https://www.loc.gov/collections/
- **API Documentation:** https://www.loc.gov/apis/
- **Data Available:** 14+ million items in Prints & Photographs Division
- **Notable Collections:** FSA/OWI (Depression/WWII, 175K+ images), Civil War (Mathew Brady), Abdul Hamid II (Ottoman 1880-1893), Matson Collection (Middle East)
- **API Access:** Append `?fo=json` to any loc.gov URL
- **IIIF:** Image services microservice available
- **Data Formats:** JPEG, TIFF (archival masters 4000+ px), GIF thumbnails
- **Licensing:** "No known copyright restrictions" for most; check `rights_information` field
- **Authentication:** None required

#### Smithsonian Open Access
- **URL:** https://www.si.edu/openaccess
- **API Documentation:** https://api.data.gov/docs/smithsonian/
- **API Endpoint:** `https://api.si.edu/openaccess/api/v1.0/`
- **Data Available:** 4.5+ million CC0 images from 21 museums including Freer/Sackler (Middle Eastern art)
- **Bulk Download:** GitHub repo with 11M+ JSON records; AWS S3 bucket `s3://smithsonian-open-access/`
- **Data Formats:** JSON; images via IDS delivery service
- **API Key:** Required (free via api.data.gov)
- **Licensing:** CC0 (Creative Commons Zero)

#### Flickr Commons
- **URL:** https://www.flickr.com/commons
- **API Documentation:** https://www.flickr.com/services/api/
- **Data Available:** 100+ participating institutions (LOC, British Library, NARA, Smithsonian)
- **Key Endpoints:**
  - `flickr.photos.search` with `is_commons=true`
  - `flickr.photos.getSizes` (size codes: sq, t, s, m, l, o for original)
  - `flickr.commons.getInstitutions`
- **Rate Limits:** 3,600 queries/hour per API key
- **API Key:** Required (free)
- **Licensing:** "No known copyright restrictions" (institution-specific terms)

#### NYPL Digital Collections
- **URL:** https://digitalcollections.nypl.org/
- **API Documentation:** https://api.repo.nypl.org/
- **API Endpoint:** `https://api.repo.nypl.org/api/v2/`
- **Data Available:** 1+ million objects; 310,000+ public domain
- **Key Endpoints:**
  - `/items/search?q={query}&publicDomainOnly=true`
  - `/items/item_details/{uuid}` (full details with image links)
- **Image Sizes:** b (100px) through g (original); `highResLink` for TIFF masters (200MB+)
- **Rate Limits:** 10,000 requests/day per token
- **Authentication:** Token required (free signup)
- **Metadata:** MODS (Library of Congress standard)

### Tier 2: Nice-to-Have

#### Getty Open Content
- **URL:** https://www.getty.edu/projects/open-content-program/
- **Data Available:** 160,000+ CC0 images; Greek/Roman antiquities, illuminated manuscripts
- **API:** **None** - web-based download only
- **Scraping:** Required for bulk access; verify terms of use
- **Quality:** Museum-grade high-resolution images

#### Europeana (Images)
- **URL:** https://www.europeana.eu/
- **API:** Search API with `qf=TYPE:IMAGE&qf=REUSABILITY:open&qf=IMAGE_SIZE:extra_large`
- **Data Available:** 50+ million records from 4,000+ European institutions
- **API Key:** Required (free)
- **Quality:** Variable by provider; use size facets

---

## 3. Old maps and cartographic data

### Tier 1: Primary Sources (IIIF-Compliant)

#### David Rumsey Map Collection
- **URL:** https://www.davidrumsey.com/
- **API Documentation:** https://lunaimaging.atlassian.net/wiki/spaces/V75D/pages/655863/LUNA+API+Documentation
- **Data Available:** 143,000+ maps; 16th-21st century focus on 18th-19th century
- **IIIF Endpoints:**
  - Manifest: `https://www.davidrumsey.com/luna/servlet/iiif/m/RUMSEY~8~1~[id]/manifest`
  - Collection: `https://www.davidrumsey.com/luna/servlet/iiif/collection/s/h5uci2`
- **Data Formats:** MrSid, JP2, GeoTIFF (georeferenced), PNG, JPEG, KML
- **Coverage:** Global including biblical lands, ancient world, medieval Europe
- **Quality:** Excellent; multiple resolution sizes (urlSize0 = highest)

#### Library of Congress Maps Division
- **URL:** https://www.loc.gov/maps/
- **API:** Append `?fo=json` to any URL; IIIF image microservices
- **Data Available:** ~6 million cartographic items (world's largest map library); 14th century to present
- **Notable Collections:** Discovery and Exploration, Armenian Rarities, General Maps
- **Data Formats:** High-resolution JPEG, TIFF, PDF, IIIF tiles
- **Licensing:** Free to use unless stated otherwise

#### Europeana Maps
- **URL:** https://www.europeana.eu/
- **IIIF Portal:** https://iiif.europeana.eu/
- **APIs:**
  - IIIF Manifest: `https://iiif.europeana.eu/presentation/{collection}/{record}/manifest` (no API key needed)
  - Search API: API key required
- **Data Available:** Medieval manuscripts, portolan charts, early modern atlases across Europe
- **Data Model:** Europeana Data Model (EDM); CC0 metadata
- **Quality:** Variable by institution; IIIF v2.1 and v3 support

### Tier 2: Secondary Sources

#### Old Maps Online
- **URL:** https://www.oldmapsonline.org/
- **Data Available:** 500,000+ indexed maps from 50+ institutions
- **API:** **No public API** - aggregator/discovery layer only
- **Use Case:** Find sources, then access contributing institutions directly
- **Georeferencer:** Integration with MapTiler Cloud

#### Harvard Geospatial Library (HGL)
- **URL:** https://library.harvard.edu/libraries/harvard-map-collection
- **Data Available:** 11,000+ geo-enabled datasets; 3,800+ georeferenced paper maps
- **Formats:** GeoTIFF for GIS use
- **Access:** Direct download; IIIF via Harvard Digital Collections
- **Coverage:** 500,000+ flat maps; 16th-century globes, nautical charts

#### British Library Maps (Flickr)
- **URL:** https://www.flickr.com/photos/britishlibrary/
- **Data Available:** King's Topographical Collection (40,000+ maps)
- **API:** Flickr API accessible; new catalog API expected December 2025
- **Note:** Systems recovering from cyber-attack; formal API pending

---

## 4. Weather and climate historical data

### Tier 1: Primary Sources (APIs Available)

#### NOAA National Centers for Environmental Information (NCEI)
- **URL:** https://www.ncei.noaa.gov/
- **API Documentation:** https://www.ncei.noaa.gov/support/access-data-service-api-user-documentation
- **API Endpoint:** `https://www.ncei.noaa.gov/access/services/data/v1`

**Key Datasets:**

| Dataset | Coverage | Temporal | API |
|---------|----------|----------|-----|
| **GHCN-Daily** | 100,000+ stations, 180 countries | 1763-present | Yes |
| **GHCN-Monthly** | Global land surface | 1763-present | Yes |
| **ISD (Integrated Surface)** | 35,000+ stations | 1901-present | FTP/AWS |
| **Paleoclimatology** | Global proxies | Millions of years | Web search |

- **API Parameters:** `dataset`, `stations`, `dataTypes`, `bbox`, `startDate`, `endDate`, `format` (csv, json, netcdf)
- **Rate Limits:** 5 requests/second, 10,000 requests/day per token
- **API Key:** Required (free registration at https://www.ncdc.noaa.gov/cdo-web/token)
- **Licensing:** U.S. Government Work - public domain

#### European Climate Assessment & Dataset (ECA&D)
- **URL:** https://www.ecad.eu/
- **Data Available:** 74,206+ series; temperature, precipitation, pressure, humidity, wind, sunshine, cloud cover
- **Coverage:** 20,181+ stations across Europe and Mediterranean from 65 countries
- **Temporal:** 1901-present (E-OBS gridded); some stations to 19th century
- **Data Formats:** ASCII text (station), NetCDF (E-OBS gridded at 0.25° resolution)
- **API:** No formal REST API; bulk download via web forms
- **Licensing:** ~75% freely downloadable for non-commercial research

### Tier 2: Bulk Download Sources

#### Berkeley Earth
- **URL:** https://berkeleyearth.org/data/
- **Data Available:** Land surface temperature anomalies (Tavg, Tmin, Tmax); land-ocean combined
- **Temporal:** Land 1701-present; Land-Ocean 1850-present
- **Formats:** Text files (global), NetCDF (gridded 1° and 0.25° resolution)
- **Licensing:** Creative Commons; free for research

#### PAGES2k (Paleoclimate)
- **URL:** https://pastglobalchanges.org/
- **NOAA Archive:** https://www.ncei.noaa.gov/access/paleo-search/study/21171
- **Data Available:** 692 temperature-sensitive proxy records (tree rings, ice cores, corals, documentary evidence)
- **Temporal:** 1 CE to present (last 2000 years)
- **Formats:** Excel, LiPD (Linked Paleo Data), text files
- **Licensing:** Open access

#### CRU TS (Climatic Research Unit)
- **URL:** https://data.ceda.ac.uk/
- **Data Available:** High-resolution gridded data (0.5° x 0.5°); temperature, precipitation, cloud cover, vapor pressure
- **Temporal:** 1901-present
- **Formats:** NetCDF, ASCII
- **Access:** Registration required at CEDA

---

## 5. Astronomical historical data

### Tier 1: Primary Sources (APIs Available)

#### NASA Astrophysics Data System (ADS)
- **URL:** https://ui.adsabs.harvard.edu/
- **API Documentation:** https://ui.adsabs.harvard.edu/help/api/
- **API Endpoint:** `https://api.adsabs.harvard.edu/v1/`
- **Data Available:** 15+ million bibliographic records; historical astronomical literature from 1755
- **API Example:**
```bash
curl -X GET "https://api.adsabs.harvard.edu/v1/search/query?q=ancient+astronomy+eclipses&fl=bibcode,title,author,year" \
  -H "Authorization: Bearer YOUR_API_KEY"
```
- **Rate Limits:** 5,000 requests/day for search
- **API Key:** Required (free registration)
- **Python Client:** `ads` package on PyPI

#### VizieR / SIMBAD (CDS Strasbourg)
- **URLs:** https://vizier.cds.unistra.fr/ | https://simbad.u-strasbg.fr/
- **TAP Service:** https://tapvizier.cds.unistra.fr/TAPVizieR/tap/
- **Data Available:** 25,839+ astronomical catalogs; 20+ million objects
- **Historical Catalogs:** Ptolemy's Almagest (V/61), Ulugh Beg (I/98), Tycho, Hipparcos
- **API Example (TAP/ADQL):**
```sql
SELECT * FROM "V/61/ptolemy" WHERE Vmag < 3
```
- **Data Formats:** VOTable, CSV, TSV, FITS, JSON, ASCII
- **Authentication:** Not required
- **Python:** `astroquery` library

#### NASA Eclipse Data (Fred Espenak)
- **URL:** https://eclipse.gsfc.nasa.gov/
- **Alternative:** https://eclipsewise.com/
- **Data Available:** Six Millennium Catalog (-2999 to +3000) for solar and lunar eclipses
- **Coverage:** Global; 5,000+ years of eclipse data
- **API:** **None** - HTML tables and PDF downloads
- **Scraping:** Feasible; well-structured HTML tables
- **Licensing:** NASA public domain
- **Quality:** Gold standard; JPL DE406 ephemeris, sub-arcminute accuracy

### Tier 2: Specialized Sources

#### CDLI (Cuneiform Digital Library Initiative) - Babylonian Astronomy
- **URL:** https://cdli.earth/
- **API Documentation:** https://cdli.mpiwg-berlin.mpg.de/docs/api
- **Data Available:** 368,735+ cuneiform tablets; astronomical diaries (747-61 BCE), eclipse records, MUL.APIN star lists
- **Temporal:** ~3350 BCE to 1st century BCE
- **Data Formats:** JSON, CSV, ATF (ASCII Transliteration), RDF/Turtle, images
- **Licensing:** Open access

#### Historical Supernovae Records
- **Reference:** Stephenson & Green (2002) "Historical Supernovae and their Remnants"
- **Data Available:** 8 confirmed Milky Way supernovae (SN 185, 393, 1006, 1054, 1181, 1572, 1604)
- **Sources:** Chinese, Japanese, Korean, Arab, European records
- **Access:** Via ADS; academic paper tables

---

## 6. Historical accounts and records

### Tier 1: National Archives

#### US National Archives (NARA)
- **URL:** https://catalog.archives.gov/
- **API Documentation:** https://github.com/usnationalarchives/Catalog-API
- **API Base:** `https://catalog.archives.gov/api/v2/`
- **Data Available:** All federal government records; founding documents, census, military
- **Data Formats:** JSON, XML, CSV, PDF export
- **Rate Limits:** 10,000 queries/month default; API key required (email Catalog_API@nara.gov)
- **Licensing:** Public domain (U.S. Government work)

#### UK National Archives
- **URL:** https://discovery.nationalarchives.gov.uk/
- **API Documentation:** https://www.nationalarchives.gov.uk/help/discovery-for-developers-about-the-application-programming-interface-api/
- **API Sandbox:** https://discovery.nationalarchives.gov.uk/API/sandbox/index
- **Data Available:** 37+ million record descriptions; 3,500+ archives; medieval to modern
- **Formats:** XML, JSON
- **Access:** Contact with IP address required; beta service

#### Archives Portal Europe
- **URL:** https://www.archivesportaleurope.net/
- **Data Standards:** EAD (Encoded Archival Description), EAC-CPF, METS
- **Coverage:** 30+ European countries; finding aids, holdings guides
- **APIs:** REST API, OAI-PMH harvesting
- **Licensing:** CC0 metadata

### Tier 2: Specialized Archives

#### Royal Observatory Greenwich
- **URL:** https://cudl.lib.cam.ac.uk/collections/longitude
- **Archive Location:** Cambridge University Library
- **Data Available:** 1675-1980 observatory records; transit observations, Board of Longitude papers, star catalogs
- **Access:** Cambridge Digital Library (digitized portions); in-person for full archive
- **Formats:** Scanned manuscripts (JPEG, PDF)

---

## 7. Newspapers and periodicals

### Tier 1: Primary Sources (Full APIs)

#### Chronicling America (Library of Congress)
- **URL:** https://chroniclingamerica.loc.gov/
- **API Documentation:** https://www.loc.gov/apis/
- **Data Available:** ~140,000 newspaper title records; millions of digitized pages (1756-1963)
- **OCR:** Full-text searchable; ALTO v2.0 XML
- **Data Formats:** TIFF (400 dpi), JPEG2000, PDF, ALTO XML, METS XML
- **Bulk OCR Download:** https://chroniclingamerica.loc.gov/ocr/
- **Rate Limits:** 10 bulk requests per 10 minutes per IP; no API key required
- **Licensing:** Public domain (newspapers >95 years old)

#### Europeana Newspapers
- **URL:** https://www.europeana.eu/
- **APIs:** Search API, Record API, IIIF (Manifest/Image/Fulltext)
- **Data Available:** 28.8 million pages; ~12 million with OCR; 23+ European countries (1618-1996)
- **OCR Quality:** 70-85% accuracy; ALTO XML format
- **Data Formats:** TIFF, JPEG2000, ALTO XML, ENMAP metadata
- **Bulk Download:** Metadata and fulltext sets per provider
- **API Key:** Required (free)

#### Trove (National Library of Australia)
- **URL:** https://trove.nla.gov.au/newspaper/
- **API Documentation:** https://trove.nla.gov.au/about/create-something/using-api
- **API Endpoint:** `https://api.trove.nla.gov.au/v3/`
- **Data Available:** 26.6 million+ newspaper pages (1803-1954 public domain)
- **Special Feature:** Crowd-sourced OCR corrections
- **API Key:** Required (free Trove account)
- **Tools:** GLAM Workbench at https://glam-workbench.net/trove-newspapers/

#### Gallica Newspapers
- **URL:** https://gallica.bnf.fr/
- **Enhanced Search:** RetroNews (https://www.retronews.fr/)
- **APIs:** IIIF, SRU, OAI-PMH, Issues API
- **OCR:** PDF with OCR; indexed if quality ≥50%
- **Rate Limits:** 1 request per 3 seconds

### Tier 2: Regional Sources

#### Delpher (Dutch)
- **URL:** https://www.delpher.nl/
- **Coverage:** Netherlands 1618-1995; 2 million newspapers
- **APIs:** OAI-PMH, SRU (contact kb.nl for access)
- **Note:** Gothic font OCR issues pre-1800; manually re-keyed for 17th century

#### ANNO (Austrian)
- **URL:** https://anno.onb.ac.at/
- **Coverage:** Austria/Habsburg Empire 1704-1935; 4.76 million pages
- **API:** **None** - scraping feasible
- **Languages:** German, Italian, Czech, Hungarian

#### Hemeroteca Digital (Spanish)
- **URL:** https://hemerotecadigital.bne.es/
- **Coverage:** Spain 1772-1933; 2,413+ titles
- **APIs:** OAI-PMH via Hispana aggregator

### Tier 3: Nice-to-Have (Paywalled/Limited)

#### British Newspaper Archive
- **URL:** https://www.britishnewspaperarchive.co.uk/
- **Coverage:** UK 17th century-present; 90+ million pages
- **Access:** **Subscription required** (FindMyPast); 2+ million pages free; free in UK library reading rooms
- **Alternative:** Heritage Made Digital titles (free public domain releases)

#### Google News Archive
- **URL:** https://news.google.com/newspapers
- **Status:** **Discontinued** (no new content since 2011); archive remains accessible
- **Search:** Use `site:news.google.com/newspapers` via Google Search

---

## 8. Archaeological data

### Tier 1: Museum APIs (CC0/Open)

#### Metropolitan Museum of Art
- **URL:** https://www.metmuseum.org/about-the-met/policies-and-documents/open-access
- **API Documentation:** https://metmuseum.github.io/
- **API Endpoint:** `https://collectionapi.metmuseum.org/public/collection/v1/objects/[objectID]`
- **Data Available:** 470,000+ artworks; Egyptian, Greek, Roman, Ancient Near Eastern, Islamic art
- **Bulk Download:** CSV via GitHub repository (updated nightly)
- **Data Formats:** JSON (API), CSV (bulk), high-resolution JPEG images
- **API Key:** **Not required** - completely open
- **Licensing:** CC0 (Creative Commons Zero)

#### British Museum
- **URL:** https://collection.britishmuseum.org
- **SPARQL Endpoint:** `https://collection.britishmuseum.org/resource/sparql`
- **Data Available:** 8 million+ objects; Ancient Near East, Egyptian, Greek/Roman antiquities
- **Data Model:** CIDOC-CRM ontology (semantic web standard)
- **Formats:** JSON, XML, RDF/XML, Turtle, NTriple
- **Licensing:** CC-BY-NC-SA for metadata; separate image licensing

#### Smithsonian Open Access
- **API Documentation:** https://edan.si.edu/openaccess/docs/
- **Data Available:** 5.1 million+ 2D/3D items from 21 museums including Freer/Sackler (Ancient Near East)
- **Bulk Access:** AWS Registry of Open Data; GitHub (11M+ JSON records, weekly updates)
- **API Key:** Required (free via api.data.gov)
- **Licensing:** CC0

#### Louvre Collections
- **URL:** https://collections.louvre.fr/en/
- **JSON Access:** Add `.json` to any entry URL (e.g., `https://collections.louvre.fr/ark:/53355/cl010277627.json`)
- **Data Available:** 500,000+ works; Near Eastern, Egyptian, Greek/Roman, Islamic antiquities
- **Identifiers:** ARK protocol for permanent URIs
- **Export:** CSV available

### Tier 2: Archaeological Databases

#### CDLI (Cuneiform Digital Library Initiative)
- **URL:** https://cdli.earth/
- **API:** REST API with content negotiation; Linked Open Data
- **Data Available:** 368,735+ cuneiform tablet records; transliterations, translations, images
- **Partner Collections:** British Museum, Penn Museum, Yale, Vorderasiatisches Museum

#### Pleiades (Ancient World Gazetteer)

pleiades has frquent updates, always fetch 	pleiades-places-latest.json.gz which is latest file so we can update. mind on update to not overwrite data we might have added to tables. 
https://atlantides.org/downloads/pleiades/json/

- **URL:** https://pleiades.stoa.org/
- **API:** Per-place JSON at `/places/{pid}/json`
- **Data Available:** 41,824 places; 40,844 names; 44,939 locations (Greek and Roman world)
- **Bulk Downloads:** Daily CSV snapshots at http://atlantides.org/downloads/pleiades/dumps
- **Formats:** JSON/GeoJSON, KML, Turtle/RDF+XML
- **Licensing:** CC-BY 3.0
- **Integration:** Core resource for Pelagios network

#### ARIADNE Portal
- **URL:** https://ariadne-infrastructure.eu/portal/
- **Data Available:** 3.8 million+ resources from 40+ European publishers
- **Data Model:** AO-CAT ontology integrated with CIDOC-CRM
- **SPARQL:** Linked Open Data endpoint available

#### Open Context
- **URL:** https://opencontext.org/
- **Data Available:** 132+ published archaeological projects; excavation data, artifact analyses
- **Formats:** JSON-LD, CSV, GeoJSON
- **Features:** Editorial peer review; DOIs for citation
- **Licensing:** Creative Commons (various per project)

### Tier 3: Specialized Collections

#### Penn Museum
- **URL:** https://www.penn.museum/collections/
- **Data Available:** ~30,000 cuneiform tablets; 90,000 Near East artifacts; Royal Cemetery of Ur
- **API:** **No formal public API** - web search interface
- **Access:** Scraping feasible; some data via eBL (electronic Babylonian Library)

#### Griffith Institute (Tutankhamun Archive)
- **URL:** http://www.griffith.ox.ac.uk/
- **Data Available:** Complete Howard Carter excavation records; 15,000+ pages
- **Status:** New searchable database in beta (2025)

---

## 9. Art and artifacts

*Covered extensively in Archaeological Data section above. Additional resources:*

#### Getty Research Portal
- **URL:** https://portal.getty.edu/
- **Data Available:** 86,000+ digitized art history texts (public domain)
- **APIs:** IIIF Presentation/Image; SPARQL for Getty Vocabularies

#### Getty Vocabularies (Essential for Semantic Enrichment)
- **URL:** https://www.getty.edu/research/tools/vocabularies/lod/
- **Vocabularies:**
  - Art & Architecture Thesaurus (AAT)
  - Getty Thesaurus of Geographic Names (TGN)
  - Union List of Artist Names (ULAN)
  - Cultural Objects Name Authority (CONA)
- **API:** SPARQL endpoints; OpenRefine reconciliation service
- **Formats:** RDF (SKOS, OWL), JSON-LD
- **Licensing:** ODC-By 1.0 (Open Data Commons Attribution)

---

## 10. Aggregators and national digital libraries

### Tier 1: Primary Aggregators

#### Europeana
- **URL:** https://www.europeana.eu/
- **API Documentation:** https://pro.europeana.eu/page/apis
- **APIs:**
  - Search API: Full-text metadata search across 50M+ records
  - Record API: Complete EDM metadata (JSON, JSON-LD, RDF/XML)
  - Entity API: LOD entities (people, places, concepts)
  - IIIF APIs: Image and Presentation for 2D objects
  - OAI-PMH: Bulk metadata harvesting
  - SPARQL Endpoint: Semantic web queries
- **Public Domain Filter:** `reusability=open` parameter
- **Rate Limits:** Free API key required
- **Data Model:** Europeana Data Model (EDM); Dublin Core mappings

#### Digital Public Library of America (DPLA)
- **URL:** https://dp.la/
- **API Documentation:** https://pro.dp.la/developers/api-codex
- **API Base:** `https://api.dp.la/v2`
- **Data Available:** 15+ million objects from US libraries, museums, archives
- **Formats:** JSON-LD (native)
- **Bulk Download:** Complete dataset available
- **API Key:** Required (POST to `https://api.dp.la/v2/api_key/YOUR_EMAIL`)

### Tier 2: National Libraries

#### Bayerische Staatsbibliothek (Germany)
- **URL:** https://www.digitale-sammlungen.de/
- **APIs:**
  - IIIF Presentation: `https://api.digitale-sammlungen.de/iiif/presentation/v2/`
  - IIIF Image: `https://api.digitale-sammlungen.de/iiif/image/v2/`
  - OAI-PMH: Bayerisches Digitales Repositorium
  - OCR API: `https://api.digitale-sammlungen.de/ocr/{object_id}/{page_num}`
- **Data Available:** Largest German digital collection; medieval manuscripts, printed books, maps
- **Open Source:** GitHub.com/dbmdz (IIIF server, Mirador plugins)

#### Vatican Apostolic Library (DigiVatLib)
- **URL:** https://digi.vatlib.it/
- **Data Available:** 15,000+ manuscripts online (80,000 total, ~3,000/year digitization)
- **Access:** IIIF-based viewer; no formal data API
- **Content:** Medieval/Humanistic codices, biblical manuscripts, classical texts
- **Timeline:** Full digitization expected ~2041

### Tier 3: Regional Libraries

| Library | URL | API | Coverage |
|---------|-----|-----|----------|
| **Polona** (Poland) | polona.pl | OAI-PMH, unofficial JSON | 3M+ objects; medieval manuscripts |
| **Biblioteca Digital Hispánica** (Spain) | bne.es | OAI-PMH | Spanish 15th-20th c; Latin America |
| **Bundesarchiv** (Germany) | bundesarchiv.de | None (scraping) | German state records; 466K+ photos |

---

## API Summary Matrix

| Source | API Type | Auth | Rate Limit | Bulk | License |
|--------|----------|------|------------|------|---------|
| **Internet Archive** | REST | S3 keys optional | ~1/sec | Discouraged | CC0 metadata |
| **Perseus** | CTS/REST | None | Generous | GitHub | CC-BY-SA |
| **HathiTrust** | REST/OAI | OAuth | Varies | rsync | PD |
| **Europeana** | REST/SPARQL | API key | Varies | OAI-PMH | CC0 metadata |
| **DPLA** | REST | API key | Generous | Yes | Open |
| **Met Museum** | REST | None | Undocumented | CSV/GitHub | CC0 |
| **British Museum** | SPARQL | None | Undocumented | N/A | CC-BY-NC-SA |
| **Smithsonian** | REST | API key | Standard | AWS/GitHub | CC0 |
| **NOAA/CDO** | REST | Token | 10K/day | FTP/AWS | PD |
| **NASA ADS** | REST | Token | 5K/day | N/A | PD abstracts |
| **VizieR/SIMBAD** | TAP/ADQL | None | Generous | Yes | Open |
| **Chronicling America** | REST | None | 10 bulk/10min | OCR dump | PD |
| **Library of Congress** | REST/IIIF | None | Reasonable | OAI-PMH | PD |
| **Pleiades** | REST/JSON | None | None | CSV daily | CC-BY |
| **CDLI** | REST/LOD | None | Unknown | CSV | Open |

---

## Implementation Recommendations

### Phase 1: Foundation (Build First)
1. **Europeana** - Gateway to European cultural heritage; best-in-class API
2. **Internet Archive** - Largest text corpus; multiple access methods
3. **Metropolitan Museum API** - Cleanest museum API; CC0; no auth
4. **Library of Congress** - IIIF compliant; no auth; public domain
5. **NOAA Climate Data Online** - Comprehensive climate API

### Phase 2: Expansion
6. **Perseus Digital Library** - Classical texts (bulk via GitHub)
7. **Chronicling America** - Newspapers with bulk OCR
8. **Pleiades** - Ancient world gazetteer for geographic linking
9. **VizieR/SIMBAD** - Astronomical catalogs via TAP/ADQL
10. **DPLA** - US historical content aggregator

### Phase 3: Specialized
11. **HathiTrust** - Requires research proposal; massive book corpus
12. **British Museum** - SPARQL; CIDOC-CRM ontology
13. **CDLI** - Mesopotamian cuneiform essential
14. **Gallica** - French/medieval content; IIIF
15. **Getty Vocabularies** - Semantic enrichment

### Technical Architecture Notes

**Standard Protocols to Implement:**
- **IIIF** (Image/Presentation/Content Search) - Europeana, LOC, BSB, Gallica, David Rumsey
- **OAI-PMH** - HathiTrust, Archives Portal Europe, BHL
- **SPARQL/TAP** - British Museum, Getty, VizieR, Europeana
- **JSON-LD** - DPLA, Open Context, Smithsonian

**Rate Limiting Strategy:**
- Implement exponential backoff
- Respect `Retry-After` headers
- Cache aggressively; most content is static
- Use bulk downloads for initial ingestion; APIs for incremental updates

**Data Normalization:**
- Use Europeana Data Model (EDM) as target schema
- Integrate Getty Vocabularies for controlled terms
- Link geographic data to Pleiades URIs
- Store timestamps in ISO 8601; astronomical data in Julian Day Numbers

**Python Libraries:**
- `requests` - General API access
- `astroquery` - VizieR, SIMBAD, TAP
- `internetarchive` - Archive.org CLI
- `ads` - NASA ADS queries
- `iiif-prezi` - IIIF manifest parsing

---

## Nice-to-Have Sources (Lower Priority)

- **Google Books API** - Metadata only; no full text
- **British Newspaper Archive** - Paywalled except Heritage Made Digital
- **EEBO** - Subscription for images; TCP transcriptions free
- **Getty Open Content** - No API; scraping required
- **Penn Museum** - No API; valuable Mesopotamian collection
- **Google News Archive** - Discontinued but archived
- **Newspapers.com** - Paywalled commercial service

---

*This reference guide provides the technical foundation for building comprehensive historical data ingestion pipelines. All sources documented are either fully public domain or have clear open licensing terms for research use. API documentation links are current as of December 2025.*