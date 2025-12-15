# Entity Identity & Resolution

## Overview

Historical entities don't have stable identifiers. The same city is called Byzantium, Constantinople, and Istanbul. The same person is Ἡρόδοτος in Greek and Herodotus in English. Zeus "maps" to Jupiter with high confidence, but to Amun with much less.

We need a system that:
1. Tracks all known names/variants for entities
2. Maps places through time as they change
3. Links equivalent names across languages and scripts
4. Handles disputed identifications with appropriate confidence
5. Prevents false duplicates without forcing false equivalences

---

## Core Principles

### 1. Identity Is Not Always Certain

Some mappings are definite (Constantinople = Istanbul). Others are probable (most scholars agree). Others are disputed (ancient X might be modern Y or Z). Others are speculative (deity equivalences across cultures).

The system must represent this uncertainty, not hide it.

### 2. Names Are Not Identity

An entity can have many names. A name can refer to multiple entities. The mapping between names and entities is many-to-many with metadata.

### 3. Context Determines Resolution

When a source mentions "Alexandria," which Alexandria? Context (author, date, subject matter) helps resolve. The system should support contextual disambiguation.

### 4. Disputed Mappings Are Data

When scholars disagree about whether ancient city X is modern city Y or Z, both positions should be visible with their supporting arguments. We don't pick winners.

### 5. Avoid False Equivalence

Zeus ≈ Jupiter is well-established in classical scholarship. Zeus = Amun is more contentious. Zeus = Yahweh is fringe. Collapsing these into "same entity" loses important distinctions.

---

## Data Model

### Core Entity Table

```sql
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Entity type
    entity_type VARCHAR(30) NOT NULL,
    -- 'person', 'deity', 'place', 'polity', 'people_group', 
    -- 'institution', 'mythological_figure', 'literary_character'
    
    -- Canonical name (for display, chosen by editorial judgment)
    canonical_name TEXT NOT NULL,
    
    -- Description
    description TEXT,
    
    -- Temporal bounds (when this entity "existed")
    -- NULL means unknown or unbounded
    existed_from TEXT,  -- Flexible date string
    existed_to TEXT,
    
    -- For places: location data
    -- Can change over time - see place_locations table
    current_location GEOGRAPHY(POINT),  -- Modern location if known
    
    -- For people
    birth_date TEXT,
    death_date TEXT,
    
    -- Confidence that this entity actually existed
    -- (vs. purely mythological/literary)
    historicity_confidence DECIMAL(3,2),
    -- 1.0 = definitely historical
    -- 0.5 = debated
    -- 0.0 = definitely mythological
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Community for community-specific variations
    community_id UUID REFERENCES communities(id)
);

CREATE INDEX idx_entities_type ON entities(entity_type);
CREATE INDEX idx_entities_canonical ON entities(canonical_name);
```

### Entity Names (All Known Names/Variants)

```sql
CREATE TABLE entity_names (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    entity_id UUID NOT NULL REFERENCES entities(id),
    
    -- The name itself
    name TEXT NOT NULL,
    
    -- Name in original script (if different from romanized)
    name_original_script TEXT,
    script VARCHAR(20),  -- 'greek', 'latin', 'hebrew', 'arabic', 'cuneiform', etc.
    
    -- Language of this name form
    language VARCHAR(10),  -- ISO 639-1 or 639-3
    
    -- What kind of name is this?
    name_type VARCHAR(30),
    -- 'native' (name in entity's own language/culture)
    -- 'exonym' (foreign name for entity)
    -- 'translation' (translated form)
    -- 'transliteration' (sound-based conversion)
    -- 'latinization' (Latin form of non-Latin name)
    -- 'anglicization' (English form)
    -- 'epithet' (descriptive addition: "the Great")
    -- 'throne_name', 'birth_name', 'regnal_name'
    -- 'modern_scholarly' (modern convention)
    -- 'ancient_variant' (variant in ancient sources)
    
    -- Temporal scope (when was this name used?)
    used_from TEXT,
    used_to TEXT,
    
    -- Context for use
    used_by_culture TEXT,  -- Who used this name?
    usage_notes TEXT,
    
    -- Is this a primary/preferred name for this language?
    is_primary_for_language BOOLEAN DEFAULT FALSE,
    
    -- Sources attesting this name
    attested_in UUID[],  -- Array of source IDs
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_entity_names_entity ON entity_names(entity_id);
CREATE INDEX idx_entity_names_name ON entity_names(name);
CREATE INDEX idx_entity_names_original ON entity_names(name_original_script);

-- Full text search across all name forms
CREATE INDEX idx_entity_names_search ON entity_names 
    USING gin(to_tsvector('simple', name || ' ' || COALESCE(name_original_script, '')));
```

