# Family Trees

## Overview

Family trees are where history becomes personal. By integrating genealogy into the system, we create "living history" — personal ancestral data connected to the broader historical timeline. This provides micro-history anchors, reveals migration patterns, and makes history tangible for millions of users.

### Separate Frontend, Shared Backend

Family Trees operates as a **separate frontend application** but shares the same **Core Data backend** as the main HistoryBuff platform:

```
┌─────────────────────┐    ┌─────────────────────┐
│  HistoryBuff        │    │  Family Trees       │
│  Main App           │    │  App                │
│                     │    │                     │
│  - Exploration      │    │  - Tree building    │
│  - Research         │    │  - Genealogy        │
│  - Source Reader    │    │  - Family docs      │
└─────────┬───────────┘    └─────────┬───────────┘
          │                          │
          └──────────┬───────────────┘
                     │
          ┌──────────▼───────────┐
          │     CORE DATA        │
          │     BACKEND          │
          │                      │
          │  - Factoids          │
          │  - Sources           │
          │  - Actors            │
          │  - Locations         │
          │  - Events            │
          │  - Frames            │
          └──────────────────────┘
```

This means:
- Family persons can link to main Actors (historical figures in your tree)
- Family documents contribute to Core Data (birth certificates become sources)
- Family locations use the shared geographic system
- Family events appear on the main timeline when public
- Genealogy communities can maintain their own frames

---

## Core Principles

### 1. History Made Personal
When your great-great-grandmother was born in Chicago in 1871, that's not just a date — it's the year of the Great Fire. The system connects personal history to broader context.

### 2. Micro-History Anchors
Family records — birth certificates, marriage records, photographs — provide verified dates and locations. These become anchoring points that strengthen the overall data.

### 3. Pattern Detection at Scale
When thousands of family trees show families "starting" in the 1850s with no earlier records, that's a pattern. When migrations cluster around specific events, that's data.

### 4. Privacy by Default
Family trees involve personal information. Living persons are protected. Users control visibility. Privacy is the default.

### 5. Genealogical Standards
We follow established genealogical evidence standards. Sources are cited. Uncertainty is explicit. Speculation is marked.

---

## User Stories

### Family Historian
- As a family historian, I want to build my family tree, so my ancestors are documented.
- As a family historian, I want to see historical context for each person, so I understand their world.
- As a family historian, I want to upload family photos and documents, so evidence is preserved.

### Explorer
- As an explorer, I want to see how personal histories connect to major events, so history feels real.
- As an explorer, I want to discover migration patterns, so I understand population movements.
- As an explorer, I want to find others researching the same families, so I can collaborate.

### Researcher
- As a researcher, I want to use family tree data as historical anchors, so dating is strengthened.
- As a researcher, I want to see aggregate patterns in genealogical data, so I can identify anomalies.
- As a researcher, I want to cross-reference family records with historical claims, so I can verify or challenge narratives.

---

## Data Model

### family_persons table

```sql
CREATE TABLE family_persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to main actor record (optional, for historical figures)
    actor_id UUID REFERENCES actors(id),
    
    -- Identity
    given_names TEXT,
    family_name TEXT,
    maiden_name TEXT,
    name_variants JSONB DEFAULT '[]',  -- Other names, spellings
    
    -- Vital dates
    birth_date DATE,
    birth_date_precision VARCHAR(20),
    birth_location_id UUID REFERENCES locations(id),
    birth_location_text TEXT,  -- Original record text
    
    death_date DATE,
    death_date_precision VARCHAR(20),
    death_location_id UUID REFERENCES locations(id),
    death_location_text TEXT,
    
    -- Status
    is_living BOOLEAN DEFAULT FALSE,
    
    -- Gender (for genealogical relationships)
    gender VARCHAR(20),
    
    -- Sources
    primary_source_ids UUID[] DEFAULT '{}',
    
    -- Tree membership
    tree_id UUID NOT NULL REFERENCES family_trees(id),
    
    -- Privacy
    privacy_level VARCHAR(20) DEFAULT 'private',
    -- private, tree_members, public
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### family_relationships table

```sql
CREATE TABLE family_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Persons
    person_a_id UUID NOT NULL REFERENCES family_persons(id),
    person_b_id UUID NOT NULL REFERENCES family_persons(id),
    
    -- Relationship type
    relationship_type VARCHAR(30) NOT NULL,
    -- parent_child, spouse, sibling
    
    -- For parent_child: which is parent
    parent_id UUID REFERENCES family_persons(id),
    child_id UUID REFERENCES family_persons(id),
    
    -- For spouse relationships
    marriage_date DATE,
    marriage_location_id UUID REFERENCES locations(id),
    divorce_date DATE,
    
    -- Sources
    source_ids UUID[] DEFAULT '{}',
    
    -- Certainty
    certainty VARCHAR(20) DEFAULT 'confirmed',
    -- confirmed, probable, possible, speculative
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### family_trees table

