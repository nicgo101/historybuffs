# Public domain historical data sources: A comprehensive API reference guide

**Over 80 public domain historical data sources provide programmatic access to billions of records spanning cuneiform tablets to climate observations.** This guide documents API endpoints, authentication requirements, rate limits, licensing, and practical implementation details for researchers building historical data pipelines. The most accessible sources—Metropolitan Museum of Art, Library of Congress, Wikidata, and CDLI—combine CC0 licensing with well-documented REST APIs and bulk download options. Archaeological and manuscript sources increasingly support IIIF standards, while linked data initiatives enable cross-referencing across collections.

---

## Text archives and digital libraries

These foundational resources provide access to millions of digitized texts, from ancient manuscripts to 20th-century publications.

### Internet Archive

| Field | Details |
|-------|---------|
| **URL** | https://archive.org/ |
| **Content** | Books, audio, video, websites (10M+ books) |
| **APIs** | REST Search API, Metadata API, Wayback Machine API |
| **Endpoints** | `https://archive.org/advancedsearch.php`, `https://archive.org/metadata/{id}` |
| **Auth** | None for read; S3 keys for write |
| **Rate limits** | Informal "be courteous" policy |
| **Formats** | JSON, XML, MARC, Dublin Core |
| **Bulk download** | Yes—wget/rsync mirroring, cursor pagination |
| **License** | CC0 metadata; content varies |
| **Python** | `internetarchive` (official) |

**OCR quality varies significantly** by source collection. Full-text search available via API. The Scraping API limits sorted results to **10,000 items**—use cursor pagination for larger datasets.

### Digital Public Library of America (DPLA)

| Field | Details |
|-------|---------|
| **URL** | https://dp.la/ |
| **Content** | Aggregated US cultural heritage (40M+ items) |
| **API** | REST v2 |
| **Endpoints** | `https://api.dp.la/v2/items?q={query}&api_key={key}` |
| **Auth** | Free API key (POST email to `/v2/api_key/`) |
| **Rate limits** | No explicit throttling |
| **Formats** | JSON-LD (Europeana Data Model compatible) |
| **Bulk download** | https://pro.dp.la/developers/bulk-download |
| **License** | CC0 metadata; item rights vary |
| **Python** | `dpla` |

Supports faceted search, geo-search, and date range filtering. Links to provider images rather than hosting directly.

### Europeana

| Field | Details |
|-------|---------|
| **URL** | https://www.europeana.eu/ |
| **Content** | European cultural heritage (32M+ records) |
| **APIs** | Search API, Record API, IIIF, SPARQL, OAI-PMH |
| **Endpoints** | `https://api.europeana.eu/record/v2/search.json` |
| **Auth** | Free API key at https://pro.europeana.eu/page/get-api |
| **Rate limits** | No throttling; courtesy requested |
| **Formats** | JSON, JSON-LD, RDF, XML |
| **Bulk download** | OAI-PMH harvesting, LOD downloads |
| **License** | CC0 metadata |
| **Python** | `pyeuropeana` |

SPARQL endpoint available without API key. Cursor-based pagination supports queries beyond **1,000 results**.

### Library of Congress

| Field | Details |
|-------|---------|
| **URL** | https://www.loc.gov/ |
| **Content** | Books, newspapers, photos, maps, manuscripts (170M+ items) |
| **APIs** | JSON/YAML API, Chronicling America, IIIF, Congress.gov |
| **Endpoints** | `https://www.loc.gov/search/?fo=json&q={query}` |
| **Auth** | None for public data |
| **Rate limits** | Rate limiting applies; not specified |
| **Formats** | JSON, YAML, MARC XML, IIIF |
| **Bulk download** | MARC records, Chronicling America bulk data |
| **License** | Most public domain |
| **Python** | Jupyter notebooks at https://github.com/LibraryOfCongress/data-exploration |

**World Digital Library** content now accessible via loc.gov API: `https://www.loc.gov/collections/world-digital-library/?fo=json`

### HathiTrust

| Field | Details |
|-------|---------|
| **URL** | https://www.hathitrust.org/ |
| **Content** | Digitized books and journals (18M+ volumes) |
| **APIs** | Bibliographic API, Data API, OAI-PMH |
| **Auth** | OAuth 1.0a for restricted content |
| **Formats** | JSON, MARC-XML, Dublin Core, TSV |
| **Bulk download** | Hathifiles (metadata), HTRC datasets |
| **License** | CC0 metadata; content varies by copyright |
| **Python** | `hathitrust-api` |

**Many items restricted by copyright.** HathiTrust Research Center provides extracted features and word frequency datasets for computational research.

### Open Library

| Field | Details |
|-------|---------|
| **URL** | https://openlibrary.org/ |
| **Content** | Book catalog (50M+ records), 3M+ readable books |
| **APIs** | Books API, Search API, Covers API, Read API |
| **Endpoints** | `https://openlibrary.org/search.json?q={query}` |
| **Auth** | None for read |
| **Formats** | JSON, YAML, RDF/XML |
| **Bulk download** | Monthly data dumps |
| **License** | CC0 metadata |