### Place Locations Through Time

```sql
CREATE TABLE place_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    entity_id UUID NOT NULL REFERENCES entities(id),
    
    -- Location
    location GEOGRAPHY(POINT),
    location_polygon GEOGRAPHY(POLYGON),  -- For regions/areas
    
    -- Uncertainty
    location_confidence DECIMAL(3,2),
    location_uncertainty_radius_km DECIMAL,  -- Approximate if uncertain
    
    -- Temporal scope
    valid_from TEXT,
    valid_to TEXT,
    
    -- What happened here during this period
    location_type VARCHAR(30),
    -- 'settlement', 'capital', 'ruins', 'approximate_region'
    
    -- Notes
    notes TEXT,
    
    -- Disputes about this location
    is_disputed BOOLEAN DEFAULT FALSE,
    dispute_notes TEXT,
    
    -- Sources
    source_ids UUID[]
);

CREATE INDEX idx_place_locations_entity ON place_locations(entity_id);
CREATE INDEX idx_place_locations_geo ON place_locations USING GIST(location);
```

### Entity Equivalences (Cross-Entity Mappings)

```sql
CREATE TABLE entity_equivalences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- The two entities being linked
    entity_a_id UUID NOT NULL REFERENCES entities(id),
    entity_b_id UUID NOT NULL REFERENCES entities(id),
    
    -- Type of equivalence
    equivalence_type VARCHAR(30) NOT NULL,
    -- 'same_entity' - definitely the same (Constantinople = Istanbul)
    -- 'continuation' - one became the other (Roman Empire → Byzantine Empire)
    -- 'cultural_equivalent' - equivalent role in different cultures (Zeus ≈ Jupiter)
    -- 'syncretism' - religious/mythological merger (Serapis = Osiris + Apis)
    -- 'identification' - ancient identification (Greeks identified Amun with Zeus)
    -- 'possible_same' - might be the same, disputed
    -- 'often_confused' - commonly conflated but distinct
    
    -- Direction (for asymmetric relationships)
    -- 'a_to_b', 'b_to_a', 'bidirectional'
    direction VARCHAR(15) DEFAULT 'bidirectional',
    
    -- Confidence in this equivalence
    confidence DECIMAL(3,2) NOT NULL,
    -- 1.0 = certain
    -- 0.8 = scholarly consensus
    -- 0.6 = probable
    -- 0.4 = possible
    -- 0.2 = speculative
    
    -- Scholarly support
    scholarly_consensus VARCHAR(20),
    -- 'universal', 'strong', 'majority', 'divided', 'minority', 'fringe'
    
    -- Context where this equivalence applies
    context_notes TEXT,
    -- e.g., "In Hellenistic Egypt" or "In interpretatio romana"
    
    -- Temporal scope (when was this equivalence recognized/valid)
    valid_from TEXT,
    valid_to TEXT,
    
    -- Reasoning/evidence
    reasoning TEXT,
    
    -- Sources supporting this equivalence
    supporting_sources UUID[],
    
    -- Sources disputing this equivalence
    disputing_sources UUID[],
    
    -- Who asserted this in our system
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Verification
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    
    CONSTRAINT different_entities CHECK (entity_a_id != entity_b_id)
);

CREATE INDEX idx_equivalences_a ON entity_equivalences(entity_a_id);
CREATE INDEX idx_equivalences_b ON entity_equivalences(entity_b_id);
CREATE INDEX idx_equivalences_type ON entity_equivalences(equivalence_type);
```