```sql
CREATE TABLE family_trees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Owner
    owner_id UUID NOT NULL REFERENCES users(id),
    
    -- Collaboration
    collaborator_ids UUID[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    
    -- Stats
    person_count INTEGER DEFAULT 0,
    generation_count INTEGER DEFAULT 0,
    earliest_date DATE,
    latest_date DATE,
    
    -- Geographic spread
    locations_touched UUID[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### family_documents table

```sql
CREATE TABLE family_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    tree_id UUID NOT NULL REFERENCES family_trees(id),
    
    -- Document info
    document_type VARCHAR(30),
    -- birth_certificate, death_certificate, marriage_record,
    -- census, military, immigration, photograph, letter, other
    
    title TEXT,
    description TEXT,
    
    -- Dating
    document_date DATE,
    document_date_precision VARCHAR(20),
    
    -- Storage
    file_storage_ref TEXT,
    thumbnail_storage_ref TEXT,
    
    -- Transcription
    transcription TEXT,
    
    -- Linked persons
    person_ids UUID[] DEFAULT '{}',
    
    -- Source value
    is_primary_source BOOLEAN DEFAULT TRUE,
    source_quality VARCHAR(20) DEFAULT 'original',
    -- original, copy, transcription, extract
    
    -- Privacy
    privacy_level VARCHAR(20) DEFAULT 'private',
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Historical Context Integration

### Auto-Surfacing Context

When viewing a family member:

```
┌─────────────────────────────────────────────────────────────────┐
│ JOHN SMITH (1868-1942)                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Born: March 15, 1868 - Chicago, Illinois                       │
│ Died: November 3, 1942 - Los Angeles, California               │
│                                                                 │
│ HISTORICAL CONTEXT                                              │
│ ──────────────────                                              │
│                                                                 │
│ * 1871 (age 3): Great Chicago Fire                             │
│   Your ancestor lived through this event.                       │
│   [View related factoids]                                       │
│                                                                 │
│ * 1893 (age 25): Chicago World's Fair                          │
│   The "White City" was built 3 miles from his residence.       │
│   [View fair details]                                           │
│                                                                 │
│ * 1910 (age 42): Moved to Los Angeles                          │
│   Part of the great westward migration. Population of LA       │
│   tripled 1900-1920.                                           │
│   [View migration patterns]                                     │
│                                                                 │
│ * 1917-1918 (age 49-50): World War I                           │
│   [Check military records]                                      │
│                                                                 │
│ * 1929-1939 (age 61-71): Great Depression                      │
│   Los Angeles unemployment reached 30%.                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Context Matching Algorithm

```python
def get_historical_context(person):
    """
    Find relevant historical events for a person's life.
    """
    context = []
    
    # Get person's life span and locations
    life_start = person.birth_date
    life_end = person.death_date or now()
    locations = get_person_locations(person)
    
    # Find events in time range and geography
    events = Factoid.query()\
        .filter(date_between(life_start, life_end))\
        .filter(location_near_any(locations, radius_km=100))\
        .filter(significance='major')\
        .order_by(date)\
        .all()
    
    for event in events:
        person_age = calculate_age(person, event.date)
        proximity = calculate_proximity(person, event)
        
        context.append({
            'event': event,
            'person_age': person_age,
            'proximity': proximity,
            'relevance_score': calculate_relevance(person, event),
            'connection_type': infer_connection(person, event)
        })
    
    return sorted(context, key=lambda x: x['relevance_score'], reverse=True)
