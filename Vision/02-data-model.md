# Data Model

## Overview

This document defines the database schema implementing the core concepts. The schema is designed for PostgreSQL with pgvector extension, suitable for deployment on Supabase.

**Design principles:**
- Frame-dependent dating via placements (no dates stored directly on factoids)
- Raw observations stored separately from interpretations (extensions)
- Source linkage on all claims
- Soft deletes (nothing truly deleted)
- Full audit trail
- Vector embeddings for semantic search
- Graph-friendly structure for relationship traversal

---

## Core Tables

### factoids

The central table storing all claims. Note: temporal placement is handled via `factoid_placements` table, not stored directly on factoids.

```sql
CREATE TABLE factoids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Content
    description TEXT NOT NULL,
    summary TEXT, -- One-line summary
    factoid_type VARCHAR(50) NOT NULL, -- event, relationship, description, claim, observation

    -- Raw observation (frame-independent evidence)
    raw_observation TEXT, -- What do we actually see/know? e.g., "Coin inscribed j684"
    raw_observation_type VARCHAR(30), -- inscription, physical_test, document_text, artifact, witness

    -- Epistemological layer
    layer VARCHAR(20) NOT NULL DEFAULT 'attested', -- documented, attested, traditional, theoretical, speculative

    -- Confidence (calculated, cached)
    community_confidence DECIMAL(3,2),
    core_confidence DECIMAL(3,2),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, sourced, verified, disputed, rejected

    -- Namespace
    namespace_id UUID REFERENCES namespaces(id),

    -- Extraction (if this factoid was extracted from a source)
    extraction_set_id UUID REFERENCES extraction_sets(id),
    extraction_location TEXT, -- "Book II, Chapter 5, Paragraph 3"
    extraction_confidence DECIMAL(3,2), -- AI confidence in extraction accuracy
    extraction_verified BOOLEAN DEFAULT FALSE, -- Human reviewed?

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ, -- soft delete

    -- Vector embedding for semantic search
    embedding VECTOR(1536)
);

CREATE INDEX idx_factoids_layer ON factoids(layer);
CREATE INDEX idx_factoids_status ON factoids(status);
CREATE INDEX idx_factoids_namespace ON factoids(namespace_id);
CREATE INDEX idx_factoids_extraction_set ON factoids(extraction_set_id);
CREATE INDEX idx_factoids_embedding ON factoids USING ivfflat (embedding vector_cosine_ops);
```

---

### factoid_extensions

Interpretive layers attached to factoids. Extensions capture different interpretations of raw observations.

```sql
CREATE TABLE factoid_extensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    factoid_id UUID NOT NULL REFERENCES factoids(id),

    -- Extension type
    extension_type VARCHAR(30) NOT NULL, -- dating_interpretation, reading_variant, attribution, provenance, translation

    -- Content
    title VARCHAR(200), -- Short label, e.g., "j = Jesus interpretation"
    content TEXT NOT NULL, -- The interpretation itself
    reasoning TEXT, -- Why this interpretation is proposed

    -- Sources supporting this interpretation
    source_ids UUID[] DEFAULT '{}',

    -- Adoption
    is_contested BOOLEAN DEFAULT FALSE,
    counter_extension_ids UUID[] DEFAULT '{}', -- Extensions that contest this one

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Vector embedding for semantic search
    embedding VECTOR(1536)
);

CREATE INDEX idx_extensions_factoid ON factoid_extensions(factoid_id);
CREATE INDEX idx_extensions_type ON factoid_extensions(extension_type);
CREATE INDEX idx_extensions_contested ON factoid_extensions(is_contested);
```

---

### factoid_placements

Frame-dependent temporal positioning. A factoid's date depends on which frame and interpretation you're using.

```sql
CREATE TABLE factoid_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    factoid_id UUID NOT NULL REFERENCES factoids(id),
    frame_id UUID NOT NULL REFERENCES reference_frames(id),

    -- Which interpretation this placement is based on (optional)
    extension_id UUID REFERENCES factoid_extensions(id),

    -- Temporal position in this frame
    date_start DATE,
    date_end DATE,
    date_precision VARCHAR(20), -- exact, year, decade, century, millennium

    -- Confidence in this specific placement
    placement_confidence DECIMAL(3,2), -- 0.00 to 1.00

    -- Reasoning
    reasoning TEXT, -- Why this date in this frame

    -- Who placed it
    placed_by UUID REFERENCES users(id),
    placed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Is this an official frame placement or user exploration?
    placement_type VARCHAR(20) DEFAULT 'user', -- system, community, user

    -- Metadata
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_placements_factoid ON factoid_placements(factoid_id);
CREATE INDEX idx_placements_frame ON factoid_placements(frame_id);
CREATE INDEX idx_placements_dates ON factoid_placements(date_start, date_end);
CREATE INDEX idx_placements_type ON factoid_placements(placement_type);

-- Allow multiple placements per factoid per frame (different users/interpretations)
-- but track uniqueness for system/community placements
CREATE UNIQUE INDEX idx_placements_system_unique
    ON factoid_placements(factoid_id, frame_id, extension_id)
    WHERE placement_type IN ('system', 'community') AND deleted_at IS NULL;
```

---

### sources

Documents, accounts, and evidence origins. Note: composition dating is handled via factoid_placements for associated factoids.

```sql
CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    title TEXT NOT NULL,
    author_id UUID REFERENCES actors(id), -- who created this

    -- Classification
    source_type VARCHAR(30) NOT NULL, -- primary, secondary, tertiary
    genre VARCHAR(50), -- history, chronicle, propaganda, memoir, administrative, religious, epic, legal, private

    -- Raw dating evidence (frame-independent)
    raw_dating_evidence TEXT, -- What we observe about when this was composed
    raw_period_covered TEXT, -- What period does the source claim to describe

    -- Characteristics (see 08-bias-detection.md for full treatment)
    author_stake VARCHAR(20), -- none, low, medium, high, extreme
    intended_audience VARCHAR(30), -- public, elite, institutional, private, posterity
    survival_path VARCHAR(30), -- continuous, rediscovered, single_copy, institutional, hostile

    -- Language and editions
    original_language VARCHAR(50),
    translation_id UUID REFERENCES sources(id), -- if this is a translation
    edition_notes TEXT,

    -- Physical/digital location
    archive_location TEXT,
    digital_url TEXT,
    full_text_storage_ref TEXT, -- object storage reference

    -- Processing status
    extraction_status VARCHAR(20) DEFAULT 'pending', -- pending, partial, complete
    extraction_model TEXT, -- which AI model extracted

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Vector embedding
    embedding VECTOR(1536)
);

CREATE INDEX idx_sources_type ON sources(source_type);
CREATE INDEX idx_sources_genre ON sources(genre);
CREATE INDEX idx_sources_author ON sources(author_id);
```