Include `User-Agent` header for frequent requests to avoid blocking.

### Perseus Digital Library

| Field | Details |
|-------|---------|
| **URL** | https://www.perseus.tufts.edu/, https://scaife.perseus.org/ |
| **Content** | Greek (~8M words), Latin (~5.5M words) classical texts |
| **APIs** | CTS/CapiTainS |
| **Formats** | TEI-XML with morphological analysis |
| **Bulk download** | GitHub—Open Greek and Latin repositories |
| **License** | CC BY-SA |

Texts richly encoded with lemmatization. **Scaife Viewer** provides modern interface to legacy Perseus content.

### Project Gutenberg

| Field | Details |
|-------|---------|
| **URL** | https://www.gutenberg.org/ |
| **Content** | 70,000+ public domain ebooks |
| **APIs** | No official API; use Gutendex: https://gutendex.com/ |
| **Formats** | HTML, EPUB, plain text, Kindle |
| **Bulk download** | Robot harvesting, nightly RDF catalog |
| **License** | US public domain |
| **Python** | `Gutenberg`, `py-gutenberg` |

**High OCR quality**—human-proofread texts. Self-host Gutendex for heavy use.

### Gallica (BnF)

| Field | Details |
|-------|---------|
| **URL** | https://gallica.bnf.fr/ |
| **Content** | French heritage—books, manuscripts, maps, newspapers (10M+ documents) |
| **APIs** | IIIF Image API, SRU Search, Document API |
| **Endpoints** | `https://gallica.bnf.fr/iiif/ark:/12148/{ID}/manifest.json` |
| **Auth** | None |
| **Rate limits** | ~1 request per 3 seconds |
| **Formats** | JSON (IIIF), XML (SRU), ALTO OCR |
| **License** | Public domain materials freely reusable |
| **Python** | `gallipy` |

OCR text available in ALTO XML format. Full-text indexed if OCR score ≥50.

---

## Manuscript and medieval sources

Medieval manuscript collections have largely standardized on **IIIF** for image delivery, enabling interoperability across institutions.

### British Library Digitised Manuscripts

| Field | Details |
|-------|---------|
| **URL** | https://www.bl.uk/manuscripts/ |
| **Content** | Medieval/early modern manuscripts, illuminated manuscripts |
| **APIs** | IIIF Image API 2.0, IIIF Presentation API |
| **Endpoints** | `https://api.bl.uk/metadata/iiif/ark:/81055/{ark-id}/manifest.json` |
| **Auth** | None |
| **Formats** | JSON-LD (IIIF) |
| **Bulk download** | Via IIIF; 5M+ images accessible |
| **License** | Public Domain Mark for pre-1200 materials |

**Significant Greek, Hebrew, Arabic, Persian collections.** Founding IIIF Consortium member since 2011.

### Digital Vatican Library

| Field | Details |
|-------|---------|
| **URL** | https://digi.vatlib.it/ |
| **Content** | 80,000+ manuscripts—Middle Ages, Humanistic period |
| **APIs** | IIIF Image API 3.0, IIIF Presentation API |
| **Endpoints** | `https://digi.vatlib.it/iiif/[shelfmark]/manifest.json` |
| **Auth** | None |
| **License** | Free viewing; commercial use requires permission |

**Extensive Greek, Arabic, Coptic, Ethiopian, Syriac manuscripts.** Semantic search translates modern queries to catalog Latin.

### e-codices (Switzerland)

| Field | Details |
|-------|---------|
| **URL** | https://www.e-codices.unifr.ch/ |
| **Content** | 3,000+ manuscripts from Swiss libraries |
| **APIs** | IIIF Image API 2.1, OAI-PMH |
| **Formats** | JSON-LD, XML (TEI-P5), Dublin Core |
| **Bulk download** | OAI-PMH harvesting; opendata.swiss |
| **License** | CC-BY-NC |

**6th–21st century coverage.** Scholarly TEI-P5 encoded descriptions.

### Cambridge Digital Library

| Field | Details |
|-------|---------|
| **URL** | https://cudl.lib.cam.ac.uk/ |
| **Content** | Newton papers, Darwin manuscripts, medieval manuscripts |
| **APIs** | IIIF (dynamically generated manifests) |
| **Endpoints** | `https://cudl.lib.cam.ac.uk/iiif/[MS-ID]` |
| **Formats** | METS, MODS, TEI, JSON-LD |
| **License** | CC BY-NC 3.0 images; CC BY-NC-ND 3.0 metadata |

Open source platform available at https://github.com/cambridge-collection

### Hill Museum & Manuscript Library (HMML)

| Field | Details |
|-------|---------|
| **URL** | https://www.vhmml.org/ |
| **Content** | 300,000+ manuscripts—world's largest photograph archive |
| **Auth** | Free registration required |
| **License** | Images restricted per partner agreements |