```

### Life Timeline Visualization

```
JOHN SMITH (1868-1942)
──────────────────────────────────────────────────────────────────

│ BIRTH                                                   DEATH
│ 1868                                                    1942
│ Chicago                                                 LA
│   │                                                      │
▼   ▼                                                      ▼
●───┼───────●───────●───────●───────●───────●───────●─────●
    │       │       │       │       │       │       │
   1871    1893    1910    1917    1929    1939    │
   Great   World's  Move    WWI    Depression     │
   Fire    Fair    to LA                         WWII
   (age 3) (age 25)(age 42)(age 49)              (age 71-74)
   
   ▲ Chicago period ─────────────▶│◀─── LA period ────────▶
```

---

## Migration Mapping

### Individual Migration

Track a person's movements:

```javascript
{
  person_id: "uuid-john-smith",
  migrations: [
    {
      from_location: "New York Harbor",
      to_location: "Chicago, IL",
      date: "1865",
      event_type: "immigration",
      source: "Ship manifest",
      notes: "Family arrived from Ireland"
    },
    {
      from_location: "Chicago, IL",
      to_location: "Los Angeles, CA",
      date: "1910",
      event_type: "relocation",
      source: "Census records",
      notes: "Part of westward migration"
    }
  ]
}
```

### Aggregate Migration Patterns

When many trees show similar patterns:

```
PATTERN DETECTED: Irish Immigration to Chicago (1845-1880)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Data from 847 family trees

Origin clusters:
├── County Cork: 23%
├── County Kerry: 18%
├── County Galway: 15%
└── Other: 44%

Arrival ports:
├── New York: 67%
├── Boston: 22%
├── Other: 11%

Settlement in Chicago:
├── Near West Side: 34%
├── Bridgeport: 28%
├── Back of the Yards: 19%
└── Other: 19%

Historical context:
├── Irish Potato Famine (1845-1852)
├── Chicago canal/railroad construction boom
└── Post-Fire rebuilding (1871+)

[View individual stories] [View on map] [View timeline]
```

---

## Anomaly Detection

### Missing Records Pattern

```
PATTERN: Record Gap Pre-1850
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analysis of 12,847 family trees shows:

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Generations tracked by decade of earliest ancestor:       │
│                                                             │
│  Pre-1800:  ████████░░░░░░░░░░░░░░░░  18%                  │
│  1800-1830: ██████████████░░░░░░░░░░  31%                  │
│  1830-1850: ████████████████████████  47%                  │
│  1850-1870: ████░░░░░░░░░░░░░░░░░░░░   4%                  │
│                                                             │
│  * Sharp increase in "origin" points in 1830-1850 range    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Possible explanations:
├── Record-keeping improvements
├── Immigration waves creating "fresh starts"
├── Civil records replacing church records
├── [Explore alternative hypotheses]

Regions most affected:
├── United States (particularly Midwest)
├── Australia
├── Parts of Europe with disruption

[Deep dive] [Compare to historical events] [Discuss]
```

### Orphan Patterns

```
PATTERN: Orphan Clustering (1850-1920)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Family trees show unusual orphan concentrations:

Time periods:
├── 1854-1929: Orphan Train era (documented 250,000)
├── Post-Civil War (1865-1880): War orphans
├── 1918-1920: Influenza pandemic orphans

Geographic patterns:
├── Origin: NYC, Boston, Philadelphia (primarily)
├── Destination: Midwest farm communities

Anomalies detected:
├── Many children with "unknown" parentage
├── Siblings separated across states
├── Family names changed upon placement