---

### source_citations

Tracks which sources cite which other sources (the source tree).

```sql
CREATE TABLE source_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    citing_source_id UUID NOT NULL REFERENCES sources(id),
    cited_source_id UUID NOT NULL REFERENCES sources(id),
    
    citation_type VARCHAR(30) NOT NULL, -- direct_quote, paraphrase, refers_to, based_on, aware_of
    
    -- Location in citing source
    page_reference TEXT,
    section_reference TEXT,
    quote_excerpt TEXT,
    
    -- Independence assessment
    independence_verified BOOLEAN DEFAULT FALSE,
    independence_score DECIMAL(3,2), -- 0.00 to 1.00
    independence_notes TEXT,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(citing_source_id, cited_source_id)
);

CREATE INDEX idx_citations_citing ON source_citations(citing_source_id);
CREATE INDEX idx_citations_cited ON source_citations(cited_source_id);
```

---

### factoid_sources

Links factoids to their supporting sources (many-to-many).

```sql
CREATE TABLE factoid_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    factoid_id UUID NOT NULL REFERENCES factoids(id),
    source_id UUID NOT NULL REFERENCES sources(id),
    
    -- How this source relates to the factoid
    relationship VARCHAR(30) NOT NULL, -- supports, contradicts, mentions, primary_source
    
    -- Location in source
    page_reference TEXT,
    section_reference TEXT,
    relevant_excerpt TEXT,
    
    -- Author's attribution (what did the source author claim as their basis)
    author_attribution VARCHAR(50), -- i_saw, priests_said, greeks_say, persians_say, it_is_said, unattributed
    
    -- Confidence contribution
    confidence_weight DECIMAL(3,2) DEFAULT 1.00,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    
    UNIQUE(factoid_id, source_id)
);

CREATE INDEX idx_factoid_sources_factoid ON factoid_sources(factoid_id);
CREATE INDEX idx_factoid_sources_source ON factoid_sources(source_id);
```

---

### actors

People, families, institutions, groups. Note: temporal bounds are handled via factoid_placements for associated factoids (birth, death, founding, etc.).

```sql
CREATE TABLE actors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name_primary TEXT NOT NULL,
    name_aliases JSONB DEFAULT '[]', -- [{name, period_start, period_end, context}]

    -- Classification
    actor_type VARCHAR(30) NOT NULL, -- person, family, institution, group
    actor_subtype VARCHAR(50), -- historical_figure, legendary, author, dynasty, government, etc.

    -- Raw temporal evidence (frame-independent)
    raw_temporal_evidence TEXT, -- What we actually know, e.g., "Inscription says 'in the 3rd year of King X'"

    -- Description
    description TEXT,

    -- Bias tracking (for authors)
    known_biases TEXT,
    political_position TEXT,
    patron_or_employer TEXT,

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Vector embedding
    embedding VECTOR(1536)
);

CREATE INDEX idx_actors_type ON actors(actor_type);
CREATE INDEX idx_actors_name ON actors USING gin(to_tsvector('english', name_primary));
```

---

### actor_relationships

Relationships between actors.

```sql
CREATE TABLE actor_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    from_actor_id UUID NOT NULL REFERENCES actors(id),
    to_actor_id UUID NOT NULL REFERENCES actors(id),
    
    relationship_type VARCHAR(50) NOT NULL, 
    -- parent_of, child_of, spouse_of, sibling_of, 
    -- ruled, served, employed_by, member_of,
    -- allied_with, opposed_to, influenced_by, succeeded
    
    -- Temporal bounds
    date_start DATE,
    date_end DATE,
    
    -- Evidence
    source_ids UUID[] DEFAULT '{}',
    confidence DECIMAL(3,2),
    notes TEXT,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_actor_rel_from ON actor_relationships(from_actor_id);
CREATE INDEX idx_actor_rel_to ON actor_relationships(to_actor_id);
CREATE INDEX idx_actor_rel_type ON actor_relationships(relationship_type);
```

---

### artifacts

Physical evidence. Note: dating is handled via factoid_placements for associated factoids.

```sql
CREATE TABLE artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name TEXT NOT NULL,
    artifact_type VARCHAR(30) NOT NULL, -- structure, object, document, remains
    artifact_subtype VARCHAR(50),

    -- Location
    location_current_id UUID REFERENCES locations(id),
    location_original_id UUID REFERENCES locations(id),
    location_current_detail TEXT, -- museum name, archive, etc.

    -- Raw dating evidence (frame-independent)
    raw_dating_evidence TEXT, -- What we observe: inscriptions, physical tests, context
    dating_methods_applied JSONB DEFAULT '[]', -- [{method, result, margin, lab, date}]

    -- Physical description
    description TEXT,
    materials TEXT,
    dimensions TEXT,
    condition TEXT,

    -- Anomalies
    anomalies_noted TEXT,

    -- Status
    current_status VARCHAR(30), -- extant, destroyed, missing, restricted_access

    -- Documentation
    images JSONB DEFAULT '[]', -- [{storage_ref, caption, date_taken}]
    examination_history JSONB DEFAULT '[]', -- [{date, examiner, method, findings}]

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Vector embedding
    embedding VECTOR(1536)
);

CREATE INDEX idx_artifacts_type ON artifacts(artifact_type);
CREATE INDEX idx_artifacts_location ON artifacts(location_current_id);
```

---

### locations

Geographic entities.

```sql
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    name_modern TEXT,
    name_historical JSONB DEFAULT '[]', -- [{name, period_start, period_end, source_id}]
    
    -- Classification
    location_type VARCHAR(30) NOT NULL, -- point, area, linear
    location_subtype VARCHAR(50), -- city, site, region, river, road, etc.
    
    -- Coordinates (flat plane reference system)
    coordinate_x DECIMAL(12,6), -- longitude or x
    coordinate_y DECIMAL(12,6), -- latitude or y
    coordinate_system VARCHAR(30) DEFAULT 'wgs84', -- or 'flat_reference', 'relative'
    uncertainty_radius_km DECIMAL(10,2),
    
    -- For areas
    boundary_geojson JSONB,
    
    -- Temporal changes
    location_changes JSONB DEFAULT '[]', -- [{period, description, coordinates}]
    
    -- Environment
    climate_notes TEXT,
    terrain_notes TEXT,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Vector embedding
    embedding VECTOR(1536)
);

CREATE INDEX idx_locations_coords ON locations(coordinate_x, coordinate_y);
CREATE INDEX idx_locations_type ON locations(location_type);
```