**Exceptional Syriac, Arabic, Ethiopian, Armenian collections.** Essential for Near Eastern manuscript research despite lack of public API.

---

## Archaeological and ancient world data

These sources are **critical for Near East, Mediterranean, Egyptian, and Persian research**.

### CDLI (Cuneiform Digital Library Initiative)

| Field | Details |
|-------|---------|
| **URL** | https://cdli.earth/ |
| **Content** | 500,000+ cuneiform tablets (3350 BCE–end of pre-Christian era) |
| **APIs** | REST API, Linked Data (RDF), CTS server |
| **Endpoints** | `GET /artifacts/*`, `GET /inscriptions/*` |
| **Documentation** | https://cdli.mpiwg-berlin.mpg.de/docs/api |
| **Auth** | None |
| **Formats** | JSON, JSON-LD, CSV, XML, ATF, CoNLL-RDF |
| **Bulk download** | Daily dumps; GitHub data repository |
| **License** | CC BY-SA |
| **Coverage** | Mesopotamia, Syria, Iran, Anatolia |

**PRIMARY SOURCE for cuneiform studies.** ATF (ASCII Transliteration Format) standard for transliterations. High-resolution tablet photographs available.

### Pleiades (Ancient Places Gazetteer)

| Field | Details |
|-------|---------|
| **URL** | https://pleiades.stoa.org/ |
| **Content** | 41,824+ ancient places, 44,939 locations |
| **APIs** | REST, Linked Data, OpenRefine Reconciliation |
| **Endpoints** | `https://pleiades.stoa.org/places/{id}/json` |
| **Formats** | JSON, GeoJSON, KML, RDF (Turtle, RDF/XML), CSV |
| **Bulk download** | Daily tabular snapshots at http://atlantides.org/downloads/pleiades/ |
| **License** | CC BY 3.0 |
| **Python** | https://github.com/vedph/pleiades-api |

**Derived from Barrington Atlas.** Excellent Greek/Roman Mediterranean coverage; expanding to Near East, Egypt, Persia.

### Papyri.info

| Field | Details |
|-------|---------|
| **URL** | https://papyri.info/ |
| **Content** | Greek documentary papyri—DDbDP, HGV, APIS integrated |
| **APIs** | Linked Data/RDF, SPARQL |
| **Endpoints** | `http://papyri.info/{collection}/{id}/turtle` |
| **Formats** | EpiDoc XML, RDF, JSON |
| **Bulk download** | https://github.com/papyri/idp.data |
| **License** | Open access |
| **Coverage** | Greco-Roman Egypt (4th c. BCE–8th c. CE) |

**Primary source for Egyptian papyrology.** EpiDoc standard XML encoding with DCLP (literary papyri) integration.

### Trismegistos

| Field | Details |
|-------|---------|
| **URL** | https://www.trismegistos.org/ |
| **Content** | Metadata portal—952,243+ texts, places, people |
| **APIs** | REST (TexRelations, GeoRelations), RDF |
| **Endpoints** | `https://www.trismegistos.org/dataservices/texrelations/{id}` |
| **Formats** | JSON, XML, CSV, RDF, GeoJSON |
| **Bulk download** | Geo table dumps at /dataservices/tabledump/ |
| **License** | CC BY-SA 4.0 |

**Exceptional for Egypt** (800 BCE–800 CE), expanding globally. Cross-references **79+ partner projects**. Subscription model since 2020 for full functionality.

### Open Context

| Field | Details |
|-------|---------|
| **URL** | https://opencontext.org/ |
| **Content** | Peer-reviewed archaeological field data |
| **APIs** | REST, JSON-LD, GeoJSON |
| **Endpoints** | `https://opencontext.org/subjects-search/.json?{params}` |
| **Documentation** | https://opencontext.org/about/services |
| **Formats** | JSON-LD, GeoJSON, CSV, KML |
| **Bulk download** | CSV from project pages; GIS exports |
| **License** | Creative Commons (varies) |
| **Python** | https://github.com/ekansa/open-context-jupyter |

**Major Near Eastern projects** including Çatalhöyük, Kenan Tepe. DOI assignment for data publication.

### Portable Antiquities Scheme (UK)

| Field | Details |
|-------|---------|
| **URL** | https://finds.org.uk/database/ |
| **Content** | 1.6M+ archaeological objects found in England/Wales |
| **APIs** | REST with JSON output |
| **Endpoints** | `https://finds.org.uk/database/search/results/{params}/format/json` |
| **Formats** | JSON, CSV |
| **License** | CC BY 3.0 for images |

Roman-period connections to Mediterranean. Open source at https://github.com/findsorguk/findsorguk

---

## Museum collections with open APIs

Museum APIs provide access to **ancient Near Eastern, Egyptian, Greek, Roman, and Persian collections**.

### Metropolitan Museum of Art