### Disputed Identifications

```sql
CREATE TABLE identification_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- What's being identified
    subject_description TEXT NOT NULL,
    -- e.g., "The location of biblical Tarshish"
    -- e.g., "Identity of the Sea Peoples"
    
    -- Subject entity (if we have one)
    subject_entity_id UUID REFERENCES entities(id),
    
    -- Competing identifications
    -- Stored as JSONB array of candidates
    candidates JSONB NOT NULL,
    -- [
    --   {
    --     "entity_id": "uuid or null",
    --     "description": "Tartessos in Spain",
    --     "confidence": 0.4,
    --     "scholarly_support": "significant minority",
    --     "key_arguments": ["Phoenician trade routes", "Herodotus description"],
    --     "key_proponents": ["Scholar A", "Scholar B"],
    --     "sources": ["uuid1", "uuid2"]
    --   },
    --   {
    --     "entity_id": "uuid or null", 
    --     "description": "Tarsus in Cilicia",
    --     "confidence": 0.3,
    --     ...
    --   }
    -- ]
    
    -- Overall status
    status VARCHAR(20) DEFAULT 'open',
    -- 'open' - actively debated
    -- 'leaning' - scholarly consensus forming
    -- 'resolved' - consensus reached (rare)
    
    -- Notes
    summary TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Name Resolution System

### Resolution Algorithm

```python
class EntityResolver:
    """
    Resolve name mentions to entities with confidence.
    """
    
    def resolve(
        self, 
        name: str, 
        context: ResolutionContext
    ) -> list[ResolvedEntity]:
        """
        Given a name and context, return possible entity matches.
        """
        # 1. Exact match on any name form
        exact_matches = self.find_exact_matches(name)
        
        # 2. Fuzzy match (handles spelling variants, OCR errors)
        fuzzy_matches = self.find_fuzzy_matches(name, threshold=0.85)
        
        # 3. Transliteration matching (Greek/Latin/Hebrew/Arabic)
        translit_matches = self.find_transliteration_matches(name)
        
        # Combine all candidates
        candidates = self.merge_candidates(exact_matches, fuzzy_matches, translit_matches)
        
        # 4. Score by context
        scored = self.score_by_context(candidates, context)
        
        # 5. Return ranked results
        return sorted(scored, key=lambda x: x.confidence, reverse=True)
    
    def score_by_context(
        self, 
        candidates: list[Entity], 
        context: ResolutionContext
    ) -> list[ResolvedEntity]:
        """
        Score candidates based on contextual fit.
        """
        results = []
        
        for entity in candidates:
            score = 0.5  # Base score for name match
            
            # Temporal fit
            if context.date and entity_existed_at(entity, context.date):
                score += 0.15
            elif context.date and not entity_existed_at(entity, context.date):
                score -= 0.3  # Significant penalty for temporal mismatch
                
            # Geographic fit
            if context.region and entity_associated_with_region(entity, context.region):
                score += 0.15
                
            # Cultural/linguistic fit
            if context.source_language:
                if entity_has_name_in_language(entity, context.source_language):
                    score += 0.1
                    
            # Author knowledge fit
            if context.author and author_likely_knew_of(context.author, entity):
                score += 0.1
                
            # Subject matter fit
            if context.subject_tags and entity_matches_subject(entity, context.subject_tags):
                score += 0.1
                
            results.append(ResolvedEntity(
                entity=entity,
                confidence=min(1.0, max(0.0, score)),
                resolution_notes=self.generate_notes(entity, context)
            ))
            
        return results


@dataclass
class ResolutionContext:
    """Context for entity resolution."""
    source_id: UUID | None  # What source is this from?
    date: str | None  # Approximate date of source
    region: str | None  # Geographic region of source
    source_language: str | None  # Language of source
    author: str | None  # Author of source
    subject_tags: list[str] | None  # What's the source about?
    surrounding_text: str | None  # Text around the name mention