---

### location_interpretations

Contested or uncertain location identifications. Like factoid extensions, the same ancient place can be identified with different modern sites by different researchers.

```sql
CREATE TABLE location_interpretations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    location_id UUID NOT NULL REFERENCES locations(id),

    -- Interpretation details
    interpretation_name VARCHAR(200) NOT NULL,  -- "Traditional identification", "Revised by Smith 2015"

    -- Proposed coordinates
    coordinate_x DECIMAL(12,6),
    coordinate_y DECIMAL(12,6),
    coordinate_system VARCHAR(30) DEFAULT 'wgs84',
    uncertainty_radius_km DECIMAL(10,2),
    boundary_geojson JSONB,  -- for areas

    -- Evidence and reasoning
    reasoning TEXT,
    evidence_summary TEXT,
    source_ids UUID[] DEFAULT '{}',

    -- Confidence and status
    confidence_level VARCHAR(20),  -- certain, probable, possible, speculative
    is_mainstream BOOLEAN DEFAULT FALSE,
    is_contested BOOLEAN DEFAULT FALSE,

    -- Metadata
    proposed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_loc_interp_location ON location_interpretations(location_id);
CREATE INDEX idx_loc_interp_mainstream ON location_interpretations(is_mainstream);
CREATE INDEX idx_loc_interp_confidence ON location_interpretations(confidence_level);
```

---

### connections

General-purpose relationship table between any entities.

```sql
CREATE TABLE connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Endpoints (polymorphic)
    from_entity_type VARCHAR(30) NOT NULL, -- factoid, actor, artifact, location, source
    from_entity_id UUID NOT NULL,
    to_entity_type VARCHAR(30) NOT NULL,
    to_entity_id UUID NOT NULL,
    
    -- Relationship
    connection_type VARCHAR(50) NOT NULL,
    -- temporal: preceded_by, followed_by, contemporary_with, during, caused
    -- spatial: located_at, traveled_to, near, part_of
    -- evidential: supports, contradicts, cites, corroborates, resembles
    -- creative: built, destroyed, wrote, owned, discovered
    
    -- Temporal delta (for relational time)
    delta_value INTEGER,
    delta_unit VARCHAR(20), -- days, years, generations, reigns
    delta_confidence VARCHAR(20), -- exact, approximate, estimated
    
    -- Evidence
    source_ids UUID[] DEFAULT '{}',
    confidence DECIMAL(3,2),
    notes TEXT,
    
    -- Namespace
    namespace_id UUID REFERENCES namespaces(id),
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_connections_from ON connections(from_entity_type, from_entity_id);
CREATE INDEX idx_connections_to ON connections(to_entity_type, to_entity_id);
CREATE INDEX idx_connections_type ON connections(connection_type);
```

---

## Chronology Tables

### anchors

Dating reference points.

```sql
CREATE TABLE anchors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- What is this anchor
    factoid_id UUID REFERENCES factoids(id),
    description TEXT NOT NULL,
    
    -- Type and reliability
    anchor_type VARCHAR(30) NOT NULL, -- astronomical, dendro, radiometric, documentary, traditional
    confidence DECIMAL(3,2),
    
    -- The date this anchor provides
    anchor_date DATE NOT NULL,
    anchor_date_precision VARCHAR(20),
    uncertainty_days INTEGER,
    
    -- Methodology
    methodology TEXT,
    challenges TEXT, -- known problems with this anchor
    
    -- Source
    source_id UUID REFERENCES sources(id),
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_anchors_type ON anchors(anchor_type);
CREATE INDEX idx_anchors_factoid ON anchors(factoid_id);
```

---

### event_chains

Sequences of connected events with known temporal relationships. Chains are the structural backbone of chronology.

```sql
CREATE TABLE event_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Classification
    chain_type VARCHAR(30) NOT NULL, -- biographical, dynastic, campaign, institutional, genealogical

    -- Subject (what/who this chain is about)
    subject_entity_type VARCHAR(30), -- actor, location, artifact, event
    subject_entity_id UUID,

    -- Calculated span (cached, updated when links change)
    total_duration_value DECIMAL(10,2),
    total_duration_unit VARCHAR(20), -- days, months, years, generations
    duration_confidence DECIMAL(3,2), -- 0-1, based on weakest link

    -- Anchor summary (cached)
    anchor_count INTEGER DEFAULT 0,
    strongest_anchor_id UUID REFERENCES anchors(id),
    is_anchored BOOLEAN DEFAULT FALSE,

    -- Extraction (if chain was extracted from a source)
    extraction_set_id UUID REFERENCES extraction_sets(id),

    -- Journey rendering (for chains representing physical movement)
    journey_route_type VARCHAR(30),  -- NULL, 'travel', 'campaign', 'migration', 'trade_route', 'pilgrimage'
    journey_start_location_id UUID REFERENCES locations(id),
    journey_end_location_id UUID REFERENCES locations(id),
    journey_mode VARCHAR(30),  -- 'foot', 'horse', 'ship', 'mixed'

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_chains_type ON event_chains(chain_type);
CREATE INDEX idx_chains_subject ON event_chains(subject_entity_type, subject_entity_id);
CREATE INDEX idx_chains_anchored ON event_chains(is_anchored);
CREATE INDEX idx_chains_extraction ON event_chains(extraction_set_id);
CREATE INDEX idx_chains_journey ON event_chains(journey_route_type) WHERE journey_route_type IS NOT NULL;
```

---

### chain_links

Temporal connections between events within a chain.