| Field | Details |
|-------|---------|
| **URL** | https://www.metmuseum.org/ |
| **Content** | 470,000+ artworks spanning 5,000 years |
| **API** | REST |
| **Endpoints** | `https://collectionapi.metmuseum.org/public/collection/v1/objects/{id}` |
| **Documentation** | https://metmuseum.github.io/ |
| **Auth** | None |
| **Rate limits** | **80 requests/second** |
| **Formats** | JSON |
| **Bulk download** | CSV on GitHub (no image URLs) |
| **License** | **CC0** |

**Excellent coverage:** Department 10 (Egyptian Art), Department 3 (Ancient Near Eastern Art), Department 13 (Greek and Roman), Department 14 (Islamic Art). Includes artist ULAN and Wikidata URLs.

### British Museum

| Field | Details |
|-------|---------|
| **URL** | https://collection.britishmuseum.org/sparql |
| **Content** | 3M+ objects; 800,000+ with images |
| **API** | SPARQL (CIDOC-CRM ontology) |
| **Endpoints** | `https://collection.britishmuseum.org/sparql.json?query=` |
| **Formats** | RDF/XML, Turtle, JSON, XML |
| **License** | Academic/non-commercial encouraged |

**World-class Ancient Near East, Egyptian, Greek/Roman, Persian collections** including Rosetta Stone and Cyrus Cylinder. SPARQL knowledge required.

### Smithsonian Open Access

| Field | Details |
|-------|---------|
| **URL** | https://www.si.edu/openaccess |
| **Content** | 11M+ metadata records; 5.1M digital items |
| **API** | REST via api.data.gov |
| **Endpoints** | `https://api.si.edu/openaccess/api/v1.0/search` |
| **Auth** | Free API key at api.data.gov |
| **Rate limits** | 1,000/hour typical |
| **Formats** | JSON, line-delimited JSON (bulk) |
| **Bulk download** | GitHub repository; AWS Open Data Registry |
| **License** | **CC0** for designated assets |

**Freer-Sackler Gallery** has strong Ancient Near East, Persian, Egyptian holdings. 3D models available for some artifacts.

### Rijksmuseum

| Field | Details |
|-------|---------|
| **URL** | https://data.rijksmuseum.nl/ |
| **Content** | 800,000+ objects |
| **APIs** | REST (legacy), OAI-PMH, LDES, IIIF |
| **Auth** | Free API key via Rijksstudio |
| **Formats** | JSON, XML (EDM), Linked Art |
| **Bulk download** | Complete collection download |
| **License** | **CC0** images; CC-BY metadata |

FAIR principles compliant. Dutch art focus with some classical antiquities.

### Art Institute of Chicago

| Field | Details |
|-------|---------|
| **URL** | https://api.artic.edu/docs/ |
| **Content** | 116,000+ artworks |
| **APIs** | REST, IIIF Image/Presentation |
| **Endpoints** | `https://api.artic.edu/api/v1/artworks/search` |
| **Auth** | None; 60 requests/minute |
| **Formats** | JSON, IIIF manifests |
| **Bulk download** | **Nightly dumps** at https://artic-api-data.s3.amazonaws.com/ |
| **License** | CC0 data; CC-BY 4.0 descriptions |

Ancient Mediterranean and Egyptian collections. Elasticsearch-powered search.

### Cleveland Museum of Art

| Field | Details |
|-------|---------|
| **URL** | https://openaccess-api.clevelandart.org/ |
| **Content** | 64,000+ artworks; 37,000+ with images |
| **API** | REST |
| **Auth** | **None—fully open** |
| **Formats** | JSON, CSV |
| **Bulk download** | GitHub with JSON/CSV |
| **License** | **CC0** |
| **Python** | **Official package:** `openaccess_cma` |

Good Egyptian, Near Eastern, Greek/Roman collections. **Best Python support** among museum APIs.

### Harvard Art Museums

| Field | Details |
|-------|---------|
| **URL** | https://harvardartmuseums.org/collections/api |
| **Content** | 224,000+ records |
| **API** | REST, IIIF |
| **Auth** | API key required (email request) |
| **Rate limits** | **2,500 requests/day** |
| **License** | **Non-commercial only** |

Arthur M. Sackler Museum has strong Ancient Near East, Islamic, Asian holdings. Restrictive terms limit commercial use.

### Louvre Collections

| Field | Details |
|-------|---------|
| **URL** | https://collections.louvre.fr/ |
| **Content** | 500,000+ works |
| **API** | JSON access by appending `.json` to URLs |
| **Formats** | JSON, CSV (search export) |
| **License** | Louvre Terms of Use |

**World-class Egyptian, Near Eastern, Greek/Roman, Islamic departments.** Code of Hammurabi collection. No formal API—requires URL manipulation.

---

## Maps and geographic data

### Library of Congress Maps

| Field | Details |
|-------|---------|
| **URL** | https://www.loc.gov/maps/ |
| **API** | loc.gov JSON API, IIIF |
| **Endpoints** | `https://www.loc.gov/collections/{collection}/?fo=json` |
| **Formats** | JSON, YAML, XML |
| **Bulk download** | Sitemaps; batch downloads |
| **License** | Public domain |