Questions raised:
├── What happened to biological families?
├── Were all "orphans" actually orphaned?
├── Why so concentrated in this period?

[View individual cases] [View on map] [Related factoids]
```

---

## Features

### MVP (Phase 1)

**Basic tree building**
- Add persons with vital dates
- Create parent/child, spouse relationships
- Simple tree visualization

**Document upload**
- Photos and documents
- Link to persons
- Basic metadata

**Simple context**
- Manual linking to historical events
- Basic timeline view

### Phase 2

**Auto context surfacing**
- Events matched to person's time/place
- Historical backdrop display
- Life timeline visualization

**Migration tracking**
- Record movements
- Map visualization
- Pattern detection (basic)

**Collaboration**
- Share trees
- Merge duplicate persons
- Collaborative editing

### Phase 3 (Dream)

**AI-assisted features**
- OCR for documents
- Automatic person detection in photos
- Suggested connections

**Pattern analysis**
- Aggregate migration patterns
- Anomaly detection
- Cross-tree connections

**DNA integration**
- Link DNA matches
- Ethnicity estimates in context
- Genetic genealogy support

---

## Privacy Controls

### Privacy Levels

```yaml
private:
  description: Only tree owner and explicit collaborators
  visibility: owner + collaborators
  searchable: no
  
tree_members:
  description: Anyone with access to this tree
  visibility: all tree members
  searchable: within tree only
  
public:
  description: Visible to all users
  visibility: everyone
  searchable: yes
  restrictions: living persons excluded
```

### Living Person Protection

```python
def protect_living_persons(person, viewer):
    """
    Protect privacy of living persons.
    """
    if not person.is_living:
        return person  # Full visibility for deceased
    
    if viewer == person.created_by:
        return person  # Owner sees everything
    
    if viewer in person.tree.collaborator_ids:
        return person  # Collaborators see within tree
    
    # Public view of living person
    return {
        'id': person.id,
        'is_living': True,
        'birth_date': None,
        'name': '[Living Person]',
        # Minimal info only
    }
```

### Opt-Out

Users can mark themselves or living relatives:
- Full opt-out (not included in any public views)
- Limited visibility (relationships shown, no details)
- DNA matching opt-out

---

## Genealogical Standards

### Evidence Standards

Following Board for Certification of Genealogists standards:

```yaml
source_types:
  original:
    description: First recording of information
    reliability: highest
    examples:
      - Birth certificate
      - Marriage register original entry
      - Census enumeration sheet
      
  derivative:
    description: Copy, transcription, or extract
    reliability: high (check against original if possible)
    examples:
      - Database transcription
      - Published abstract
      - Index entry
      
  authored:
    description: Narrative created by someone
    reliability: depends on author's sources
    examples:
      - Family history
      - Biography
      - Compiled genealogy

evidence_types:
  direct:
    description: States the fact explicitly
    example: Birth certificate stating date and parents
    
  indirect:
    description: Implies the fact
    example: Age on census implying birth year
    
  negative:
    description: Absence of expected information
    example: Not found in death records (might still be living)