```sql
CREATE TABLE chain_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Which chain this link belongs to
    chain_id UUID NOT NULL REFERENCES event_chains(id),

    -- Events being linked
    from_factoid_id UUID NOT NULL REFERENCES factoids(id),
    to_factoid_id UUID NOT NULL REFERENCES factoids(id),

    -- Sequence within chain
    sequence_order INTEGER NOT NULL, -- 1, 2, 3...

    -- Temporal delta
    delta_value DECIMAL(10,2), -- NULL if unknown
    delta_unit VARCHAR(20), -- days, months, years, generations, reigns
    delta_confidence VARCHAR(20), -- exact, approximate, estimated, unknown
    delta_direction VARCHAR(10) DEFAULT 'after', -- after, before, during

    -- Link type
    link_type VARCHAR(30) NOT NULL, -- sequential, causal, genealogical, duration, concurrent

    -- Source for this delta
    source_id UUID REFERENCES sources(id),
    source_excerpt TEXT, -- "fifteen days march"

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(chain_id, sequence_order)
);

CREATE INDEX idx_chain_links_chain ON chain_links(chain_id);
CREATE INDEX idx_chain_links_from ON chain_links(from_factoid_id);
CREATE INDEX idx_chain_links_to ON chain_links(to_factoid_id);
CREATE INDEX idx_chain_links_sequence ON chain_links(chain_id, sequence_order);
```

---

### chain_connections

Connections between different chains (branching, merging, synchronization).

```sql
CREATE TABLE chain_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Chains being connected
    from_chain_id UUID NOT NULL REFERENCES event_chains(id),
    to_chain_id UUID NOT NULL REFERENCES event_chains(id),

    -- Connection point (specific events where chains touch)
    from_factoid_id UUID REFERENCES factoids(id),
    to_factoid_id UUID REFERENCES factoids(id),

    -- Connection type
    connection_type VARCHAR(30) NOT NULL,
    -- branches_to: from_chain spawns to_chain (e.g., death → successor chains)
    -- merges_into: from_chain merges into to_chain (e.g., two armies join)
    -- synchronizes: chains touch at same event (e.g., battle between two kingdoms)
    -- continues_as: from_chain becomes to_chain (e.g., republic → empire)

    -- Synchronization confidence
    sync_confidence DECIMAL(3,2), -- how confident are we these events align?
    sync_disputed BOOLEAN DEFAULT FALSE,

    -- Source for this connection
    source_id UUID REFERENCES sources(id),
    reasoning TEXT,

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chain_conn_from ON chain_connections(from_chain_id);
CREATE INDEX idx_chain_conn_to ON chain_connections(to_chain_id);
CREATE INDEX idx_chain_conn_type ON chain_connections(connection_type);
```

---

### reference_frames

Chronological/interpretive frameworks that define how dates are calculated and which interpretations are adopted. Frames affect WHERE factoids land in time.

```sql
CREATE TABLE reference_frames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE, -- URL-friendly identifier
    description TEXT,

    -- Frame type
    frame_type VARCHAR(30) NOT NULL DEFAULT 'user', -- system, community, user
    -- system: Mainstream Academic, Astronomical Anchors, Raw Evidence, etc.
    -- community: Fomenko, Newton's Chronology, Biblical, etc.
    -- user: Personal exploration frames

    -- Configuration
    calendar_system VARCHAR(30) DEFAULT 'gregorian', -- gregorian, julian, astronomical
    epoch_offset_years INTEGER DEFAULT 0, -- years to add/subtract

    -- Anchor trust settings
    trust_astronomical BOOLEAN DEFAULT TRUE,
    trust_dendro BOOLEAN DEFAULT TRUE,
    trust_radiometric BOOLEAN DEFAULT TRUE,
    trust_documentary BOOLEAN DEFAULT FALSE,
    trust_traditional BOOLEAN DEFAULT FALSE,

    -- Custom anchor overrides
    anchor_overrides JSONB DEFAULT '{}', -- {anchor_id: {trust_level, adjustment}}

    -- Extension adoption (which interpretations this frame accepts)
    adopted_extension_ids UUID[] DEFAULT '{}', -- Extensions this frame adopts globally

    -- Inheritance (frame can build on another)
    parent_frame_id UUID REFERENCES reference_frames(id),

    -- Visibility
    is_public BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_frames_type ON reference_frames(frame_type);
CREATE INDEX idx_frames_public ON reference_frames(is_public);
CREATE INDEX idx_frames_creator ON reference_frames(created_by);
CREATE INDEX idx_frames_parent ON reference_frames(parent_frame_id);

-- Seed system frames
INSERT INTO reference_frames (name, slug, description, frame_type, trust_documentary, trust_traditional) VALUES
('Mainstream Academic', 'mainstream', 'Conventional scholarly chronology', 'system', TRUE, TRUE),
('Astronomical Anchors', 'astronomical', 'Only trusts calculable astronomical events', 'system', FALSE, FALSE),
('Raw Evidence', 'raw-evidence', 'Prioritizes physical dating methods (dendro, C14, ice cores)', 'system', FALSE, FALSE),
('Fomenko New Chronology', 'fomenko', 'Applies New Chronology compression', 'community', FALSE, FALSE),
('Newton Chronology', 'newton', 'Isaac Newton''s revised ancient dating', 'community', FALSE, FALSE),
('Biblical Timeline', 'biblical', 'Events anchored to biblical chronology', 'community', TRUE, TRUE);
```

---

### frame_extension_adoption

Tracks which extensions are adopted by which frames (for complex adoption rules beyond the simple array).

```sql
CREATE TABLE frame_extension_adoption (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    frame_id UUID NOT NULL REFERENCES reference_frames(id),
    extension_id UUID NOT NULL REFERENCES factoid_extensions(id),

    -- Adoption status
    adoption_status VARCHAR(20) DEFAULT 'adopted', -- adopted, rejected, contested
    adoption_reasoning TEXT,

    -- Metadata
    adopted_by UUID REFERENCES users(id),
    adopted_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(frame_id, extension_id)
);

CREATE INDEX idx_frame_ext_frame ON frame_extension_adoption(frame_id);
CREATE INDEX idx_frame_ext_extension ON frame_extension_adoption(extension_id);
```

---

### lenses

View configurations that define what subset of data you're looking at. Lenses affect WHAT you see (filters, scope), while frames affect WHERE things land (chronology).