```

### Transliteration Matching

```python
class TransliterationMatcher:
    """
    Match names across different scripts and transliteration systems.
    """
    
    # Greek to Latin transliteration rules
    GREEK_TO_LATIN = {
        'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e',
        'ζ': 'z', 'η': 'e', 'θ': 'th', 'ι': 'i', 'κ': 'k',
        'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o',
        'π': 'p', 'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't',
        'υ': 'u', 'φ': 'ph', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o',
        # Common combinations
        'ου': 'ou', 'αι': 'ai', 'ει': 'ei', 'οι': 'oi',
    }
    
    # Common variations in anglicization
    LATIN_VARIATIONS = [
        ('ae', 'e'), ('oe', 'e'),  # Caesar/Cesar
        ('c', 'k'), ('k', 'c'),    # Kyros/Cyrus
        ('ph', 'f'),               # Pharaoh/Farao
        ('y', 'i'),                # Kyros/Kiros
        ('ou', 'u'),               # Thucydides/Thukudides
    ]
    
    def generate_variants(self, name: str, from_script: str) -> list[str]:
        """Generate possible variant spellings."""
        variants = {name.lower()}
        
        if from_script == 'greek':
            # Transliterate to Latin
            latin = self.greek_to_latin(name)
            variants.add(latin)
            
            # Add common anglicizations
            for original, replacement in self.LATIN_VARIATIONS:
                if original in latin:
                    variants.add(latin.replace(original, replacement))
                    
        # Add without diacritics
        variants.add(self.remove_diacritics(name))
        
        return list(variants)
    
    def find_matches(self, name: str, entity_names: list[EntityName]) -> list[EntityName]:
        """Find entity names that might match this name."""
        # Generate variants of the query
        query_variants = set()
        for script in ['greek', 'latin', 'hebrew', 'arabic']:
            query_variants.update(self.generate_variants(name, script))
        
        matches = []
        for entity_name in entity_names:
            # Generate variants of the stored name
            stored_variants = self.generate_variants(
                entity_name.name, 
                entity_name.script or 'latin'
            )
            
            # Check for overlap
            if query_variants & set(stored_variants):
                matches.append(entity_name)
                
        return matches
```

---

## Place Name Evolution

### Example: Constantinople/Istanbul

```yaml
entity:
  id: "uuid-constantinople"
  entity_type: "place"
  canonical_name: "Constantinople/Istanbul"
  description: "Major city on the Bosphorus strait"
  
names:
  - name: "Βυζάντιον"
    name_original_script: "Βυζάντιον"
    script: "greek"
    language: "grc"  # Ancient Greek
    name_type: "native"
    used_from: "c. 657 BCE"
    used_to: "330 CE"
    usage_notes: "Original Greek colony name"
    
  - name: "Byzantium"
    script: "latin"
    language: "la"
    name_type: "latinization"
    used_from: "c. 200 BCE"
    used_to: "330 CE"
    
  - name: "Κωνσταντινούπολις"
    name_original_script: "Κωνσταντινούπολις"
    script: "greek"
    language: "grc"
    name_type: "native"
    used_from: "330 CE"
    used_to: "1453 CE"
    usage_notes: "Named after Constantine I"
    
  - name: "Constantinople"
    script: "latin"
    language: "la"
    name_type: "latinization"
    used_from: "330 CE"
    used_to: "present"
    usage_notes: "Still used in Western historical contexts"
    
  - name: "Konstantiniyye"
    script: "arabic"
    language: "ota"  # Ottoman Turkish
    name_type: "exonym"
    used_from: "1453"
    used_to: "1930"
    
  - name: "Istanbul"
    script: "latin"
    language: "tr"
    name_type: "native"
    used_from: "1930"
    used_to: "present"
    is_primary_for_language: true
    usage_notes: "Official name change in 1930"
    
  - name: "Ἰσταμπόλ"
    script: "greek"
    language: "el"
    name_type: "modern"
    usage_notes: "Modern Greek informal usage"

locations:
  - location: "POINT(28.9784 41.0082)"
    location_confidence: 0.99
    valid_from: "c. 657 BCE"
    valid_to: "present"
    location_type: "settlement"
    notes: "Location stable throughout history"