```

### Citation Format

```javascript
{
  source_citation: {
    title: "1870 United States Federal Census",
    repository: "National Archives",
    access_path: "Ancestry.com",
    accessed_date: "2024-03-15",
    
    specific_item: {
      state: "Illinois",
      county: "Cook",
      city: "Chicago",
      enumeration_district: 42,
      page: 15,
      dwelling: 87,
      family: 92
    },
    
    image_url: "https://...",
    transcription: "John Smith, age 32, born Ireland..."
  }
}
```

---

## Integration with Main System

### Family Data as Anchors

Family records provide dating anchors at the **documentary tier** of the anchor hierarchy:

```python
def create_anchor_from_family_record(document):
    """
    Create chronological anchor from verified family record.

    Anchor Hierarchy for genealogical records:
    - Tier 4 (documentary): Government vital records, church registers
    - Weight: 0.70 in mainstream frame (varies by frame)

    Note: Family records are strong for recent history (post-1800)
    where documentary evidence is reliable.
    """
    anchor_config = {
        'birth_certificate': {'confidence': 0.95, 'tier': 'documentary'},
        'death_certificate': {'confidence': 0.95, 'tier': 'documentary'},
        'marriage_record': {'confidence': 0.90, 'tier': 'documentary'},
        'census': {'confidence': 0.85, 'tier': 'documentary'},
        'military_record': {'confidence': 0.85, 'tier': 'documentary'},
        'church_register': {'confidence': 0.80, 'tier': 'documentary'},
        'photograph': {'confidence': 0.70, 'tier': 'documentary'},  # Date from photo
        'family_bible': {'confidence': 0.60, 'tier': 'traditional'},  # Lower tier
    }

    config = anchor_config.get(document.document_type)
    if not config:
        return None

    if document.source_quality == 'original':
        # Create factoid in Core Data
        factoid = create_factoid_for_event(document)

        # Create anchor
        anchor = Anchor(
            factoid_id=factoid.id,
            description=f"Vital record: {document.title}",
            anchor_type=config['tier'],
            anchor_date=document.document_date,
            confidence=config['confidence'],
            methodology=f"Government vital record, primary source, quality: {document.source_quality}"
        )
        return anchor
```

**Integration with Frame System**:
- Documentary anchors receive weight 0.70 in mainstream frame
- Genealogy communities typically use mainstream frame for recent history
- For deep ancestry connecting to ancient history, frame choice matters more

### Historical Figure Connections

When family trees connect to historical figures:

```
CONNECTION FOUND
━━━━━━━━━━━━━━━━

Your ancestor MARY O'BRIEN (1845-1920) appears in:

Historical record: "Irish Famine Immigration Records"
  - Arrived New York, 1847
  - Ship: "Star of the West"
  - Origin: Skibbereen, County Cork

This connects your tree to:
  - Great Famine factoid cluster (147 factoids)
  - Skibbereen documentation (23 factoids)
  - Irish-American migration pattern (892 trees)

