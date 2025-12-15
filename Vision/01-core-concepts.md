# Core Concepts

## Overview

This document defines the fundamental entities and terminology used throughout the system. These concepts form the shared vocabulary for all other documentation and the data model itself.

The key insight underlying these definitions: **we store claims, not facts**. A historical "fact" is actually a claim made by a source. The event itself is inferred from the convergence (or divergence) of claims.

---

## Primary Entities

### Factoid

A **factoid** is a discrete claim extracted from a source or contributed by a user.

**Key properties:**
- It is attributed to a source (who said this?)
- It has raw observation data (what do we actually see/know?)
- It may have extensions (interpretations of the raw observation)
- It has placements in frames (where it lands temporally depends on frame + interpretation)
- It has a confidence score (how well-supported is it?)
- It may be connected to other factoids
- It exists independent of any single interpretation

**What a factoid is NOT:**
- Not a "fact" (we don't assert truth, we record claims)
- Not interpretation (that belongs to frames/namespaces)
- Not floating (always tied to source)

**Examples:**
- "Herodotus claims the Battle of Marathon occurred when Callimachus was polemarch"
- "The Oera Linda manuscript states that Atland was destroyed by catastrophe"
- "Caesar reports killing 430,000 Germans in the Usipetes massacre"

Notice: each is framed as a *claim from a source*, not as a bare fact.

---

### Factoid Extension

A **factoid extension** is an interpretive layer attached to a factoid that explains or contests the raw observation.

**Why extensions exist:**
Even "raw evidence" isn't always unambiguous. A coin inscribed "j684" could mean:
- "j = 1, therefore 1684 AD"
- "j = Jesus, therefore 684 years after Christ"
- "j = different calendar system entirely"

Extensions capture these interpretations separately from the raw factoid.

**Key properties:**
- Linked to a factoid
- Extension type (dating_interpretation, reading_variant, attribution, etc.)
- Content (the interpretation itself)
- Sources (evidence for this interpretation)
- Contributed by (user/system)
- Adopted by frames (which frames accept this interpretation)
- Contested (whether counter-interpretations exist)

**Extensions can be shared:**
If a researcher proves "j-prefix means Jesus-era dating on medieval coins," that extension can propagate across multiple factoids and be adopted by multiple frames.

---

### Factoid Placement

A **factoid placement** is where a factoid lands temporally within a specific frame, based on a specific interpretation.

```
FACTOID + FRAME + INTERPRETATION → PLACEMENT
```

**Key properties:**
- Factoid ID
- Frame ID
- Extension/interpretation used (if applicable)
- Date start / date end
- Placed by (user/system)
- Reasoning

**Why placements are separate:**
- Same factoid can be placed differently in different frames
- Same factoid can be placed differently by different users exploring interpretations
- A factoid can exist without being placed in every frame
- The *divergence* between placements across frames is itself data

---

### Source

A **source** is any origin of information — a document, artifact, witness account, or physical evidence.

**Source hierarchy:**

```
PRIMARY SOURCE
├── Direct witness account
├── Contemporary document
├── Physical artifact
├── Archaeological finding
└── Inscription/monument

SECONDARY SOURCE
├── History written after events
├── Compilation of earlier sources
├── Translation
└── Analysis/commentary

TERTIARY SOURCE
├── Textbook
├── Encyclopedia
├── Documentary
└── Popular account
```

**Key properties:**
- Type (primary, secondary, tertiary)
- Genre (history, propaganda, memoir, administrative, religious, etc.)
- Author profile (who created this, what was their stake?)
- Provenance (how did this survive? why this and not others?)
- Citation relationships (what does this cite? what cites this?)

**The source tree:**
Every source that cites other sources creates a tree. Following that tree downward reveals the roots — the actual primary sources underlying any claim. The richness or poverty of that root system is crucial data.

---

### Actor

An **actor** is any agent in history — individual, family, institution, or group.

**Actor types:**

```
PERSON
├── Historical figure
├── Legendary/mythological figure
├── Author/source creator
└── Modern researcher

FAMILY/LINEAGE
├── Royal dynasty
├── Noble house
├── Family tree (user-contributed)
└── Institutional succession

INSTITUTION
├── Government
├── Religious body
├── Military organization
├── Company/commercial entity
└── Academic institution

GROUP
├── Ethnic/cultural group
├── Military unit
├── Movement/school of thought
└── Unnamed collective ("the Greeks say...")
```

**Key properties:**
- Names (may have multiple across time/sources)
- Type and subtype
- Temporal bounds (birth/death, founding/dissolution)
- Relationships to other actors
- Stake in historical narratives (were they biased?)

---

### Artifact

An **artifact** is physical evidence — objects, structures, documents as physical items.

**Artifact types:**

```
STRUCTURE
├── Building
├── Monument
├── Infrastructure (road, aqueduct, wall)
└── Site (archaeological location)

OBJECT
├── Tool/weapon
├── Art/sculpture
├── Coin/currency
├── Personal item
└── Religious/ritual object

DOCUMENT (as physical item)
├── Manuscript
├── Inscription
├── Tablet
├── Seal/stamp
└── Map

REMAINS
├── Human remains
├── Biological specimens
├── Geological samples
└── Environmental evidence
```

**Key properties:**
- Current location
- Original location (if known/different)
- Physical description
- Raw dating evidence (inscriptions, physical tests, context)
- Frame-dependent dating (placements vary by interpretive frame)
- Examination history
- Photographic documentation
- Anomalies noted

**Artifact vs. Source:**
An artifact can *be* a source (a manuscript is both a physical object and a source of claims). But they're tracked separately because:
- The physical properties matter (ink, paper, construction)
- The artifact may survive when the content is lost
- Physical examination may contradict claimed dating

---

### Location

A **location** is a place — modern or historical, precise or regional.

**Location types:**

```
POINT
├── City/town
├── Building/structure
├── Archaeological site
└── Geographic feature (mountain peak, river confluence)

AREA
├── Region
├── Country/nation
├── Geographic zone
└── Cultural area

LINEAR
├── River
├── Road/route
├── Wall/boundary
└── Coastline
```

**Key properties:**
- Modern name(s)
- Historical name(s) with periods of use
- Coordinates (in chosen reference system)
- Uncertainty radius
- Location over time (if it shifted)
- Climate/environment over time

**The geographic challenge:**
Places change. Coastlines shift. Cities move. Names are reused. A "location" is not a fixed point but a nexus of references that must be reconciled across sources and time.

---

### Connection

A **connection** is a relationship between any two entities.

**Connection types:**

```
TEMPORAL
├── preceded_by / followed_by
├── contemporary_with
├── during
├── generations_after
└── caused / resulted_from

SPATIAL
├── located_at
├── traveled_to / traveled_from
├── near / far_from
└── part_of (region)

RELATIONAL (actors)
├── parent_of / child_of
├── married_to
├── ruled / served
├── allied_with / opposed_to
├── employed_by / employed
└── influenced / influenced_by

EVIDENTIAL
├── supports / contradicts
├── cites / cited_by
├── corroborates
├── derives_from
└── resembles

CREATIVE
├── built / destroyed
├── wrote / authored
├── commissioned
├── owned
└── discovered / excavated
```

**Key properties:**
- From entity (any type)
- To entity (any type)
- Connection type
- Evidence (source references)
- Confidence
- Notes

**Connections are first-class data:**
The relationships between things often matter more than the things themselves. Tracing connections reveals patterns invisible when looking at isolated facts.

---

## Meta-Entities

### Frame (Reference Frame)

A **frame** is a coherent chronological/interpretive framework that defines how dates are calculated and where factoids are placed in time.

**Frame components:**
- Which anchors are trusted (astronomical, documentary, traditional)
- What calendar system is used
- What epoch offsets are applied
- What sources are given weight
- Which extensions/interpretations are adopted

**System frames (starting set):**
- **Mainstream Academic**: Conventional scholarly chronology
- **Astronomical Anchors**: Only trusts calculable astronomical events (eclipses, comets)
- **Raw Evidence**: Prioritizes physical dating methods (dendrochronology, C14, ice cores)
- **Fomenko**: Applies New Chronology compression
- **Newton's Chronology**: Isaac Newton's revised ancient dating
- **Biblical**: Events anchored to biblical timeline

**User/community frames:**
Users and communities can create custom frames, selecting which anchors to trust and which interpretations to adopt. The system is designed to be extensible — these are starting points, not limits.

**Frame is not truth:**
A frame is an interpretive system. No frame is privileged as "correct." Mainstream is itself a frame, not a baseline. The user chooses which frame(s) to view through consciously.

**Frame vs. Lens:**
Frames affect *interpretation* (where things land in time). Lenses affect *presentation* (what subset you see). See Lens below.

---

### Lens

A **lens** is a view configuration that defines what subset of data you're looking at and how it's displayed.

**Lens vs. Frame:**
- Frame = chronological framework (affects WHERE factoids land in time)
- Lens = filter/scope/display settings (affects WHAT you see)

**Lens components:**
```
LENS
├── name: "Battle of Vienna Lesson"
├── created_by: user
├── frame_selection: [which frame(s) to view through]
├── time_bounds: [date range to show]
├── geographic_bounds: [locations to include]
├── factoid_filters:
│   ├── layers: [documented, attested, etc.]
│   ├── tags: [include/exclude]
│   └── namespaces: [which communities]
├── selected_factoids: [specific items pinned to view]
├── display_options: [what to show/hide]
└── shareable: true/false
```

**Use cases:**
- History teacher preparing a lesson on 1683 Vienna
- Researcher exploring Bronze Age Mediterranean
- Documentary maker gathering material on Sea Peoples
- Personal workspace for ongoing research

**Lenses are:**
- Personal or shared
- Ephemeral or saved
- Many per user (cheap to create)
- Used for presentation mode, exports, lessons

**Frames are:**
- Community-maintained or system-defined
- Persistent and significant
- Fewer in number (represent coherent worldviews)
- Define how chronology works, not what you're looking at

---

### Namespace

A **namespace** is a community workspace for shared interpretation.

**Namespace types:**

```
CORE
└── Only documented/attested data
    Strict sourcing requirements
    No interpretation, just observations

COMMUNITY
├── "Megalithic Researchers"
├── "Alternative Chronology"
├── "Biblical History"
├── "Mythological Mapping"
└── [User-created communities]
    Each can add interpretations
    Each can build connection patterns
    Tagged as belonging to that namespace
```

**Namespace isolation:**
Contributions within a namespace don't pollute other namespaces. A speculative connection in "Mythological Mapping" doesn't affect the core data layer. Users choose which namespaces to view.

**Cross-namespace convergence:**
When multiple namespaces independently reach the same conclusion, that's significant signal. The system tracks cross-namespace agreement as a special form of corroboration.

---

### Epistemological Layer

Content is stratified by how well-established it is:

```
LAYER 1: DOCUMENTED
├── Events with primary sources
├── Multiple independent verifications
├── Physical artifacts examined
└── Highest confidence

LAYER 2: ATTESTED
├── Events with secondary sources
├── Single primary source
├── Reasonable chain of custody
└── Document exists, content uncertain

LAYER 3: TRADITIONAL
├── Oral histories
├── Cultural memory
├── Myths with potential historical kernel
└── "Many cultures say this"

LAYER 4: THEORETICAL
├── Researcher interpretations
├── Connections proposed but not verified
├── "What if" explorations
└── Competing theories

LAYER 5: SPECULATIVE
├── Creative exploration
├── Mythological timelines
├── Experimental frameworks
└── Explicitly provisional
```

**Layer tagging:**
Every factoid is tagged with its layer. Users can filter by layer. The system doesn't prevent speculative content — it separates it clearly from documented content.

---

### Anchor

An **anchor** is a dating reference point with varying degrees of reliability.

**Anchor types:**

```
HARD ANCHORS (high confidence)
├── Astronomical events (eclipses calculable backwards)
├── Dendrochronology (where sequences are solid)
├── Radiometric dating (with margins)
└── Living memory (<150 years from documentation)

SOFT ANCHORS (medium confidence)
├── Mainstream epoch dates
├── King lists with uncertain continuity
├── Documents of uncertain provenance
└── Conventional scholarly dating

RELATIONAL ANCHORS (relative confidence)
├── "X years after Y"
├── "During the reign of Z"
├── "Three generations after"
└── Sequence without absolute dating
```

**Anchor independence:**
The strength of a date depends on how many *independent* anchors support it. Circular anchoring (A dates B, B dates A) is detected and flagged.

---

## Derived Concepts

### Confidence Score

A calculated metric reflecting how well-supported a claim is.

**Factors:**
- Source depth (how many layers to primary source)
- Source independence (truly independent verification)
- Source quality (primary > secondary > tertiary)
- Corroboration (multiple sources agreeing)
- Contradiction (sources disagreeing)
- Physical evidence (archaeological support)
- Cross-community agreement (multiple frames/namespaces)

**Two confidence types:**
- **Community confidence**: How sure a particular community/namespace is
- **Core confidence**: How sure we can actually be based on verified independence

These may diverge. A community may be very confident in something with weak core support. The divergence itself is informative.

### Source Tree

The citation ancestry of any claim.

**Metrics derived:**
- **Root count**: How many independent primary sources?
- **Root depth**: How many layers to deepest root?
- **Concentration risk**: What % traces to single root?
- **Cycle detection**: Do sources cite each other circularly?

**Visualization:**
The source tree can be displayed, showing the canopy (many citing sources) narrowing to roots (few or single origin). This visualization is central to the project's mission.

### Frame Divergence

The degree to which a factoid's temporal placement varies across different frames.

**Measurement:**
Rather than a single "gap" between two dates, divergence captures how much a factoid's position spreads when viewed through multiple frames.

```
divergence = spread of placements across active frames
```

**What high divergence indicates:**
- Contested chronology for this event/claim
- Frames disagree significantly on interpretation
- Dating evidence is ambiguous or frame-dependent

**What low divergence indicates:**
- General agreement across interpretive frameworks
- Strong anchoring (astronomical, physical evidence)
- Less contested chronology

**Clustered divergence:**
When many factoids in a region/period show high divergence together, this suggests systematic disagreement about that era — not just individual contested claims.

---

## Relationships Between Concepts

```
┌─────────────┐         ┌─────────────┐
│   FRAME     │         │    LENS     │
│ (chronology │         │ (view/filter│
│  framework) │         │  workspace) │
└──────┬──────┘         └──────┬──────┘
       │                       │
       │    ┌──────────────────┘
       │    │ selects frame(s)
       ▼    ▼
┌─────────────────────┐
│  FACTOID PLACEMENT  │
│  (factoid + frame   │
│   = temporal pos)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐    ┌─────────────┐
│      FACTOID        │◀───│  NAMESPACE  │
│  (claim from source)│    │ (community  │
│                     │    │  workspace) │
│  - raw observation  │    └─────────────┘
│  - extensions       │
│  - confidence       │    ┌─────────────┐
│  - layer            │◀───│  EXTENSION  │
└──────────┬──────────┘    │(interpretive│
           │               │   layer)    │
┌──────────┴──────────┐    └─────────────┘
│                     │
▼                     ▼
┌─────────┐    ┌──────────────────────────┐
│ SOURCE  │    │   ACTOR/ARTIFACT/LOCATION│
│ - cites │    └────────────┬─────────────┘
│ - cited │                 │
└────┬────┘                 │
     │                      ▼
     │                ┌───────────┐
     └───────────────▶│CONNECTION │
                      │(relations)│
                      └───────────┘
```

---

## Naming Conventions

Throughout the system:

- **Entities** are singular (Factoid, Source, Actor, Extension, Placement)
- **Tables** use snake_case plural (factoids, sources, actors, extensions, placements)
- **Fields** use snake_case (raw_observation, date_start, frame_id)
- **Types** use UPPER_SNAKE_CASE (PRIMARY_SOURCE, HARD_ANCHOR, DATING_INTERPRETATION)
- **Frames** are user-readable ("Mainstream Academic", "Astronomical Anchors")
- **Lenses** are user-readable ("Battle of Vienna Lesson", "My Bronze Age Research")
- **Namespaces** are user-readable ("Megalithic Researchers")

---

## Open Questions

- **Factoid granularity**: How fine-grained should factoids be? One claim per factoid, or can a factoid contain multiple related claims?

- **Connection confidence**: Should connections have their own confidence scores separate from the factoids they connect?

- **Namespace governance**: How are community namespaces created and moderated? Who decides if a namespace is legitimate?

- **Layer boundaries**: Where exactly is the line between "attested" and "traditional"? Who decides?

- **Extension adoption**: When a frame adopts an extension, does it automatically apply to all relevant factoids? Or is adoption per-factoid?

- **Frame composition**: Can frames inherit from other frames? (e.g., "Mainstream + my adjustments")

- **Lens sharing**: What permissions model for shared lenses? View-only? Forkable?

- **Placement conflicts**: Can the same user place the same factoid in the same frame multiple times with different interpretations? Or one placement per user per frame?

---

## Dependencies

This document is foundational. All other documents depend on these definitions.

---

## Next Steps

With concepts defined, proceed to:
- **02-data-model.md**: Full database schema implementing these concepts
- **03-source-system.md**: Deep dive on source tracking and citation trees