Sanborn Fire Insurance Maps, Civil War maps, Revolutionary Era collections.

### David Rumsey Map Collection

| Field | Details |
|-------|---------|
| **URL** | https://www.davidrumsey.com/ |
| **Content** | 143,000+ historical maps (16th–21st century) |
| **APIs** | IIIF, DPLA |
| **License** | CC-BY-NC |
| **Python** | Allmaps scripts: https://github.com/allmaps/rumsey-scripts |

MapKurator OCR for text on maps. Georeferenced metadata at https://github.com/machines-reading-maps

### Pelagios/Recogito

| Field | Details |
|-------|---------|
| **URL** | https://pelagios.org/ |
| **Content** | Linked Open Data for ancient world geography |
| **APIs** | Peripleo API, Gazetteers, IIIF integration |
| **Formats** | JSON-LD, RDF, GeoJSON |
| **License** | CC-BY |
| **Coverage** | Ancient Mediterranean, 3000 BCE–1500 CE |

**De facto standard** for ancient world Linked Open Geodata. Roman Empire vector map tiles available.

### Ancient World Mapping Center

| Field | Details |
|-------|---------|
| **URL** | https://awmc.unc.edu/ |
| **Content** | GIS data for ancient Mediterranean |
| **Formats** | Shapefile, GeoJSON, GeoDatabase, KML |
| **Bulk download** | https://awmc.unc.edu/gis-data/ |
| **License** | CC-BY-NC 4.0 |

**Successor to Barrington Atlas.** 34,000+ ancient places. Partners with Pleiades and Pelagios.

---

## Newspapers and periodicals

### Chronicling America (LOC)

| Field | Details |
|-------|---------|
| **URL** | https://chroniclingamerica.loc.gov/ |
| **Content** | Historic American newspapers (1756–1963), 22M+ pages |
| **APIs** | loc.gov JSON API (primary); legacy API deprecated August 2025 |
| **Endpoints** | `https://www.loc.gov/collections/chronicling-america/?fo=json` |
| **Formats** | JSON, XML, PDF, JPEG, ALTO XML (OCR) |
| **Bulk download** | https://chroniclingamerica.loc.gov/ocr/ |
| **License** | **Public domain** |
| **Python** | `chroniclingamerica.py` |

Full-text search via API. OCR quality variable—no crowdsourced corrections.

### Trove (Australia)

| Field | Details |
|-------|---------|
| **URL** | https://trove.nla.gov.au/ |
| **Content** | Australian newspapers, books, images (25M+ pages) |
| **API** | REST v3 (v2 discontinued September 2024) |
| **Endpoints** | `https://api.trove.nla.gov.au/v3/result?q={query}&category=newspaper` |
| **Auth** | Free API key |
| **Formats** | JSON, XML |
| **Bulk download** | `bulkHarvest=true` parameter |
| **License** | Pre-1954 public domain |
| **Python** | `trove-newspaper-harvester`, GLAM Workbench |

**Good OCR with 1M+ crowdsourced corrections.** Pre-1954 newspapers in public domain.

### Papers Past (New Zealand)

| Field | Details |
|-------|---------|
| **URL** | https://paperspast.natlib.govt.nz/ |
| **API** | Via DigitalNZ API v3 |
| **Endpoints** | `http://api.digitalnz.org/v3/records.json?text={query}&and[collection][]=Papers+Past` |
| **Auth** | DigitalNZ API key |
| **Bulk download** | METS/ALTO XML downloads |
| **License** | Most pre-1900 out of copyright |
| **Python** | `pydnz` |

---

## Historical climate and scientific data

### NOAA NCEI

| Field | Details |
|-------|---------|
| **URL** | https://www.ncei.noaa.gov/ |
| **Content** | Historical climate data (1763–present) |
| **APIs** | Data Service API v1, Search API, OGC Web Services |
| **Endpoints** | `https://www.ncei.noaa.gov/access/services/data/v1` |
| **Documentation** | https://www.ncei.noaa.gov/support/access-data-service-api-user-documentation |
| **Auth** | Free API token |
| **Rate limits** | **5 requests/second, 10,000/day** |
| **Formats** | CSV, JSON, PDF, NetCDF |
| **Bulk download** | FTP and data service |
| **License** | **Public domain** (US Government) |
| **Python** | https://github.com/partytax/ncei-api-guide |

Global Historical Climatology Network (GHCNd), daily/monthly/annual summaries.

### Berkeley Earth

| Field | Details |
|-------|---------|
| **URL** | https://berkeleyearth.org/data/ |
| **Content** | Land and ocean temperature analysis (1750–present) |
| **Formats** | Text, CSV, NetCDF |
| **Bulk download** | Full datasets freely available |
| **License** | CC-BY-NC 4.0 |