```sql
CREATE TABLE lenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Owner
    created_by UUID REFERENCES users(id),

    -- Frame selection (which frame(s) to view through)
    frame_ids UUID[] DEFAULT '{}', -- Can layer multiple frames
    primary_frame_id UUID REFERENCES reference_frames(id), -- Main frame for display

    -- Temporal scope
    time_start DATE,
    time_end DATE,

    -- Geographic scope
    location_ids UUID[] DEFAULT '{}', -- Locations to include
    geographic_bounds JSONB, -- {min_lat, max_lat, min_lng, max_lng} or GeoJSON

    -- Factoid filters
    layer_filter VARCHAR(20)[], -- Which layers to include
    namespace_ids UUID[] DEFAULT '{}', -- Which namespaces to include
    tag_include TEXT[] DEFAULT '{}',
    tag_exclude TEXT[] DEFAULT '{}',

    -- Specific selections
    pinned_factoid_ids UUID[] DEFAULT '{}', -- Always show these
    excluded_factoid_ids UUID[] DEFAULT '{}', -- Never show these

    -- Display options
    display_options JSONB DEFAULT '{}', -- {show_sources, show_confidence, show_connections, etc.}

    -- Sharing
    is_public BOOLEAN DEFAULT FALSE,
    is_forkable BOOLEAN DEFAULT TRUE, -- Can others copy and modify?

    -- Usage tracking
    view_count INTEGER DEFAULT 0,
    fork_count INTEGER DEFAULT 0,
    forked_from_id UUID REFERENCES lenses(id),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_lenses_creator ON lenses(created_by);
CREATE INDEX idx_lenses_public ON lenses(is_public);
CREATE INDEX idx_lenses_primary_frame ON lenses(primary_frame_id);
```

---

### calendar_systems

Calendar conversion support.

```sql
CREATE TABLE calendar_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    
    -- Conversion parameters
    epoch_julian_day DECIMAL(15,5), -- reference point in Julian Day Number
    conversion_algorithm TEXT, -- or reference to code
    
    -- Usage
    used_by_cultures TEXT,
    period_of_use TEXT
);

-- Seed with common calendars
INSERT INTO calendar_systems (name, description) VALUES
('gregorian', 'Modern Western calendar'),
('julian', 'Roman calendar before Gregorian reform'),
('byzantine', 'Eastern Roman calendar, year from creation'),
('islamic', 'Hijri calendar'),
('hebrew', 'Jewish calendar'),
('chinese', 'Traditional Chinese calendar'),
('astronomical', 'Julian Day Number system');
```

---

## Environmental Tables

### environmental_observations

Weather, astronomical, geological data from sources. Note: claimed dates are frame-dependent via placements, but calculated astronomical dates are frame-independent hard anchors.

```sql
CREATE TABLE environmental_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Link to source
    factoid_id UUID REFERENCES factoids(id),
    source_id UUID REFERENCES sources(id),

    -- Classification
    observation_type VARCHAR(30) NOT NULL,
    -- weather, astronomical, geological, hydrological, biological, climate_pattern

    observation_subtype VARCHAR(50),
    -- weather: rain, snow, wind, temperature, fog
    -- astronomical: solar_eclipse, lunar_eclipse, comet, meteor, conjunction
    -- geological: earthquake, volcanic, landslide
    -- hydrological: flood, drought, river_level
    -- biological: plague, famine, crop_failure

    -- Description
    description_original TEXT, -- exact text from source
    description_normalized TEXT, -- standardized description

    -- Raw temporal evidence from source (frame-independent)
    raw_claimed_date TEXT, -- What the source says: "in the 3rd year of King X"

    -- Characteristics
    intensity VARCHAR(20), -- severe, moderate, mild
    duration_value INTEGER,
    duration_unit VARCHAR(20), -- hours, days, months, years

    -- Location
    location_id UUID REFERENCES locations(id),

    -- For astronomical events (calculable - hard anchor)
    calculated_date DATE, -- Scientifically calculated date (frame-independent)
    calculation_method TEXT, -- How it was calculated
    calculation_candidates JSONB DEFAULT '[]', -- [{date, confidence, notes}] for ambiguous cases
    is_hard_anchor BOOLEAN DEFAULT FALSE, -- Can this serve as an anchor?

    -- Impact
    impact_description TEXT,

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_env_obs_type ON environmental_observations(observation_type);
CREATE INDEX idx_env_obs_location ON environmental_observations(location_id);
CREATE INDEX idx_env_obs_calculated ON environmental_observations(calculated_date);
CREATE INDEX idx_env_obs_anchor ON environmental_observations(is_hard_anchor);
```

---

### natural_disasters

Major environmental events with multiple source attestations. These aggregate individual observations into coherent events.

```sql
CREATE TABLE natural_disasters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name TEXT,  -- "536 CE Volcanic Winter", "Antioch Earthquake 526 CE"
    disaster_type VARCHAR(30) NOT NULL,
    -- volcanic, earthquake, tsunami, flood, drought, famine, plague, climate_event

    -- Raw temporal evidence (frame-independent)
    raw_date_evidence TEXT,  -- "Multiple sources place this in the reign of Justinian"
    duration_description TEXT,  -- "lasted 18 months", "several years of crop failures"

    -- For physically datable disasters (ice cores, dendro, etc.)
    physical_date_start DATE,  -- From physical evidence, frame-independent
    physical_date_end DATE,
    physical_dating_method TEXT,  -- "ice core sulfate spike", "dendrochronology"
    physical_dating_confidence DECIMAL(3,2),

    -- Scope
    locations_affected UUID[] DEFAULT '{}',
    area_affected_description TEXT,

    -- Impact
    estimated_deaths TEXT,
    economic_impact TEXT,
    historical_significance TEXT,

    -- Evidence
    observation_ids UUID[] DEFAULT '{}',  -- Link to individual observations
    physical_evidence JSONB DEFAULT '[]',
    -- [{type: "ice_core", source: "GISP2", finding: "sulfate spike", correlation: "strong"}]

    -- Analysis
    proposed_cause TEXT,
    confidence DECIMAL(3,2),

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_disasters_type ON natural_disasters(disaster_type);
CREATE INDEX idx_disasters_physical_date ON natural_disasters(physical_date_start);
```

---

## Bias Detection Tables

### narrative_gaps

Tracks systematic absences in the historical record - whose voices are missing and why.