```

### Example: Disputed Location (Tarshish)

```yaml
entity:
  id: "uuid-tarshish"
  entity_type: "place"
  canonical_name: "Tarshish"
  description: "Trading destination mentioned in Hebrew Bible"
  historicity_confidence: 0.7  # Probably real, location uncertain

names:
  - name: "תַּרְשִׁישׁ"
    script: "hebrew"
    language: "hbo"
    name_type: "native"
    
  - name: "Tarshish"
    script: "latin"
    language: "en"
    name_type: "anglicization"
    
  - name: "Θαρσεῖς"
    script: "greek"
    language: "grc"
    name_type: "translation"
    usage_notes: "Septuagint rendering"

locations:
  # Multiple disputed locations
  - location: "POINT(-6.0 36.0)"  # Approximate: Spain
    location_confidence: 0.4
    location_type: "approximate_region"
    is_disputed: true
    dispute_notes: "Tartessos identification"
    notes: "Associated with Tartessos in southern Spain"
    
  - location: "POINT(34.9 36.9)"  # Tarsus
    location_confidence: 0.3
    location_type: "settlement"
    is_disputed: true
    dispute_notes: "Tarsus identification"
    notes: "Phonetic similarity to Tarsus in Cilicia"
    
  - location: "POINT(9.0 34.0)"  # Carthage area
    location_confidence: 0.2
    location_type: "approximate_region"
    is_disputed: true
    notes: "Some identify with Carthage/North Africa"

# The dispute record
dispute:
  subject_description: "The location of biblical Tarshish"
  subject_entity_id: "uuid-tarshish"
  candidates:
    - description: "Tartessos in southern Spain"
      confidence: 0.4
      scholarly_support: "significant"
      key_arguments:
        - "Phoenician trade routes reached Spain"
        - "Herodotus mentions Tartessos as wealthy trading center"
        - "Jonah fled 'to Tarshish' implying western Mediterranean"
      key_proponents: ["W.F. Albright", "S. Moscati"]
      
    - description: "Tarsus in Cilicia"
      confidence: 0.3
      scholarly_support: "minority"
      key_arguments:
        - "Phonetic similarity"
        - "Known ancient city"
      
    - description: "Sardinia"
      confidence: 0.15
      scholarly_support: "minority"
      key_arguments:
        - "Ancient name 'Tarsis' attested"
        - "Metal-working tradition matches biblical description"
        
    - description: "Non-specific distant west"
      confidence: 0.15
      scholarly_support: "some"
      key_arguments:
        - "May be literary/symbolic rather than specific location"
        - "Represents 'edge of the world' in Hebrew cosmology"
  
  status: "open"
```

---

## Deity Equivalences

### Mapping Confidence Levels

```yaml
deity_equivalence_types:
  high_confidence:
    description: "Well-established scholarly equivalence"
    examples:
      - entity_a: "Zeus"
        entity_b: "Jupiter"
        type: "cultural_equivalent"
        confidence: 0.95
        scholarly_consensus: "universal"
        context: "interpretatio romana"
        
      - entity_a: "Aphrodite"
        entity_b: "Venus"
        type: "cultural_equivalent"
        confidence: 0.95
        
  medium_confidence:
    description: "Established but with nuances"
    examples:
      - entity_a: "Hermes"
        entity_b: "Mercury"
        type: "cultural_equivalent"
        confidence: 0.85
        notes: "Mercury gained additional commercial associations"
        
      - entity_a: "Amun"
        entity_b: "Zeus"
        type: "identification"
        confidence: 0.7
        context: "Greek identification at Siwa oracle"
        scholarly_consensus: "strong"
        notes: "Greeks identified Amun with Zeus; not full equivalence"
        
  lower_confidence:
    description: "Partial or contested mappings"
    examples:
      - entity_a: "Osiris"
        entity_b: "Dionysus"
        type: "identification"
        confidence: 0.5
        scholarly_consensus: "divided"
        notes: "Herodotus made this identification; modern scholars debate"
        
      - entity_a: "Melqart"
        entity_b: "Heracles"
        type: "syncretism"
        confidence: 0.6
        context: "Phoenician-Greek contact"
        
  speculative:
    description: "Proposed but not widely accepted"
    examples:
      - entity_a: "Yahweh"
        entity_b: "Zeus"
        type: "possible_same"
        confidence: 0.1
        scholarly_consensus: "fringe"
        notes: "Some fringe theories connect; mainstream rejects"
