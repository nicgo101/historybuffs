# Extraction Pipeline

## Overview

The extraction pipeline transforms raw historical documents into structured data. Using AI-assisted processing with human verification, it systematically extracts claims, entities, relationships, and temporal markers from historical texts.

**Critical distinction**: We extract what sources *claim*, not what *happened*. "Herodotus says X" is high-confidence data. "X happened" is inference. The pipeline preserves this distinction throughout.

---

## Core Principles

### 1. Source Says, Not Source Proves
Every extraction is framed as a claim by a source. The source said it. Whether it's true is a separate question handled by confidence scoring and corroboration.

### 2. Preserve Author Attribution
When Herodotus writes "The Egyptians say..." vs "I saw...", that distinction matters. We capture not just the claim but the author's own sourcing.

### 3. Human Verification Required
AI extracts, humans verify. No AI extraction goes directly to the main database without review. The pipeline creates a queue, humans process it.

### 4. Incremental Processing
Documents are chunked, processed incrementally, and can be paused/resumed. A crashed extraction doesn't lose all work.

### 5. Normalization with Preservation
Raw text is preserved. Normalized entities link to database records. Both coexist — the original is never lost.

---

## User Stories

### Researcher
- As a researcher, I want to upload a historical text, so it can be systematically extracted.
- As a researcher, I want to review AI extractions, so I can correct errors before they enter the database.
- As a researcher, I want to see extraction progress, so I know when a document is complete.

### Verifier
- As a verifier, I want a queue of extractions to review, so I can contribute to data quality.
- As a verifier, I want to see the original text alongside extractions, so I can check accuracy.
- As a verifier, I want to flag problematic extractions, so they get expert attention.

### Admin
- As an admin, I want to see pipeline status across all documents, so I can monitor progress.
- As an admin, I want to prioritize certain documents, so important sources are processed first.
- As an admin, I want to manage the verification queue, so bottlenecks are addressed.

---

## Pipeline Architecture

### High-Level Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   CAPTURE   │────▶│   PROCESS   │────▶│   VERIFY    │
│             │     │             │     │             │
│ - Ingest    │     │ - Parse     │     │ - Review    │
│ - Store     │     │ - Chunk     │     │ - Correct   │
│ - Metadata  │     │ - Embed     │     │ - Approve   │
└─────────────┘     │ - Extract   │     │ - Reject    │
                    │ - Normalize │     └──────┬──────┘
                    │ - Link      │            │
                    └─────────────┘            ▼
                                        ┌─────────────┐
                                        │   PUBLISH   │
                                        │             │
                                        │ - Commit    │
                                        │ - Index     │
                                        │ - Notify    │
                                        └─────────────┘
```

### Stage Details

#### 1. CAPTURE

**Input sources:**
- Project Gutenberg (public domain texts)
- Internet Archive (scanned documents)
- User uploads (PDFs, text files)
- Existing digital editions

**Process:**
```python
def capture_document(source_url_or_file, metadata):
    # 1. Fetch or receive content
    content = fetch_content(source_url_or_file)

    # 2. Extract text (OCR if needed)
    text = extract_text(content)

    # 3. Store original
    storage_ref = store_original(content)

    # 4. Create source record (if not exists)
    source = create_or_link_source(metadata)

    # 5. Create document record
    document = create_document(
        title=metadata.title,
        author_id=resolve_or_create_author(metadata.author),
        source_id=source.id,
        full_text_storage_ref=storage_ref,
        extraction_status='pending'
    )

    # 6. Create extraction set for this document
    # All factoids extracted from this document belong to this set
    extraction_set = create_extraction_set(
        name=f"{metadata.title} - Full Extraction",
        source_id=source.id,
        document_id=document.id,
        scope='complete',
        extraction_status='pending'
    )

    return document, extraction_set
```

**Extraction Sets** are critical for the Source Reader feature (see 21-source-reader.md). They group all data extracted from a single source, enabling:
- "Playing" the book as events unfold page by page
- Viewing everything Herodotus claims in one lens
- Comparing one historian's worldview against another's
- Tracking extraction progress and quality per source

**Metadata captured:**
- Title, author, date composed
- Source type and genre
- Original language
- Edition/translation notes
- Digital source URL
- Copyright status

#### 2. PROCESS

**2a. Parse Structure**

Identify document structure:
```python
def parse_structure(document):
    text = load_text(document.full_text_storage_ref)
    
    structure = {
        'has_books': detect_books(text),
        'has_chapters': detect_chapters(text),
        'has_sections': detect_sections(text),
        'structure_type': classify_structure(text)
    }
    
    # Generate structural markers
    markers = extract_structural_markers(text, structure)
    # e.g., [("Book 1", 0, 15000), ("Book 1, Chapter 1", 0, 2000), ...]
    
    return structure, markers