```sql
CREATE TABLE narrative_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- What's missing
    missing_perspective TEXT NOT NULL,
    -- "Gallic accounts of Roman conquest", "Female perspectives on Athenian society"

    -- Period description (raw, frame-independent)
    period_description TEXT,  -- "During the Gallic Wars", "Classical Athens"
    geographic_scope TEXT,

    -- Related entities
    related_event_ids UUID[] DEFAULT '{}',
    related_actor_ids UUID[] DEFAULT '{}',
    related_location_ids UUID[] DEFAULT '{}',

    -- Why it's missing
    gap_reason VARCHAR(50),  -- destroyed, never_written, suppressed, not_preserved, unknown
    gap_explanation TEXT,

    -- Evidence for the gap
    evidence_for_gap TEXT,
    evidence_source_ids UUID[] DEFAULT '{}',

    -- What we do have instead
    surviving_perspectives TEXT[],
    surviving_source_ids UUID[] DEFAULT '{}',

    -- Impact on interpretation
    interpretation_impact TEXT,

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gaps_reason ON narrative_gaps(gap_reason);
```

---

### source_bias_evaluations

Frame-dependent bias assessments. Different frames may evaluate the same source's bias differently.

```sql
CREATE TABLE source_bias_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    source_id UUID NOT NULL REFERENCES sources(id),
    frame_id UUID REFERENCES reference_frames(id),  -- NULL = universal evaluation

    -- Bias assessment for this frame
    stake_level VARCHAR(20),  -- none, low, medium, high, extreme
    genre_classification VARCHAR(30),
    bias_notes TEXT,
    trust_adjustment DECIMAL(3,2),  -- Confidence adjustment factor

    -- Frame-specific reasoning
    evaluation_reasoning TEXT,

    -- Metadata
    evaluated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bias_eval_source ON source_bias_evaluations(source_id);
CREATE INDEX idx_bias_eval_frame ON source_bias_evaluations(frame_id);
CREATE UNIQUE INDEX idx_bias_eval_unique ON source_bias_evaluations(source_id, frame_id);
```

---

## Namespace and Community Tables

### namespaces

Community workspaces.

```sql
CREATE TABLE namespaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    
    -- Type
    namespace_type VARCHAR(30) NOT NULL, -- core, community, personal
    
    -- Governance
    owner_id UUID REFERENCES users(id),
    moderator_ids UUID[] DEFAULT '{}',
    
    -- Settings
    is_public BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT FALSE, -- for new members
    contribution_guidelines TEXT,
    
    -- Statistics (cached)
    member_count INTEGER DEFAULT 0,
    factoid_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_namespaces_type ON namespaces(namespace_type);
CREATE INDEX idx_namespaces_public ON namespaces(is_public);
```

---

### namespace_memberships

User membership in namespaces.

```sql
CREATE TABLE namespace_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    namespace_id UUID NOT NULL REFERENCES namespaces(id),
    user_id UUID NOT NULL REFERENCES users(id),
    
    role VARCHAR(20) NOT NULL DEFAULT 'member', -- owner, moderator, member
    
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(namespace_id, user_id)
);

CREATE INDEX idx_ns_membership_user ON namespace_memberships(user_id);
CREATE INDEX idx_ns_membership_namespace ON namespace_memberships(namespace_id);
```

---

## User and Contribution Tables

### users

User accounts.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Auth (handled by Supabase Auth, this links to it)
    auth_id UUID UNIQUE, -- Supabase auth.users.id
    
    -- Profile
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    
    -- Preferences
    default_frame_id UUID REFERENCES reference_frames(id),
    active_namespace_ids UUID[] DEFAULT '{}',
    
    -- Reputation (cached calculations)
    contribution_count INTEGER DEFAULT 0,
    verification_count INTEGER DEFAULT 0,
    reputation_score DECIMAL(10,2) DEFAULT 0,
    
    -- Roles
    is_admin BOOLEAN DEFAULT FALSE,
    is_verified_researcher BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_reputation ON users(reputation_score DESC);
```

---

### contributions

Audit log of all user contributions.

```sql
CREATE TABLE contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- What was contributed
    entity_type VARCHAR(30) NOT NULL, -- factoid, source, actor, artifact, location, connection
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- create, update, verify, challenge, delete
    
    -- Details
    changes JSONB, -- what specifically changed
    notes TEXT,
    
    -- Impact (for gamification)
    contribution_type VARCHAR(50), -- new_factoid, source_link, verification, etc.
    points_earned INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contributions_user ON contributions(user_id);
CREATE INDEX idx_contributions_entity ON contributions(entity_type, entity_id);
CREATE INDEX idx_contributions_time ON contributions(created_at DESC);
```

---

### achievements

Gamification achievements.

```sql
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Definition
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    
    -- Category
    category VARCHAR(30), -- sourcerer, cartographer, chronologist, connector, verifier
    tier VARCHAR(20), -- bronze, silver, gold, special
    
    -- Requirements (for automated granting)
    requirement_type VARCHAR(30), -- count, threshold, special
    requirement_config JSONB, -- {entity_type, count, conditions}
    
    -- Rarity
    times_granted INTEGER DEFAULT 0
);

-- Seed achievements
INSERT INTO achievements (code, name, description, category, tier) VALUES
('first_factoid', 'First Step', 'Added your first factoid', NULL, 'bronze'),
('sourcerer_10', 'Novice Sourcerer', 'Linked 10 primary sources', 'sourcerer', 'bronze'),
('sourcerer_50', 'Sourcerer', 'Linked 50 primary sources', 'sourcerer', 'silver'),
('deep_root', 'Deep Root Finder', 'Found a root source cited by 20+ others', 'sourcerer', 'gold'),
('root_exposer', 'Root Exposer', 'Revealed a widely-cited fact traces to single questionable source', 'sourcerer', 'special'),
('cartographer_10', 'Local Mapper', 'Documented 10 locations', 'cartographer', 'bronze'),
('terra_incognita', 'Terra Incognita', 'First to document a previously empty region', 'cartographer', 'special'),
('gap_finder', 'Gap Finder', 'Identified a significant chronology gap', 'chronologist', 'silver'),
('pattern_seer', 'Pattern Seer', 'Your connection revealed a larger pattern', 'connector', 'gold'),
('bridge_builder', 'Bridge Builder', 'Connected two previously unlinked clusters', 'connector', 'special');
```

---

### user_achievements

Achievements earned by users.

```sql
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID NOT NULL REFERENCES users(id),
    achievement_id UUID NOT NULL REFERENCES achievements(id),
    
    -- Context
    earned_for_entity_type VARCHAR(30),
    earned_for_entity_id UUID,
    notes TEXT,
    
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
```

---

## Document Processing Tables

### documents

Ingested documents for extraction.

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to source entity
    source_id UUID REFERENCES sources(id),
    
    -- Content
    title TEXT NOT NULL,
    full_text_storage_ref TEXT, -- object storage reference
    
    -- Processing
    total_chunks INTEGER,
    processed_chunks INTEGER DEFAULT 0,
    extraction_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, partial, complete, failed
    extraction_model TEXT,
    extraction_started_at TIMESTAMPTZ,
    extraction_completed_at TIMESTAMPTZ,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_status ON documents(extraction_status);
CREATE INDEX idx_documents_source ON documents(source_id);
```