```

### Creating Deity Equivalence Record

```sql
-- Zeus-Jupiter equivalence (high confidence)
INSERT INTO entity_equivalences (
    entity_a_id, entity_b_id,
    equivalence_type, direction, confidence,
    scholarly_consensus, context_notes, reasoning
) VALUES (
    'uuid-zeus', 'uuid-jupiter',
    'cultural_equivalent', 'bidirectional', 0.95,
    'universal',
    'interpretatio romana - standard Roman practice of identifying Greek gods with Roman equivalents',
    'Established since early Roman contact with Greek culture. Jupiter assumed Zeus mythology wholesale. Not disputed in scholarship.'
);

-- Amun-Zeus identification (medium confidence)
INSERT INTO entity_equivalences (
    entity_a_id, entity_b_id,
    equivalence_type, direction, confidence,
    scholarly_consensus, context_notes, reasoning,
    valid_from, valid_to
) VALUES (
    'uuid-amun', 'uuid-zeus',
    'identification', 'bidirectional', 0.7,
    'strong',
    'Greek identification particularly at Siwa oracle; part of interpretatio graeca',
    'Greeks visiting Egypt identified Amun as a form of Zeus. This is an ancient interpretation, not a claim of actual theological identity. Alexander visited Siwa to consult "Zeus-Ammon."',
    '500 BCE', '300 CE'
);
```

---

## UI for Entity Resolution

### During Extraction

```
ENTITY EXTRACTION: Mention of "Alexandria"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Source: Strabo, Geography, Book XVII
Date: c. 20 CE
Context: "...the great library at Alexandria..."

POSSIBLE MATCHES:

┌─────────────────────────────────────────────────────────┐
│ ● Alexandria, Egypt                     [95% confidence]│
│   Modern: Alexandria, Egypt (31.2°N, 29.9°E)           │
│   Founded: 331 BCE by Alexander the Great              │
│   Names: Ἀλεξάνδρεια (Greek), الإسكندرية (Arabic)        │
│   ✓ Temporal fit: existed at source date               │
│   ✓ Context fit: "great library" matches               │
│   [Select this entity]                                  │
├─────────────────────────────────────────────────────────┤
│ ○ Alexandria Troas                      [12% confidence]│
│   Modern: Near Dalyan, Turkey                          │
│   Founded: 310 BCE                                     │
│   ✗ Context: No major library attested                 │
│   [Select this entity]                                  │
├─────────────────────────────────────────────────────────┤
│ ○ Alexandria Eschate                     [5% confidence]│
│   Modern: Khujand, Tajikistan                          │
│   Founded: 329 BCE                                     │
│   ✗ Context: Remote frontier city, no library          │
│   [Select this entity]                                  │
├─────────────────────────────────────────────────────────┤
│ [Create new entity] [Skip - ambiguous] [Mark for review]│
└─────────────────────────────────────────────────────────┘
```

### Entity Detail View

```
ENTITY: Constantinople / Istanbul
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type: Place (City)
Current location: 41.0082°N, 28.9784°E
[Map showing location on Bosphorus]

NAMES THROUGH TIME:
┌──────────────────┬────────────┬─────────────────────────┐
│ Name             │ Period     │ Notes                   │
├──────────────────┼────────────┼─────────────────────────┤
│ Βυζάντιον        │ 657 BCE-   │ Original Greek colony   │
│ (Byzantion)      │ 330 CE     │                         │
├──────────────────┼────────────┼─────────────────────────┤
│ Κωνσταντινούπολις│ 330-       │ Named for Constantine   │
│ (Constantinople) │ present*   │ *Still used in West     │
├──────────────────┼────────────┼─────────────────────────┤
│ Konstantiniyye   │ 1453-1930  │ Ottoman official name   │
├──────────────────┼────────────┼─────────────────────────┤
│ Istanbul         │ 1930-      │ Modern Turkish          │
│                  │ present    │                         │
└──────────────────┴────────────┴─────────────────────────┘