Uses 40,000+ temperature stations. Alternative to NOAA/NASA/HadCRUT.

### NASA GISTEMP

| Field | Details |
|-------|---------|
| **URL** | https://data.giss.nasa.gov/gistemp/ |
| **Content** | Global surface temperature analysis (1880–present) |
| **Formats** | CSV, TXT, binary |
| **Bulk download** | All data freely accessible |
| **License** | **Public domain** |

Updated monthly (~10th). Third-party API at https://datahub.io/core/global-temp

---

## Asian history sources

### Chinese Text Project

| Field | Details |
|-------|---------|
| **URL** | https://ctext.org |
| **Content** | 30,000+ pre-modern Chinese texts (5B+ characters) |
| **APIs** | REST/JSON, OAI-PMH, SPARQL |
| **Endpoints** | `https://api.ctext.org/gettext?urn={URN}` |
| **Documentation** | https://ctext.org/tools/api |
| **Auth** | Optional (tiered access) |
| **Formats** | JSON, XML, RDF |
| **Bulk download** | Institutional subscribers |
| **License** | Open access; copyright notice for derived works |
| **Python** | `ctext` (PyPI) |

**Excellent CJK support** including Extensions A-D, rare characters. High-quality human-verified transcriptions.

### CBETA (Chinese Buddhist Electronic Text Association)

| Field | Details |
|-------|---------|
| **URL** | https://www.cbeta.org/ |
| **Content** | 200M+ characters of Chinese Buddhist scriptures |
| **APIs** | REST, SHINE API |
| **Endpoints** | `http://cbdata.dila.edu.tw/v1.2/` |
| **Formats** | JSON, XML (TEI P5) |
| **Bulk download** | GitHub repositories, DVD distribution |
| **License** | CC BY-NC-SA 2.5 TW |
| **Python** | cltk (Classical Language Toolkit) |

Taishō Tripiṭaka, Shinsan Zokuzōkyō. Quarterly updates.

### Kanseki Repository

| Field | Details |
|-------|---------|
| **URL** | https://www.kanripo.org |
| **Content** | 9,000+ pre-modern Chinese texts |
| **API** | REST |
| **Endpoints** | `https://www.kanripo.org/api/v1.0/search?query={term}` |
| **Formats** | JSON, Plain text, Mandoku, TEI XML |
| **Bulk download** | All texts on GitHub: https://github.com/kanripo |
| **License** | Open/various |
| **Python** | `pykanripo` |

GitHub-native distribution. Literary Chinese (ISO 639-3: lzh) primary language.

### National Diet Library (Japan)

| Field | Details |
|-------|---------|
| **URL** | https://www.ndl.go.jp/ |
| **Content** | Japanese publications (legal deposit since 1948) |
| **APIs** | OAI-PMH, SRU, OpenSearch, IIIF |
| **Endpoints** | `https://ndlsearch.ndl.go.jp/api/oaipmh` |
| **Formats** | XML (DC-NDL/RDF), JSON, MARC, TSV |
| **Bulk download** | Full OAI-PMH dumps (~1.5GB compressed) |
| **License** | Public domain for government works |

AI-enhanced OCR via Next Digital Library: https://lab.ndl.go.jp/dl/

---

## American history sources

### National Archives (NARA)

| Field | Details |
|-------|---------|
| **URL** | https://catalog.archives.gov |
| **Content** | Federal records (15B+ pages) |
| **API** | REST v2 |
| **Endpoints** | `https://catalog.archives.gov/api/v2/records/search?q={query}` |
| **Documentation** | https://github.com/usnationalarchives/Catalog-API |
| **Auth** | Free API key (email Catalog_API@nara.gov) |
| **Rate limits** | **10,000 queries/month** (higher available on request) |
| **Formats** | JSON, XML, CSV, PDF |
| **Bulk download** | Full dataset on **AWS Open Data Registry** |
| **License** | **Public domain** |

Government records from founding through present. Crowdsourced transcriptions via API.

### FamilySearch

| Field | Details |
|-------|---------|
| **URL** | https://www.familysearch.org |
| **Content** | Genealogical records (8B+ searchable names) |
| **API** | REST (comprehensive) |
| **Documentation** | https://developers.familysearch.org |
| **Auth** | **OAuth 2.0 required** |
| **Formats** | GEDCOM X (JSON/XML) |
| **SDKs** | Java, C#, PHP, JavaScript, Ruby, Objective C |
| **License** | Free personal use; commercial requires partnership |

Records from 100+ countries, medieval through modern. 1.4B+ person profiles in collaborative tree.

### Avalon Project (Yale)

| Field | Details |
|-------|---------|
| **URL** | https://avalon.law.yale.edu |
| **Content** | Primary source documents—law, history, diplomacy |
| **API** | **None** |
| **Formats** | HTML only |
| **License** | Public domain documents |

Nuremberg Trials, Constitutional Convention, treaties. Archived by LOC. Web scraping required.

---

## Reference and authority data

### Wikidata