---

### extraction_sets

A corpus of factoids, actors, locations, etc. systematically extracted from a source. Enables exploring a single historian's worldview and comparing against external evidence.

```sql
CREATE TABLE extraction_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Source being extracted
    source_id UUID NOT NULL REFERENCES sources(id),
    document_id UUID REFERENCES documents(id),

    -- Extraction scope
    scope VARCHAR(30) DEFAULT 'complete', -- complete, partial, sample
    scope_description TEXT, -- "Books I-IV only" etc.

    -- Statistics (cached, updated as extraction proceeds)
    factoid_count INTEGER DEFAULT 0,
    actor_count INTEGER DEFAULT 0,
    location_count INTEGER DEFAULT 0,
    event_count INTEGER DEFAULT 0,
    environmental_count INTEGER DEFAULT 0,

    -- Status
    extraction_status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, partial, complete, failed
    extraction_model TEXT, -- AI model used
    extraction_started_at TIMESTAMPTZ,
    extraction_completed_at TIMESTAMPTZ,

    -- Quality
    human_verified_count INTEGER DEFAULT 0,
    verification_percentage DECIMAL(5,2) DEFAULT 0, -- % of extractions human-verified

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_extraction_sets_source ON extraction_sets(source_id);
CREATE INDEX idx_extraction_sets_status ON extraction_sets(extraction_status);
```

---

## Source Reader Tables

### reading_sessions

Tracks user progress through an extraction set / source.

```sql
CREATE TABLE reading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- What are we reading
    user_id UUID NOT NULL REFERENCES users(id),
    extraction_set_id UUID NOT NULL REFERENCES extraction_sets(id),

    -- Session info
    name VARCHAR(200), -- "My Herodotus Deep Dive"

    -- Current position
    current_structural_ref TEXT, -- "Book II, Chapter 47"
    current_page INTEGER,
    total_pages INTEGER,

    -- Progress
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,

    -- Playback state
    playback_speed DECIMAL(3,2) DEFAULT 1.0,
    last_played_at TIMESTAMPTZ,

    -- Settings
    settings JSONB DEFAULT '{}', -- {pause_on_events, show_introductions, animate_routes, etc.}

    -- Active frame for viewing
    active_frame_id UUID REFERENCES reference_frames(id),

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, paused, completed, archived

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_reading_sessions_user ON reading_sessions(user_id);
CREATE INDEX idx_reading_sessions_extraction ON reading_sessions(extraction_set_id);
CREATE INDEX idx_reading_sessions_status ON reading_sessions(status);
```

---

### reading_bookmarks

Bookmarks within a reading session.

```sql
CREATE TABLE reading_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reading_session_id UUID NOT NULL REFERENCES reading_sessions(id),

    -- Position
    structural_ref TEXT NOT NULL, -- "Book II, Chapter 47"
    page_number INTEGER,

    -- Bookmark info
    name VARCHAR(200),
    note TEXT,
    color VARCHAR(20) DEFAULT 'default', -- for visual categorization

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookmarks_session ON reading_bookmarks(reading_session_id);
```

---

### page_annotations

User annotations on specific pages/sections of a source.

```sql
CREATE TABLE page_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Context
    user_id UUID NOT NULL REFERENCES users(id),
    extraction_set_id UUID NOT NULL REFERENCES extraction_sets(id),
    reading_session_id UUID REFERENCES reading_sessions(id), -- optional, can annotate outside session

    -- Position
    structural_ref TEXT NOT NULL, -- "Book II, Chapter 47, Paragraph 3"
    page_number INTEGER,
    text_selection TEXT, -- specific text highlighted

    -- Annotation content
    annotation_type VARCHAR(30) NOT NULL, -- note, question, flag, correction, link
    content TEXT NOT NULL,

    -- For corrections to extractions
    factoid_id UUID REFERENCES factoids(id), -- if correcting a specific extraction
    correction_status VARCHAR(20), -- pending, accepted, rejected

    -- For links to external content
    linked_entity_type VARCHAR(30), -- factoid, source, artifact, etc.
    linked_entity_id UUID,
    external_url TEXT,

    -- Visibility
    is_public BOOLEAN DEFAULT FALSE, -- share with community?

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_annotations_user ON page_annotations(user_id);
CREATE INDEX idx_annotations_extraction ON page_annotations(extraction_set_id);
CREATE INDEX idx_annotations_session ON page_annotations(reading_session_id);
CREATE INDEX idx_annotations_structural ON page_annotations(structural_ref);
CREATE INDEX idx_annotations_public ON page_annotations(is_public) WHERE is_public = TRUE;
```

---

### source_media

Media (images, maps, etc.) associated with sources, pages, or entities.

```sql
CREATE TABLE source_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- What this media relates to
    source_id UUID REFERENCES sources(id),
    extraction_set_id UUID REFERENCES extraction_sets(id),
    structural_ref TEXT, -- "Book II, Chapter 47" - if page-specific

    -- Can also link to entities
    linked_entity_type VARCHAR(30), -- factoid, actor, artifact, location
    linked_entity_id UUID,

    -- Media info
    media_type VARCHAR(30) NOT NULL, -- image, map, diagram, video, audio
    title VARCHAR(200),
    description TEXT,

    -- Storage
    storage_ref TEXT NOT NULL, -- object storage reference
    thumbnail_ref TEXT,

    -- Attribution
    attribution TEXT, -- "British Museum", "Public Domain", etc.
    license VARCHAR(50), -- public_domain, cc_by, cc_by_sa, fair_use, etc.
    source_url TEXT, -- where it came from

    -- Display
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_source_media_source ON source_media(source_id);
CREATE INDEX idx_source_media_extraction ON source_media(extraction_set_id);
CREATE INDEX idx_source_media_structural ON source_media(structural_ref);
CREATE INDEX idx_source_media_entity ON source_media(linked_entity_type, linked_entity_id);
```

---

### document_chunks

Chunks of documents for processing.