RELATED ENTITIES:
├── Successor of: Byzantium (same entity, name change)
├── Capital of: Roman Empire (330-395)
├── Capital of: Byzantine Empire (395-1453)
├── Capital of: Ottoman Empire (1453-1922)
└── Part of: Turkey (1923-present)

MENTIONED IN: 2,847 factoids
[View all references]
```

### Disputed Identification View

```
DISPUTED IDENTIFICATION: Location of Tarshish
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: OPEN (actively debated)

The Hebrew Bible mentions Tarshish as a distant trading 
destination, famous for metals and wealth. Its location 
is disputed.

CANDIDATE IDENTIFICATIONS:

┌─────────────────────────────────────────────────────────┐
│ 1. TARTESSOS, SPAIN                     [40% confidence]│
│                                                         │
│ Arguments for:                                          │
│ • Phoenician trade routes reached Iberian peninsula    │
│ • Herodotus describes Tartessos as wealthy             │
│ • Rich in silver and tin (matches biblical description)│
│ • "Ships of Tarshish" suggests distant sea voyage      │
│                                                         │
│ Arguments against:                                      │
│ • Tartessos exact location also uncertain              │
│ • Phonetic connection not conclusive                   │
│                                                         │
│ Key proponents: Albright, Moscati                      │
│ Sources: [12 linked]                                   │
├─────────────────────────────────────────────────────────┤
│ 2. TARSUS, CILICIA                      [30% confidence]│
│                                                         │
│ Arguments for:                                          │
│ • Strong phonetic similarity                           │
│ • Known ancient city                                   │
│                                                         │
│ Arguments against:                                      │
│ • Direction doesn't fit "fleeing west" narratives      │
│ • Not particularly known for metals                    │
│                                                         │
│ Sources: [5 linked]                                    │
├─────────────────────────────────────────────────────────┤
│ 3. SARDINIA                             [15% confidence]│
│                                                         │
│ Arguments for:                                          │
│ • Ancient name "Tarsis" attested                       │
│ • Metal-working tradition                              │
│                                                         │
│ Sources: [3 linked]                                    │
├─────────────────────────────────────────────────────────┤
│ 4. SYMBOLIC/NON-SPECIFIC                [15% confidence]│
│                                                         │
│ Arguments for:                                          │
│ • May represent "edge of the world" literarily         │
│ • Multiple "Tarshish" references may not be same place │
│                                                         │
│ Sources: [4 linked]                                    │
└─────────────────────────────────────────────────────────┘

[Add new candidate] [Link source] [Contribute to discussion]
```

---

## Resolution Workflows

### When Extracting from Source

```python
async def resolve_entity_mention(
    mention: str,
    source_context: SourceContext,
    user_id: UUID
) -> EntityResolution:
    """
    Resolve an entity mention during extraction.
    """
    resolver = EntityResolver()
    
    # Get candidates
    candidates = resolver.resolve(mention, source_context.to_resolution_context())
    
    if not candidates:
        # No matches - prompt to create new
        return EntityResolution(
            status='no_match',
            suggestion='create_new',
            mention=mention
        )
    
    top_candidate = candidates[0]
    
    if top_candidate.confidence > 0.9:
        # High confidence - auto-link with note
        return EntityResolution(
            status='auto_resolved',
            entity_id=top_candidate.entity.id,
            confidence=top_candidate.confidence,
            requires_review=False
        )
        
    elif top_candidate.confidence > 0.7:
        # Good confidence - auto-link but flag for review
        return EntityResolution(
            status='auto_resolved',
            entity_id=top_candidate.entity.id,
            confidence=top_candidate.confidence,
            requires_review=True,
            alternatives=[c.entity.id for c in candidates[1:3]]
        )
        
    else:
        # Low confidence - require human decision
        return EntityResolution(
            status='needs_human',
            candidates=candidates[:5],
            mention=mention
        )