| Field | Details |
|-------|---------|
| **URL** | https://www.wikidata.org/ |
| **Content** | 100M+ entities (people, places, concepts) |
| **APIs** | SPARQL, MediaWiki Action API, REST |
| **SPARQL** | https://query.wikidata.org/sparql |
| **Rate limits** | 60-second query timeout; 200 req/sec REST |
| **Formats** | JSON, JSON-LD, RDF, Turtle |
| **Bulk download** | Weekly dumps: https://dumps.wikimedia.org/wikidatawiki/entities/ |
| **License** | **CC0** |
| **Python** | `pywikibot`, `SPARQLWrapper`, `qwikidata` |

Federated queries supported. Extensive cross-linking to VIAF, Library of Congress, Getty.

### Getty Vocabularies (AAT, TGN, ULAN)

| Field | Details |
|-------|---------|
| **URL** | https://vocab.getty.edu/ |
| **Content** | AAT (80K+ art terms), TGN (2.2M+ places), ULAN (350K+ artists) |
| **SPARQL** | https://data.getty.edu/vocab/sparql |
| **Documentation** | http://vocab.getty.edu/doc/ |
| **Formats** | JSON-LD (Linked.Art), RDF, N-Triples |
| **Bulk download** | Monthly N-Triples at https://www.getty.edu/research/tools/vocabularies/obtain/ |
| **License** | Open Data Commons Attribution (ODC-By) |

**TGN includes historical place names** with temporal extents—essential for ancient world research. XML/relational formats retiring end 2025.

### VIAF

| Field | Details |
|-------|---------|
| **URL** | https://viaf.org/ |
| **Content** | 200M+ authority records from 37+ national libraries |
| **APIs** | REST, SRU, Linked Data |
| **Documentation** | https://www.oclc.org/developer/api/oclc-apis/viaf.en.html |
| **Formats** | JSON, XML, RDF, MARC21 |
| **Bulk download** | http://viaf.org/viaf/data/ |
| **License** | ODC-BY |

Links to all national library authority files. Includes ISNI, ORCID. **Cluster IDs may change** during monthly reprocessing.

### Library of Congress id.loc.gov

| Field | Details |
|-------|---------|
| **URL** | https://id.loc.gov/ |
| **Content** | LCSH (400K+ headings), LCNAF (10M+ names) |
| **APIs** | REST (content negotiation), OpenSearch |
| **Formats** | JSON-LD, RDF, MADS/RDF, SKOS |
| **Bulk download** | Full RDF dumps at https://id.loc.gov/download/ |
| **License** | **Public domain** |

**No live SPARQL endpoint**—download bulk data for local querying.

### DBpedia

| Field | Details |
|-------|---------|
| **URL** | https://www.dbpedia.org/ |
| **Content** | 6M+ entities from English Wikipedia |
| **SPARQL** | https://dbpedia.org/sparql |
| **Rate limits** | 10,000 rows max; 30-second timeout |
| **Formats** | JSON, JSON-LD, RDF, CSV |
| **Bulk download** | https://databus.dbpedia.org/ |
| **License** | CC-BY-SA 3.0 |
| **Python** | `SPARQLWrapper`, DBpedia Spotlight |

Extensive owl:sameAs links to Wikidata, GeoNames.

### GeoNames

| Field | Details |
|-------|---------|
| **URL** | https://www.geonames.org/ |
| **Content** | 11M+ place names, 9M unique features |
| **API** | REST |
| **Auth** | Free username required |
| **Rate limits** | **10,000 credits/day** (free); 1 request = 1 credit |
| **Formats** | JSON, XML |
| **Bulk download** | https://download.geonames.org/export/dump/ |
| **License** | CC-BY 4.0 |

---

## Astronomical and calendrical data

Essential for **dating historical events** via eclipse records and star catalogs.

### NASA ADS

| Field | Details |
|-------|---------|
| **URL** | https://ui.adsabs.harvard.edu/ |
| **Content** | 15M+ astronomy/astrophysics publications |
| **API** | REST |
| **Documentation** | https://ui.adsabs.harvard.edu/help/api/ |
| **Auth** | **API token required** (free) |
| **Rate limits** | **5,000 requests/day** |
| **Formats** | JSON, BibTeX |
| **Python** | `ads` |

Excellent for historical astronomical observations, eclipse reports, star catalog publications.

### VizieR / SIMBAD

| Field | Details |
|-------|---------|
| **URL** | https://vizier.cds.unistra.fr/ |
| **Content** | 25,800+ astronomical catalogs including historical star catalogs |
| **APIs** | TAP/ADQL, Cone Search |
| **TAP endpoint** | http://tapvizier.u-strasbg.fr/TAPVizieR/tap |
| **Formats** | VOTable, FITS, TSV, CSV, JSON |
| **Bulk download** | FTP: https://cdsarc.cds.unistra.fr/ |
| **Python** | `astroquery.vizier`, `astroquery.simbad`, `pyvo` |