```

**2b. Chunk**

Split into processable chunks:
```python
def chunk_document(document, markers, chunk_size=2000):
    text = load_text(document.full_text_storage_ref)
    chunks = []
    
    for i, (start, end) in enumerate(chunk_boundaries(text, chunk_size)):
        chunk_text = text[start:end]
        structural_ref = find_structural_reference(start, markers)
        
        chunk = create_chunk(
            document_id=document.id,
            chunk_index=i,
            content_text=chunk_text,
            structural_reference=structural_ref,  # "Book 1, Chapter 5"
            extraction_status='pending'
        )
        chunks.append(chunk)
    
    document.total_chunks = len(chunks)
    return chunks
```

**2c. Embed**

Generate vector embeddings for semantic search:
```python
def embed_chunk(chunk):
    embedding = embedding_model.encode(chunk.content_text)
    chunk.embedding = embedding
    chunk.save()
```

**2d. Extract**

AI extraction of claims, entities, temporal markers:
```python
def extract_from_chunk(chunk, source_context):
    prompt = build_extraction_prompt(
        text=chunk.content_text,
        source_info=source_context,
        structural_ref=chunk.structural_reference
    )
    
    response = llm.complete(prompt)
    
    extractions = parse_extraction_response(response)
    
    for extraction in extractions:
        create_extracted_claim(
            chunk_id=chunk.id,
            claim_text=extraction.claim_text,
            claim_type=extraction.claim_type,
            entities_raw=extraction.entities,
            temporal_markers_raw=extraction.temporal_markers,
            author_attribution=extraction.attribution,
            extraction_confidence=extraction.confidence
        )
    
    chunk.extraction_status = 'extracted'
    chunk.extracted_claims_count = len(extractions)
    chunk.save()
```

**2e. Normalize**

Link raw entities to database records:
```python
def normalize_extraction(extracted_claim):
    # Normalize entities
    for entity in extracted_claim.entities_raw:
        # Search for existing match
        match = find_entity_match(
            entity['text'],
            entity['type'],
            context=extracted_claim.chunk.content_text
        )
        
        if match:
            entity['normalized_id'] = match.id
            entity['match_confidence'] = match.confidence
        else:
            entity['normalized_id'] = None
            entity['needs_creation'] = True
    
    # Normalize temporal markers
    for marker in extracted_claim.temporal_markers_raw:
        normalized = normalize_date(marker['text'], marker['type'])
        marker['normalized'] = normalized
    
    extracted_claim.save()
```

**2f. Link**

Connect to existing database entities:
```python
def link_extraction(extracted_claim):
    # Link to source
    extracted_claim.source_id = extracted_claim.chunk.document.source_id
    
    # Link entities to actors/artifacts/locations
    for entity in extracted_claim.entities_raw:
        if entity.get('normalized_id'):
            create_pending_link(
                from_claim=extracted_claim,
                to_entity_type=entity['type'],
                to_entity_id=entity['normalized_id']
            )
    
    # Check for similar existing factoids
    similar = find_similar_factoids(extracted_claim)
    extracted_claim.similar_factoids = [f.id for f in similar]
    
    extracted_claim.save()