```

### Merging Duplicate Entities

```python
async def merge_entities(
    keep_entity_id: UUID,
    merge_entity_id: UUID,
    user_id: UUID,
    reasoning: str
) -> MergeResult:
    """
    Merge two entities that are determined to be the same.
    """
    keep = get_entity(keep_entity_id)
    merge = get_entity(merge_entity_id)
    
    # Validation
    if keep.entity_type != merge.entity_type:
        raise ValueError("Cannot merge entities of different types")
    
    # Transfer all names
    for name in get_entity_names(merge_entity_id):
        name.entity_id = keep_entity_id
        save_entity_name(name)
    
    # Transfer all locations (for places)
    for location in get_place_locations(merge_entity_id):
        location.entity_id = keep_entity_id
        save_place_location(location)
    
    # Update all factoid references
    update_factoid_entities(merge_entity_id, keep_entity_id)
    
    # Transfer equivalences
    for equiv in get_equivalences(merge_entity_id):
        equiv.entity_a_id = keep_entity_id if equiv.entity_a_id == merge_entity_id else equiv.entity_a_id
        equiv.entity_b_id = keep_entity_id if equiv.entity_b_id == merge_entity_id else equiv.entity_b_id
        save_equivalence(equiv)
    
    # Create merge record (for audit)
    create_merge_record(
        kept=keep_entity_id,
        merged=merge_entity_id,
        by=user_id,
        reasoning=reasoning
    )
    
    # Soft delete merged entity
    soft_delete_entity(merge_entity_id)
    
    return MergeResult(
        kept_entity=keep,
        merged_entity=merge,
        names_transferred=count_names,
        references_updated=count_references
    )
```

---

## Features

### MVP (Phase 1)

**Basic entity model**
- Entities with canonical names
- Simple name variants (no full temporal tracking)
- Basic location for places

**Simple resolution**
- Exact match lookup
- Manual disambiguation when multiple matches

**No equivalence tracking**
- Defer complex equivalences to Phase 2

### Phase 2

**Full name system**
- All name variants with temporal scope
- Language and script tracking
- Transliteration matching

**Location evolution**
- Places through time
- Multiple historical locations

**Basic equivalences**
- Same entity links (Constantinople = Istanbul)
- High-confidence deity mappings

**Resolution UI**
- Candidate ranking
- Context-aware suggestions

### Phase 3 (Dream)

**Full equivalence system**
- All equivalence types
- Confidence and scholarly consensus
- Disputed identification tracking

**Advanced resolution**
- AI-assisted disambiguation
- Learning from corrections
- Batch resolution for imports

**Visualization**
- Entity relationship graphs
- Name evolution timelines
- Geographic spread of name usage

---

## Open Questions

- **Canonical name selection**: Who decides the "canonical" display name? Editorial policy?

- **Merge authority**: Who can merge entities? What's the review process?

- **Disputed identification governance**: How to handle contentious disputes fairly?

- **Cross-community entities**: Are entities global or community-specific?

- **Deity theology**: How to handle cases where religions reject equivalences? (e.g., "Zeus is NOT Yahweh" as explicit non-equivalence)

---

## Dependencies

- **02-data-model.md**: Core schema integration; entities are Core Data
- **05-geographic-system.md**: Location handling
- **11-frames-namespaces.md**: Communities may have entity variations
- **22-pipeline-architecture.md**: Entity extraction in pipelines

---

## Summary

Entity identity is hard because history is messy. The same entity has many names across time and language. Locations change. Scholarly identifications are contested. Deity equivalences range from certain to speculative.

This system handles that messiness:
- **Names are not identity** — entities have many names, tracked with context
- **Locations evolve** — places tracked through time with their changing positions
- **Equivalences have confidence** — from "certain" to "speculative," visible to users
- **Disputes are data** — competing identifications shown with arguments, not hidden

When a user asks "where is Tarshish?", we don't pick a winner. We show the candidates, the arguments, the confidence levels. The structure reveals the scholarly landscape.