```sql
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    document_id UUID NOT NULL REFERENCES documents(id),
    chunk_index INTEGER NOT NULL,
    
    -- Structure reference
    structural_reference TEXT, -- "Book 1, Chapter 5" etc.
    
    -- Content
    content_text TEXT NOT NULL,
    
    -- Processing
    extraction_status VARCHAR(20) DEFAULT 'pending',
    extracted_claims_count INTEGER DEFAULT 0,
    
    -- Embedding
    embedding VECTOR(1536),
    
    UNIQUE(document_id, chunk_index)
);

CREATE INDEX idx_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_chunks_status ON document_chunks(extraction_status);
CREATE INDEX idx_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops);
```

---

### extracted_claims

Raw claims extracted by AI before becoming factoids.

```sql
CREATE TABLE extracted_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    chunk_id UUID NOT NULL REFERENCES document_chunks(id),
    
    -- Extracted content
    claim_text TEXT NOT NULL, -- exact or close paraphrase from source
    claim_type VARCHAR(30), -- event, relationship, description, speech
    summary TEXT,
    
    -- Extracted entities (raw, before normalization)
    entities_raw JSONB DEFAULT '[]', -- [{text, type, role}]
    
    -- Temporal markers (raw)
    temporal_markers_raw JSONB DEFAULT '[]', -- [{text, type, reference}]
    
    -- Author attribution
    author_attribution VARCHAR(50), -- i_saw, priests_said, greeks_say, unknown, etc.
    
    -- AI confidence
    extraction_confidence DECIMAL(3,2),
    
    -- Processing status
    status VARCHAR(20) DEFAULT 'pending', -- pending, reviewed, approved, rejected, converted
    converted_to_factoid_id UUID REFERENCES factoids(id),
    
    -- Review
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_extracted_chunk ON extracted_claims(chunk_id);
CREATE INDEX idx_extracted_status ON extracted_claims(status);
```

---

## Confidence Calculation Support

### independence_analyses

Records of independence verification between sources.

```sql
CREATE TABLE independence_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    source_a_id UUID NOT NULL REFERENCES sources(id),
    source_b_id UUID NOT NULL REFERENCES sources(id),
    
    -- Analysis results
    geographic_independence DECIMAL(3,2), -- 0-1
    temporal_independence DECIMAL(3,2),
    methodological_independence DECIMAL(3,2),
    cultural_independence DECIMAL(3,2),
    citation_tree_independence DECIMAL(3,2),
    
    -- Overall score
    overall_independence DECIMAL(3,2),
    
    -- Evidence
    reasoning TEXT,
    shared_ancestors UUID[], -- source IDs of common ancestors if any
    
    -- Metadata
    analyzed_by UUID REFERENCES users(id),
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(source_a_id, source_b_id)
);

CREATE INDEX idx_independence_sources ON independence_analyses(source_a_id, source_b_id);
```

---

## Views

### factoid_confidence_details

Explainable confidence scores.

```sql
CREATE VIEW factoid_confidence_details AS
SELECT 
    f.id AS factoid_id,
    f.description,
    COUNT(DISTINCT fs.source_id) AS source_count,
    COUNT(DISTINCT fs.source_id) FILTER (WHERE s.source_type = 'primary') AS primary_source_count,
    AVG(ia.overall_independence) AS avg_independence,
    -- ... additional calculations
    f.community_confidence,
    f.core_confidence
FROM factoids f
LEFT JOIN factoid_sources fs ON f.id = fs.factoid_id
LEFT JOIN sources s ON fs.source_id = s.id
LEFT JOIN independence_analyses ia ON s.id IN (ia.source_a_id, ia.source_b_id)
GROUP BY f.id;
```

---

## Indexes for Common Queries

```sql
-- Full-text search
CREATE INDEX idx_factoids_fts ON factoids USING gin(to_tsvector('english', description));
CREATE INDEX idx_sources_fts ON sources USING gin(to_tsvector('english', title));
CREATE INDEX idx_actors_fts ON actors USING gin(to_tsvector('english', name_primary || ' ' || COALESCE(description, '')));
CREATE INDEX idx_extensions_fts ON factoid_extensions USING gin(to_tsvector('english', content));

-- Temporal queries (via placements, not factoids)
-- Main temporal queries go through factoid_placements
-- idx_placements_dates already defined on factoid_placements table

-- Frame and lens queries
CREATE INDEX idx_placements_frame_date ON factoid_placements(frame_id, date_start, date_end);

-- Geographic queries (if using PostGIS later)
-- CREATE INDEX idx_locations_geo ON locations USING gist(geography(point(coordinate_x, coordinate_y)));
```

---

## Row Level Security (Supabase)

```sql
-- Enable RLS
ALTER TABLE factoids ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
-- ... etc for all tables

-- Public read for most tables
CREATE POLICY "Public read" ON factoids FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Public read" ON sources FOR SELECT USING (deleted_at IS NULL);

-- Authenticated create
CREATE POLICY "Authenticated create" ON factoids FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- Owner update
CREATE POLICY "Owner update" ON factoids FOR UPDATE 
    USING (created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE auth_id = auth.uid() AND is_admin = TRUE
    ));
```

---

## Open Questions

- **Polymorphic connections**: The `connections` table uses entity_type + entity_id. Should we use separate tables per relationship type for better integrity?

- **Vector dimensions**: Using 1536 (OpenAI default). Should we support multiple embedding models with different dimensions?

- **Soft delete scope**: Currently soft delete on main entities. Should contributions and other audit data also soft delete?

- **Partitioning**: For scale, should factoid_placements be partitioned by frame_id or date range?

- **Extension propagation**: When a frame adopts an extension, should all factoids with that extension automatically get a placement created? Or is placement always manual?

- **Placement authority**: Can multiple users create conflicting placements in the same frame? How do we handle community consensus on placements?

- **Default placements**: Should the system automatically create placements in the Mainstream frame for new factoids if the raw observation suggests a date?

- **Lens inheritance**: Can lenses inherit from other lenses (base configuration + overrides)?

- **Frame versioning**: If a frame's configuration changes (e.g., new anchor trust settings), should existing placements be recalculated or frozen?

- **Raw observation structure**: Should raw_observation be structured (JSONB) rather than TEXT for better querying?

---

## Dependencies

- PostgreSQL 15+
- pgvector extension
- Supabase (for auth, storage, realtime)

---

## Next Steps

- Implement migrations
- Create seed data for calendars, achievements
- Build API layer (see separate API spec)