```

#### 3. VERIFY

Human review of AI extractions:

**Verification interface:**
```
┌─────────────────────────────────────────────────────────────────┐
│ VERIFICATION QUEUE                                              │
├─────────────────────────────────────────────────────────────────┤
│ Source: Herodotus, Histories, Book 1, Chapter 23               │
│                                                                 │
│ ORIGINAL TEXT:                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ "Arion of Methymna was carried to Taenarum on the back of   │ │
│ │ a dolphin. He was second to none of the lyre-players of     │ │
│ │ that time, and was the first man we know of to compose a    │ │
│ │ dithyramb, name it, and produce it at Corinth."             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ EXTRACTED CLAIMS:                                               │
│                                                                 │
│ 1. [CLAIM] Arion was carried by dolphin to Taenarum            │
│    Type: event                                                  │
│    Attribution: author_states                                   │
│    Entities: Arion (person), Taenarum (location)               │
│    Confidence: 0.85                                             │
│    [✓ Approve] [✎ Edit] [✗ Reject] [⚑ Flag]                   │
│                                                                 │
│ 2. [CLAIM] Arion was from Methymna                             │
│    Type: relationship                                           │
│    Attribution: author_states                                   │
│    Entities: Arion (person), Methymna (location)               │
│    Confidence: 0.95                                             │
│    [✓ Approve] [✎ Edit] [✗ Reject] [⚑ Flag]                   │
│                                                                 │
│ 3. [CLAIM] Arion was pre-eminent lyre-player                   │
│    Type: description                                            │
│    Attribution: author_states                                   │
│    Entities: Arion (person)                                     │
│    Confidence: 0.90                                             │
│    [✓ Approve] [✎ Edit] [✗ Reject] [⚑ Flag]                   │
│                                                                 │
│ 4. [CLAIM] Arion invented the dithyramb                        │
│    Type: event                                                  │
│    Attribution: first_known ("first man we know of")           │ 
│    Entities: Arion (person), dithyramb (concept)               │
│    Temporal: relative (before Herodotus's time)                │
│    Confidence: 0.88                                             │
│    [✓ Approve] [✎ Edit] [✗ Reject] [⚑ Flag]                   │
│                                                                 │
│ 5. [CLAIM] Dithyramb was first produced at Corinth             │
│    Type: event                                                  │
│    Attribution: author_states                                   │
│    Entities: Corinth (location), dithyramb (concept)           │
│    Confidence: 0.80                                             │
│    [✓ Approve] [✎ Edit] [✗ Reject] [⚑ Flag]                   │
│                                                                 │
│ MISSING ANYTHING? [+ Add claim]                                 │
│                                                                 │
│ [◀ Previous] [Skip] [Next ▶]                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Verification actions:**
- **Approve**: Extraction is correct, proceed to publish
- **Edit**: Modify claim text, entities, attribution, etc.
- **Reject**: Extraction is wrong, discard
- **Flag**: Needs expert review (ambiguous, contentious, complex)
- **Add**: Human adds claim AI missed

#### 4. PUBLISH

Convert verified extractions to factoids. Note: We store raw temporal evidence on the factoid, then create frame-dependent placements.

```python
def publish_extraction(verified_claim, extraction_set):
    # Create factoid with RAW observation (not interpreted dates)
    factoid = create_factoid(
        description=verified_claim.claim_text,
        summary=generate_summary(verified_claim),
        factoid_type=verified_claim.claim_type,

        # Raw observation - frame-independent
        raw_observation=verified_claim.temporal_raw_text,  # "in the 5th year of Darius"
        raw_observation_type=determine_observation_type(verified_claim),

        layer='attested',  # From historical source
        status='sourced',

        # Link to extraction set
        extraction_set_id=extraction_set.id,
        extraction_location=verified_claim.chunk.structural_reference,
        extraction_confidence=verified_claim.extraction_confidence,
        extraction_verified=True
    )

    # Create placement in Mainstream frame (if date can be interpreted)
    if verified_claim.temporal_normalized:
        create_factoid_placement(
            factoid_id=factoid.id,
            frame_id=MAINSTREAM_FRAME_ID,
            date_start=verified_claim.temporal_normalized.get('date_start'),
            date_end=verified_claim.temporal_normalized.get('date_end'),
            date_precision=verified_claim.temporal_normalized.get('precision'),
            placement_confidence=verified_claim.temporal_normalized.get('confidence'),
            reasoning=f"Extracted from {extraction_set.source.title}",
            placement_type='system'
        )

    # Link to source
    create_factoid_source(
        factoid_id=factoid.id,
        source_id=verified_claim.source_id,
        relationship='primary_source',
        page_reference=verified_claim.chunk.structural_reference,
        relevant_excerpt=get_excerpt(verified_claim),
        author_attribution=verified_claim.author_attribution
    )

    # Create/link entities
    for entity in verified_claim.entities_raw:
        if entity.get('normalized_id'):
            create_connection(
                from_entity_type='factoid',
                from_entity_id=factoid.id,
                to_entity_type=entity['type'],
                to_entity_id=entity['normalized_id']
            )
        elif entity.get('needs_creation'):
            new_entity = create_entity_from_extraction(entity)
            create_connection(factoid, new_entity)

    # Update extraction set counts
    extraction_set.factoid_count += 1
    extraction_set.save()

    # Update extraction record
    verified_claim.status = 'converted'
    verified_claim.converted_to_factoid_id = factoid.id
    verified_claim.save()

    # Trigger indexing
    index_factoid(factoid)

    # Check for chain membership
    check_chain_membership(factoid, extraction_set)

    return factoid
```

---

## Extraction Prompts

### Main Extraction Prompt

```
You are extracting historical claims from an ancient source text.

SOURCE INFORMATION:
- Title: {source_title}
- Author: {author_name}
- Approximate date: {date_composed}
- Genre: {genre}
- Section: {structural_reference}

TEXT TO ANALYZE:
"""
{chunk_text}
"""

Extract all discrete claims from this text. For each claim, provide:

1. CLAIM_TEXT: A concise statement of what is being claimed
2. CLAIM_TYPE: One of [event, relationship, description, speech, belief, custom]
3. ATTRIBUTION: How does the author present this information?
   - "i_saw" (author witnessed)
   - "i_heard" (author was told directly)
   - "they_say" (attributed to a group: Greeks say, Egyptians say, etc.)
   - "it_is_said" (general tradition, unattributed)
   - "source_says" (author cites a specific earlier source)
   - "author_states" (author presents as fact without attribution)
4. ENTITIES: People, places, groups, artifacts mentioned
   - Format: [{name, type (person/place/group/artifact), role in claim}]
5. TEMPORAL_MARKERS: Any time references
   - Format: [{text, type (absolute/relative/reign/generation)}]
6. CONFIDENCE: Your confidence in the extraction (0.0-1.0)

IMPORTANT:
- Extract what the SOURCE CLAIMS, not historical truth
- Preserve the author's own uncertainty or hedging
- Note when author distinguishes their sources
- Do not merge multiple claims into one
- Include even minor claims (relationships, descriptions)

Respond in JSON format:
{
  "claims": [
    {
      "claim_text": "...",
      "claim_type": "...",
      "attribution": "...",
      "entities": [...],
      "temporal_markers": [...],
      "confidence": 0.X
    }
  ]
}
```

### Entity Resolution Prompt

```
You are matching an extracted entity to existing database records.

EXTRACTED ENTITY:
- Text: "{entity_text}"
- Type: {entity_type}
- Context: "{surrounding_text}"

CANDIDATE MATCHES FROM DATABASE:
{candidate_list}

For each candidate, assess:
1. Is this the same entity? (yes/no/possibly)
2. Confidence (0.0-1.0)
3. Reasoning

If no good match exists, indicate "no_match" and whether a new entity should be created.

Respond in JSON format.
```

### Date Normalization Prompt

```
You are analyzing historical date references. IMPORTANT: Preserve the raw evidence first, then provide interpretation.

DATE REFERENCE: "{date_text}"
CONTEXT: "{surrounding_text}"
SOURCE: {source_title} (composed approximately {source_approximate_date})

Your response must include:

1. RAW EVIDENCE (always preserve exactly):
   - raw_text: The exact text as it appears
   - raw_type: What kind of reference is this?
     - absolute_named: "480 BCE", "Year 1234 AH"
     - regnal: "5th year of Darius", "under King X"
     - relative_event: "after the fall of Troy", "before the flood"
     - relative_duration: "three generations later", "15 years after"
     - seasonal: "in the spring", "during harvest"
     - astronomical: "when the sun darkened", "when the comet appeared"
     - vague: "in ancient times", "long ago"

2. MAINSTREAM INTERPRETATION (if possible):
   - normalized_start: ISO date or null if cannot determine
   - normalized_end: ISO date or null
   - precision: exact/year/decade/century/millennium/unknown
   - interpretation_confidence: 0.0-1.0
   - interpretation_notes: How did you arrive at this date?
   - requires_anchor: true if this needs another date to resolve

3. ALTERNATIVE INTERPRETATIONS (if any):
   - List other valid readings of this date reference
   - Note which chronological frameworks would give different dates

CRITICAL PRINCIPLES:
- The RAW EVIDENCE is frame-independent and must always be captured
- The INTERPRETATION is frame-dependent and may vary
- Do NOT force interpretation if the reference is genuinely ambiguous
- "5th year of Darius" is BETTER DATA than a guess at absolute date
- Relative references ("3 years later") are valuable for chains even without absolute anchors

Example:
- Input: "in the fifth year of Darius"
- Output:
  {
    "raw_text": "in the fifth year of Darius",
    "raw_type": "regnal",
    "normalized_start": "-0517",  // IF we accept mainstream Darius I dates
    "precision": "year",
    "interpretation_confidence": 0.7,
    "interpretation_notes": "Assumes Darius I (r. 522-486 BCE). Could be Darius II or III.",
    "requires_anchor": true,
    "alternative_interpretations": [
      {"framework": "Fomenko", "note": "Would place this ~1000 years later"},
      {"framework": "Darius II", "normalized_start": "-0419"}
    ]
  }

Respond in JSON format.
```

---

## Chain and Journey Detection

Beyond individual claims, the extraction pipeline identifies **chains** - sequences of connected events with temporal relationships (see 04-chronology-system.md). Chains are the structural backbone of chronology.

### Chain Detection Prompt

```
You are identifying event chains in a historical text.

SOURCE: {source_title} by {author_name}
SECTION: {structural_reference}

TEXT:
"""
{chunk_text}
"""

PREVIOUSLY EXTRACTED CLAIMS FROM THIS SOURCE:
{previous_claims_summary}

Identify any CHAINS (sequences of connected events) in this text:

1. BIOGRAPHICAL CHAINS: Life events of a person
   - Birth → childhood → reign → death
   - Look for: age mentions, reign lengths, generational relationships

2. CAMPAIGN/JOURNEY CHAINS: Movement through space and time
   - Departure → waypoints → arrival
   - Look for: travel verbs, distance/duration mentions, place sequences

3. DYNASTIC CHAINS: Succession sequences
   - King A → King B → King C
   - Look for: "succeeded by", "son of", reign lengths

4. CAUSAL CHAINS: Events causing other events
   - Battle → defeat → exile → return
   - Look for: "because", "therefore", "as a result"

For each chain found, provide:
- chain_type: biographical, campaign, dynastic, causal, institutional
- subject: Who/what is this chain about?
- links: [{from_event, to_event, delta_value, delta_unit, link_type}]
- is_journey: true if this represents physical movement (for map rendering)
- journey_details: {start_location, end_location, mode} if is_journey

IMPORTANT:
- Preserve RELATIVE time relationships even without absolute dates
- "15 days later", "in his 5th year", "three generations" are valuable data
- Connect to previously extracted claims where possible

Respond in JSON format:
{
  "chains": [
    {
      "chain_type": "...",
      "subject": "...",
      "subject_type": "actor|location|event",
      "links": [...],
      "is_journey": false,
      "raw_duration": "original text mentioning total duration"
    }
  ]
}
```

### Journey Identification

Journeys are chains with `is_journey: true`. They get special treatment for geographic rendering:

```python
def process_journey_chain(chain_data, extraction_set):
    """
    Create a journey chain with geographic waypoints.
    """
    chain = create_event_chain(
        name=f"{chain_data['subject']}'s Journey",
        chain_type=chain_data['chain_type'],
        subject_entity_type=chain_data['subject_type'],
        extraction_set_id=extraction_set.id,

        # Journey-specific fields
        journey_route_type=determine_journey_type(chain_data),  # travel, campaign, pilgrimage, etc.
        journey_start_location_id=resolve_location(chain_data['journey_details']['start']),
        journey_end_location_id=resolve_location(chain_data['journey_details']['end']),
        journey_mode=chain_data['journey_details'].get('mode', 'mixed')
    )

    # Create links with waypoint locations
    for i, link in enumerate(chain_data['links']):
        factoid = get_or_create_factoid(link['to_event'], extraction_set)

        create_chain_link(
            chain_id=chain.id,
            from_factoid_id=get_factoid_id(link['from_event']),
            to_factoid_id=factoid.id,
            sequence_order=i + 1,
            delta_value=link.get('delta_value'),
            delta_unit=link.get('delta_unit'),
            link_type=link['link_type']
        )

    return chain
```

### Chain Examples from Extraction

**Biographical chain from Herodotus:**
```javascript
{
  chain_type: "biographical",
  subject: "Croesus",
  subject_type: "actor",
  links: [
    { from_event: "Croesus becomes king", to_event: "Croesus conquers Ephesus", delta_value: null, link_type: "sequential" },
    { from_event: "Croesus conquers Ephesus", to_event: "Croesus consults Delphi", delta_value: 14, delta_unit: "years", link_type: "sequential" },
    { from_event: "Croesus consults Delphi", to_event: "Croesus attacks Persia", delta_value: null, link_type: "causal" },
    { from_event: "Croesus attacks Persia", to_event: "Croesus defeated at Sardis", delta_value: null, link_type: "sequential" }
  ],
  raw_duration: "reigned for 14 years before his downfall"
}
```

**Journey chain (campaign):**
```javascript
{
  chain_type: "campaign",
  subject: "Xerxes' Invasion",
  subject_type: "event",
  is_journey: true,
  journey_details: {
    start_location: "Sardis",
    end_location: "Athens",
    mode: "mixed"
  },
  links: [
    { from_event: "Army departs Sardis", to_event: "Army crosses Hellespont", delta_value: null, link_type: "sequential" },
    { from_event: "Army crosses Hellespont", to_event: "Army reaches Therma", delta_value: 3, delta_unit: "months", link_type: "sequential" },
    { from_event: "Army reaches Therma", to_event: "Battle of Thermopylae", delta_value: null, link_type: "sequential" },
    { from_event: "Battle of Thermopylae", to_event: "Sack of Athens", delta_value: null, link_type: "sequential" }
  ]
}
```

---

## Environmental Extraction

The pipeline also extracts environmental observations (see 06-environmental-layer.md).

### Environmental Extraction Prompt Addition

Add to the main extraction prompt:

```
ALSO EXTRACT ENVIRONMENTAL OBSERVATIONS:

Look for mentions of:
- Weather: rain, snow, storms, drought, extreme temperatures
- Astronomical: eclipses, comets, unusual celestial events
- Geological: earthquakes, volcanic activity
- Biological: plagues, famines, crop failures
- Hydrological: floods, river changes, droughts

For each environmental observation:
{
  "observation_type": "weather|astronomical|geological|biological|hydrological",
  "observation_subtype": "specific type",
  "description_original": "exact text from source",
  "raw_claimed_date": "temporal reference as stated",
  "location_hint": "where this occurred",
  "intensity": "mild|moderate|severe|extreme",
  "impact": "described consequences"
}

IMPORTANT for astronomical events:
- These may be calculable (eclipses, known comets)
- Capture exact description for later verification
- Note time of day if mentioned
```

### Environmental Processing

```python
def process_environmental_extraction(env_data, chunk, extraction_set):
    """
    Create environmental observation from extraction.
    """
    # Create linked factoid first
    factoid = create_factoid(
        description=env_data['description_original'],
        factoid_type='observation',
        raw_observation=env_data['raw_claimed_date'],
        extraction_set_id=extraction_set.id,
        extraction_location=chunk.structural_reference
    )

    # Create environmental observation
    observation = create_environmental_observation(
        factoid_id=factoid.id,
        source_id=extraction_set.source_id,
        observation_type=env_data['observation_type'],
        observation_subtype=env_data['observation_subtype'],
        description_original=env_data['description_original'],
        raw_claimed_date=env_data['raw_claimed_date'],
        intensity=env_data.get('intensity'),
        location_id=resolve_location(env_data.get('location_hint')),
        impact_description=env_data.get('impact')
    )

    # For astronomical events, trigger calculation check
    if env_data['observation_type'] == 'astronomical':
        trigger_astronomical_verification(observation)

    return observation
```

---

## Data Model

### documents table

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to source entity
    source_id UUID REFERENCES sources(id),
    
    -- Content
    title TEXT NOT NULL,
    author_id UUID REFERENCES actors(id),
    full_text_storage_ref TEXT,
    original_file_storage_ref TEXT,
    
    -- Structure
    structure_type VARCHAR(30),  -- books_chapters, chapters_sections, flat, etc.
    structure_metadata JSONB,
    
    -- Processing status
    total_chunks INTEGER,
    processed_chunks INTEGER DEFAULT 0,
    verified_chunks INTEGER DEFAULT 0,
    published_chunks INTEGER DEFAULT 0,
    
    extraction_status VARCHAR(20) DEFAULT 'pending',
    -- pending, chunking, extracting, extracted, verifying, verified, complete, failed
    
    extraction_model TEXT,
    extraction_started_at TIMESTAMPTZ,
    extraction_completed_at TIMESTAMPTZ,
    
    -- Priority
    priority INTEGER DEFAULT 0,  -- Higher = process first
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### document_chunks table

```sql
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    document_id UUID NOT NULL REFERENCES documents(id),
    chunk_index INTEGER NOT NULL,
    
    -- Content
    content_text TEXT NOT NULL,
    structural_reference TEXT,  -- "Book 1, Chapter 5"
    
    -- Processing
    extraction_status VARCHAR(20) DEFAULT 'pending',
    -- pending, extracting, extracted, verifying, verified, published
    
    extracted_claims_count INTEGER DEFAULT 0,
    verified_claims_count INTEGER DEFAULT 0,
    published_claims_count INTEGER DEFAULT 0,
    
    -- Embedding
    embedding VECTOR(1536),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(document_id, chunk_index)
);
```

### extracted_claims table

```sql
CREATE TABLE extracted_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    chunk_id UUID NOT NULL REFERENCES document_chunks(id),
    
    -- Extracted content
    claim_text TEXT NOT NULL,
    claim_type VARCHAR(30),
    summary TEXT,
    
    -- Attribution
    author_attribution VARCHAR(50),
    attribution_detail TEXT,  -- "the Egyptians say", "I myself saw"
    
    -- Raw extractions (before normalization)
    entities_raw JSONB DEFAULT '[]',
    temporal_markers_raw JSONB DEFAULT '[]',
    
    -- AI confidence
    extraction_confidence DECIMAL(3,2),
    
    -- Normalization results
    entities_normalized JSONB DEFAULT '[]',
    temporal_normalized JSONB DEFAULT '{}',
    
    -- Similar factoids found
    similar_factoid_ids UUID[] DEFAULT '{}',
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    -- pending, reviewed, approved, rejected, flagged, converted
    
    -- Verification
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- Conversion
    converted_to_factoid_id UUID REFERENCES factoids(id),
    converted_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### verification_queue table

```sql
CREATE TABLE verification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    extracted_claim_id UUID NOT NULL REFERENCES extracted_claims(id),
    
    -- Queue management
    priority INTEGER DEFAULT 0,
    assigned_to UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ,
    
    -- Status
    queue_status VARCHAR(20) DEFAULT 'pending',
    -- pending, assigned, in_progress, completed, escalated
    
    -- Escalation
    escalation_reason TEXT,
    escalated_to UUID REFERENCES users(id),
    
    -- Timing
    queued_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
```

---

## Queue Management

### Verification Queue Prioritization

```python
def prioritize_queue():
    """
    Order verification queue by priority factors.
    """
    return VerificationQueue.query()\
        .order_by(
            # Explicit priority
            desc(extracted_claim.chunk.document.priority),
            # Source importance (primary sources first)
            case(source.source_type, {
                'primary': 3,
                'secondary': 2,
                'tertiary': 1
            }),
            # Extraction confidence (review uncertain ones)
            asc(extracted_claim.extraction_confidence),
            # FIFO for ties
            asc(verification_queue.queued_at)
        )
```

### Assignment

```python
def assign_verification(user_id, count=10):
    """
    Assign batch of items to a verifier.
    """
    items = VerificationQueue.query()\
        .filter(queue_status='pending')\
        .order_by(prioritize_queue())\
        .limit(count)\
        .all()
    
    for item in items:
        item.assigned_to = user_id
        item.assigned_at = now()
        item.queue_status = 'assigned'
        item.save()
    
    return items
```

### Escalation

```python
def escalate_verification(item_id, reason):
    """
    Escalate difficult item to expert.
    """
    item = VerificationQueue.get(item_id)
    item.queue_status = 'escalated'
    item.escalation_reason = reason
    item.escalated_to = find_expert_for(item)
    item.save()
    
    notify_expert(item.escalated_to, item)
```

---

## Features

### MVP (Phase 1)

**Document upload**
- Accept text files, basic PDFs
- Manual metadata entry
- Store original + extracted text

**Basic chunking**
- Fixed-size chunks with overlap
- Simple structural detection (chapter markers)

**AI extraction**
- Single extraction prompt
- Basic claim, entity, date extraction
- Confidence scores

**Simple verification**
- List view of extractions
- Approve/reject/edit
- Direct publish

### Phase 2

**Advanced document processing**
- OCR for scanned documents
- Multiple format support (EPUB, HTML, etc.)
- Automatic structural parsing

**Improved extraction**
- Multi-pass extraction (claims, then entities, then dates)
- Entity resolution against database
- Similar factoid detection

**Verification workflow**
- Queue management
- Assignment system
- Escalation paths
- Progress tracking

**Batch operations**
- Process entire documents
- Bulk verification
- Progress dashboard

### Phase 3 (Dream)

**Automated pipeline**
- Scheduled ingestion from sources (Gutenberg, Archive)
- Automatic priority based on source importance
- Self-improving prompts based on verification feedback

**Advanced entity resolution**
- ML-based entity matching
- Disambiguation with context
- Automatic entity creation proposals

**Quality metrics**
- Extraction accuracy tracking
- Model comparison
- Verifier agreement scores

**Parallel processing**
- Distributed extraction
- Multiple AI models for consensus
- High-throughput pipeline

### Source Reader Integration

Extraction sets directly power the Source Reader feature (see 21-source-reader.md):

- **Page-by-page playback**: Extraction location (structural_reference) allows scrubbing through the book
- **Entity tracking**: Extracted actors, locations enter/exit as pages advance
- **Chain visualization**: Journey routes and event sequences animate on map
- **Environmental context**: Weather and astronomical events display during playback
- **Reading companion**: Users follow along with physical books while app shows extracted data

```
EXTRACTION SET → SOURCE READER
─────────────────────────────────────
extraction_set.factoids     → Events on timeline/map
extraction_set.actors       → Character profiles
extraction_set.chains       → Journey routes
extraction_set.environmental → Weather/astronomy visualization
structural_reference        → Page/chapter navigation
```

---

## Document Prioritization

### Priority Factors

```python
def calculate_document_priority(document):
    score = 0
    
    # Source type (primary sources most valuable)
    source_type_scores = {
        'primary': 100,
        'secondary': 50,
        'tertiary': 10
    }
    score += source_type_scores.get(document.source.source_type, 0)
    
    # Source importance (seminal works higher)
    if document.source in SEMINAL_SOURCES:
        score += 50
    
    # User requests
    score += document.user_request_count * 10
    
    # Gap filling (sources for under-documented periods)
    period_coverage = get_period_coverage(document.source.date_describes)
    score += (100 - period_coverage)  # Less coverage = higher priority
    
    # Language (original language higher than translations)
    if document.is_original_language:
        score += 20
    
    return score
```

### Seminal Sources (Example Priority List)

```python
SEMINAL_SOURCES = [
    # Greek
    "Herodotus - Histories",
    "Thucydides - History of the Peloponnesian War",
    "Homer - Iliad",
    "Homer - Odyssey",
    "Plato - Complete Works",
    "Aristotle - Complete Works",
    
    # Roman
    "Julius Caesar - Gallic Wars",
    "Livy - Ab Urbe Condita",
    "Tacitus - Annals",
    "Tacitus - Histories",
    
    # Biblical/Religious
    "Bible - Various translations",
    "Josephus - Antiquities of the Jews",
    "Josephus - Jewish War",
    
    # Egyptian
    "Manetho - Aegyptiaca (fragments)",
    
    # Near Eastern
    "Berossus - Babyloniaca (fragments)",
    
    # Medieval
    "Bede - Ecclesiastical History",
    "Anglo-Saxon Chronicle",
    
    # And many more...
]
```

---

## Error Handling

### Extraction Failures

```python
def handle_extraction_error(chunk, error):
    chunk.extraction_status = 'failed'
    chunk.extraction_error = str(error)
    chunk.save()
    
    # Log for analysis
    log_extraction_error(chunk, error)
    
    # If systematic failure, pause document
    if document_failure_rate(chunk.document) > 0.2:
        chunk.document.extraction_status = 'paused'
        chunk.document.pause_reason = 'High failure rate'
        notify_admin(chunk.document)
```

### Verification Conflicts

```python
def handle_verification_conflict(claim, reviews):
    """
    When multiple reviewers disagree.
    """
    if agreement_rate(reviews) < 0.7:
        # Escalate to expert
        escalate_to_expert(claim, 'Reviewer disagreement')
    else:
        # Go with majority
        majority_decision = get_majority(reviews)
        apply_decision(claim, majority_decision)
```

---

## Open Questions

- **Chunk overlap**: How much overlap between chunks to avoid splitting claims? (Currently using 200 chars)

- **Multi-language**: How to handle sources in original languages? Extract from original or translation?

- **Extraction models**: Which AI model(s) to use? Single model or ensemble for consensus?

- **Verification threshold**: How many verifiers needed per extraction? (Currently 1, could require 2 for high-value sources)

- **Confidence calibration**: How to calibrate AI confidence scores against actual accuracy?

---

## Dependencies

- **02-data-model.md**: Schema for documents, chunks, extracted_claims, extraction_sets
- **03-source-system.md**: Source records to link extractions to
- **04-chronology-system.md**: Chain structures for temporal relationships
- **05-geographic-system.md**: Location resolution for journey waypoints
- **06-environmental-layer.md**: Environmental observation extraction
- **08-bias-detection.md**: Author attribution handling
- **21-source-reader.md**: Extraction sets power the Source Reader feature

---

## Technical Notes

### AI Model Selection

Options:
- **Claude (Anthropic)**: Strong reasoning, good at structured extraction
- **GPT-4 (OpenAI)**: Widely available, good general performance
- **Open models (Llama, Mistral)**: Self-hostable, cost control

Recommendation: Start with Claude/GPT-4 for quality, consider open models for scale.

### Embedding Models

For semantic search and similar factoid detection:
- **OpenAI text-embedding-ada-002**: 1536 dimensions, good quality
- **Cohere embed**: Alternative, good multilingual
- **Open embeddings (e5, bge)**: Self-hostable

### Processing Infrastructure

For scale:
- Queue system (Redis, RabbitMQ, or Supabase Edge Functions)
- Worker processes for extraction
- Rate limiting for AI APIs
- Progress tracking and resumability

---

## Summary

The extraction pipeline is the engine that transforms raw historical texts into structured, searchable, connectable data. By maintaining the distinction between "source claims" and "historical facts," preserving author attribution, and requiring human verification, we build a database that is both rich and epistemically honest.

The source said it. Whether it happened is a different question — one the rest of the system helps answer.