[View connections] [Add to research]
```

### Frame, Lens & Community Integration

**Lenses from Family Trees**

A family tree naturally becomes a lens - a curated view of history through your ancestors:

```yaml
family_lens:
  name: "Smith Family History 1820-1950"
  type: "source_lens"

  # Auto-generated from tree
  temporal_bounds:
    start_year: 1820  # Earliest ancestor
    end_year: 1950    # Most recent deceased

  geographic_regions:
    - "ireland/cork"      # Origin
    - "usa/new-york"      # Immigration
    - "usa/illinois"      # Settlement
    - "usa/california"    # Migration

  # Linked from tree
  focus_actors: ["mary-obrien-uuid", "john-smith-uuid", ...]

  # Auto-surfaced events
  included_factoids:
    - Great Famine events (connected via Mary O'Brien)
    - Chicago Fire (John Smith present)
    - Westward migration patterns

  visibility: "private"  # Family lens, can be shared
```

**Community Integration**

Family tree users can join the **Genealogy Network** community:

```yaml
genealogy_network_community:
  type: "interest"
  frame: "mainstream"  # Standard dating for recent history

  features:
    - Shared research on common ancestors
    - Collaborative tree merging
    - Pattern detection across trees
    - Core Data enrichment (tagging, connecting)

  # Genealogists contribute to Core Data
  contribution_focus:
    - Documentary sources (vital records)
    - Location verification
    - Migration patterns
    - Biographical connections
```

### Document Extraction Pipeline

Family documents can be queued for AI extraction:

```python
def queue_family_document_extraction(document):
    """
    Queue family document for extraction to Core Data.

    Supported document types:
    - Letters: Extract events, locations, people mentioned
    - Diaries: Extract daily events, observations
    - Photographs: Extract date, location, people (with AI assistance)
    - Official records: Extract structured data
    """
    extraction_request = ExtractionRequest(
        source_type='family_document',
        document_id=document.id,
        tree_id=document.tree_id,

        # What to extract
        extract_targets=[
            'events',      # Things that happened
            'persons',     # People mentioned
            'locations',   # Places mentioned
            'dates',       # Dates/time references
            'relationships'  # Family connections mentioned
        ],

        # Privacy settings
        privacy_filter={
            'exclude_living': True,
            'anonymize_recent': True,  # Last 100 years
            'owner_approval_required': True
        },

        # Output destination
        output_to='core_data',  # Contributes to shared Core Data
        link_to_tree=True       # Also links back to family tree
    )

    return queue_extraction(extraction_request)
```

**Example: Letter Extraction**

```
FAMILY LETTER EXTRACTION
━━━━━━━━━━━━━━━━━━━━━━━━

Document: "Letter from Mary to sister, 1892"
Tree: Smith Family Tree

EXTRACTED DATA:
───────────────

EVENTS:
- "Arrived in Chicago last Tuesday" -> Event: Migration arrival
  Date: ~1892 (from letter date)
  Location: Chicago, IL
  Actor: Mary O'Brien Smith

- "The factory burned down" -> Event: Fire incident
  Date: 1892
  Location: Near residence (needs verification)

PERSONS MENTIONED:
- "Uncle Patrick" -> Possible new person for tree
- "The Murphys next door" -> Neighbors, context

LOCATIONS:
- "243 Canal Street" -> Residence address
- "St. Patrick's Church" -> Community connection

[Review & Approve] [Edit Extractions] [Reject]
```

**Events and Timelines from Family Data**

Family trees don't just show relationships - they show life events:

```
MARY O'BRIEN SMITH - LIFE EVENTS TIMELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

From family documents and records:

1845 - Born, Skibbereen, County Cork
       [Birth record]

1847 - Survived Great Famine
       [Context: Historical event]
       Family fled to Cork city

1847 - Emigrated to America
       [Ship manifest: Star of the West]
       Arrived New York Harbor

1865 - Married John Smith
       [Marriage certificate]
       St. Patrick's Church, Chicago

1868 - First child born (Thomas)
       [Birth certificate]

1871 - Survived Great Chicago Fire
       [Context: Historical event]
       Family home destroyed

1892 - Letter to sister in Ireland
       [Family document - extracted]
       Describes life in Chicago

1920 - Died, Los Angeles
       [Death certificate]

[View on timeline] [Export to lens] [Share]
```

---

## Open Questions

- **Privacy compliance**: GDPR, CCPA implications for genealogical data?

- **Living person threshold**: How to determine if someone is living? (No death record + born < 100 years ago?)

- **Tree merging**: How to handle conflicting information when merging trees?

- **DNA integration**: Partner with DNA companies? Privacy implications?

- **Historical figure verification**: How to verify claims of descent from historical figures?

---

## Dependencies

- **02-data-model.md**: Schema integration, family_persons linking to actors
- **04-chronology-system.md**: Anchor hierarchy for documentary sources
- **05-geographic-system.md**: Location tracking for migrations
- **07-extraction-pipeline.md**: Document extraction for letters, diaries
- **09-users-community.md**: Genealogy Network community
- **11-frames-namespaces.md**: Family lenses, community frames

---

## Summary

Family Trees is a **separate frontend application** sharing the HistoryBuff **Core Data backend**. It transforms abstract history into personal experience by connecting individual ancestral data to the broader historical record.

Key integrations:
- **Core Data**: Family documents become sources, persons link to actors
- **Anchors**: Vital records provide documentary-tier anchors (weight 0.70)
- **Lenses**: Family trees auto-generate personal lenses of relevant history
- **Communities**: Genealogy Network for collaborative research
- **Extraction**: Queue family letters/diaries for AI extraction to Core Data

Family trees aren't just relationship diagrams - they're event timelines. Extract life events from documents, connect to historical context, and see your ancestors' lives unfold against the backdrop of world events.

Your great-grandmother wasn't just born in 1871 Chicago - she survived the Great Fire at age 3. History becomes real when it's your history. 