**Historical catalogs available:** Hipparcos, Henry Draper, SAO, Bonner Durchmusterung.

### NASA Eclipse Database

| Field | Details |
|-------|---------|
| **URL** | https://eclipse.gsfc.nasa.gov/ |
| **Content** | 11,898 solar eclipses, 12,064 lunar eclipses (-1999 to +3000) |
| **API** | **None**—static tables |
| **Resources** | https://eclipse.gsfc.nasa.gov/SEsearch/SEsearch.php |
| **License** | **Public domain** |

**Essential for dating historical events.** Five Millennium Canon/Catalog (NASA Technical Publications) available as PDFs.

---

## Priority sources by research area

### Near East, Mesopotamia, Persia
- **CDLI** (cuneiform tablets—primary)
- **ORACC** (annotated cuneiform)
- **British Museum** (Cyrus Cylinder, Assyrian reliefs)
- **Louvre** (Code of Hammurabi)
- **Metropolitan Museum** (Department 3)
- **Pleiades** (ancient places)

### Egypt
- **Trismegistos** (primary metadata)
- **Papyri.info** (papyrology)
- **Metropolitan Museum** (Department 10)
- **Louvre** (Egyptian antiquities)
- **British Museum** (Rosetta Stone)

### Mediterranean and Classical
- **Perseus Digital Library** (Greek/Latin texts)
- **Pleiades** (gazetteer)
- **Ancient World Mapping Center** (GIS)
- **Pelagios** (linked geodata)
- **British Museum**, **Met**, **Louvre** (collections)

### Asian history
- **Chinese Text Project** (classical Chinese)
- **CBETA** (Buddhist canon)
- **Kanseki Repository** (GitHub-native)
- **National Diet Library** (Japan)

### American history
- **Library of Congress** (comprehensive)
- **National Archives** (federal records, AWS bulk data)
- **Chronicling America** (newspapers)
- **FamilySearch** (genealogy)

---

## Summary comparison table

| Source | API Type | Auth | Rate Limit | Bulk | License |
|--------|----------|------|------------|------|---------|
| Internet Archive | REST | No | Informal | Yes | CC0 meta |
| DPLA | REST | Key | None | Yes | CC0 meta |
| Europeana | REST/SPARQL | Key | None | Yes | CC0 meta |
| Library of Congress | REST | No | Yes | Yes | PD |
| Met Museum | REST | No | 80/sec | Yes | **CC0** |
| British Museum | SPARQL | No | N/S | No | ODC-BY |
| Smithsonian | REST | Key | 1K/hr | Yes | **CC0** |
| Cleveland Museum | REST | **No** | N/S | Yes | **CC0** |
| CDLI | REST | No | N/S | Yes | CC BY-SA |
| Pleiades | REST/LOD | No | N/S | Yes | CC BY |
| Papyri.info | SPARQL | No | N/S | Yes | Open |
| Trismegistos | REST | Partial | N/S | Yes | CC BY-SA |
| Wikidata | SPARQL | No | 60s timeout | Yes | **CC0** |
| Getty Vocabularies | SPARQL | No | N/S | Yes | ODC-BY |
| NOAA NCEI | REST | Key | 5/sec | Yes | **PD** |
| Chronicling America | REST | No | Encouraged | Yes | **PD** |
| NARA | REST | Key | 10K/mo | Yes | **PD** |
| Chinese Text Project | REST | Optional | Tiered | Subscribers | Open |
| NASA ADS | REST | Token | 5K/day | No | ToU |

**Key:** PD = Public Domain; N/S = Not Specified

---

## Key Python libraries

| Library | Use Case |
|---------|----------|
| `internetarchive` | Internet Archive |
| `dpla` | DPLA |
| `pyeuropeana` | Europeana |
| `SPARQLWrapper` | All SPARQL endpoints |
| `pywikibot` | Wikidata/Wikipedia |
| `openaccess_cma` | Cleveland Museum (official) |
| `astroquery` | SIMBAD, VizieR, NASA ADS |
| `ctext` | Chinese Text Project |
| `trove-newspaper-harvester` | Trove newspapers |
| `chroniclingamerica.py` | Chronicling America |
| `rdflib` | RDF parsing |

---

## Implementation recommendations

**For maximum coverage with minimal complexity:**
1. Start with **CC0 sources**: Met Museum, Cleveland Museum, Smithsonian, Wikidata, DPLA
2. Use **aggregators** (DPLA, Europeana) for broad searches before drilling into individual collections
3. Leverage **IIIF** for manuscript/map images across institutions
4. Build **Pleiades + Getty TGN + Wikidata** pipeline for ancient place resolution
5. Use **CDLI + Trismegistos** as primary Near Eastern text registries

**For bulk research:**
- NARA (AWS Open Data)
- Smithsonian (11M records on AWS)
- Art Institute of Chicago (nightly S3 dumps)
- Wikidata (weekly RDF dumps)
- Pleiades (daily CSV snapshots)