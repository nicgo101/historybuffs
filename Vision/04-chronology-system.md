# Chronology System

## Overview

The chronology system is built on a radical premise: **time is not the foundation — relationships are.**

Conventional historical tools place events on a fixed timeline and assume the dates are settled. This system inverts that: it stores relationships between events (A happened 15 years after B), dates those relationships with varying confidence, and allows multiple chronological frameworks to coexist.

The result: users can toggle between mainstream chronology and alternatives, watching events shift and cluster differently. The gaps between frameworks become visible data.

---

## Core Principles

### 1. Multi-Frame Dating via Placements
Dates are not stored directly on factoids. Instead, factoids have **placements** — frame-dependent temporal positions. The same factoid can have different dates in different reference frames.

- **Raw observation**: What we actually see (e.g., "inscription says Year 5 of King X")
- **Placements**: Where this lands in each frame (Mainstream: 1250 BCE, Fomenko: 250 CE, etc.)
- **Frame divergence**: When placements vary significantly across frames, that divergence is informative data

No frame is privileged as "true." Mainstream is itself a frame, not a baseline.

### 2. Relational Time
The relationship between events is often more reliable than absolute dates.

```
NOT: Event A = 1450 AD, Event B = 1465 AD
BUT: Event A (claimed 1450), Event B (claimed 1465)
     Relationship: B occurred 15 years after A (high confidence)
```

If the absolute dates shift, the relationship holds. If the relationship breaks, something is wrong with the narrative.

### 3. Anchors Have Hierarchy
Not all dating evidence is equal:
- Astronomical events calculable backward = hard anchor
- King list with uncertain continuity = soft anchor
- "During the reign of X" = relational anchor

Users choose which anchors to trust. The system recalculates accordingly.

### 4. Frameworks Are Lenses
A "reference frame" is a set of anchor choices and epoch assumptions. Mainstream history is one frame. Fomenko's compressed chronology is another. Neither is privileged as "true" — both are available for exploration.

### 5. Gaps Are Data
When mainstream and evidence dates diverge, that divergence tells us something. We don't resolve it by picking one — we display both and let the gap speak.

---

## User Stories

### Explorer
- As an explorer, I want to toggle between chronological frameworks, so I can see how events cluster differently.
- As an explorer, I want to see which anchors support a date, so I can evaluate its reliability.
- As an explorer, I want to visualize frame divergence, so I can spot contested periods where frames disagree.

### Researcher
- As a researcher, I want to enter raw observations separately from interpreted dates, so the evidence is preserved.
- As a researcher, I want to create placements in different frames, so I can explore alternative chronologies.
- As a researcher, I want to specify date precision (exact, year, decade, century), so uncertainty is explicit.
- As a researcher, I want to record relational time ("X years after Y"), so relationships are captured even when absolute dates are uncertain.
- As a researcher, I want to build event chains, so temporal structure is visible.

### Alternative Chronologist
- As an alternative chronologist, I want to create custom reference frames, so I can explore different chronological models.
- As an alternative chronologist, I want to see which events would cluster together under my framework, so patterns emerge.
- As an alternative chronologist, I want to share my frame with others, so they can evaluate my model.

### Skeptic
- As a skeptic, I want to see what anchors a date depends on, so I can evaluate the chain.
- As a skeptic, I want to identify circular dating (A dates B, B dates A), so I can spot artificial support.
- As a skeptic, I want to see dates that have only soft anchors, so I know where uncertainty is hidden.

---

## Date Representation

### Placement-Based Dating

Dates are stored in **placements**, not directly on factoids. A factoid can have multiple placements — one per frame it's been placed in.

```
FACTOID
├── raw_observation: "Inscription says Year 5 of Ramesses II"
├── raw_observation_type: inscription
└── [no dates stored here]

FACTOID_PLACEMENTS (for this factoid)
├── Mainstream Academic frame: 1275 BCE (high confidence)
├── Astronomical Only frame: [not placed - no direct anchor]
├── Fomenko frame: 275 CE (based on compressed chronology)
└── User's Research frame: 1275 BCE (adopted from mainstream)

Each placement has:
├── date_start, date_end
├── date_precision
├── placement_confidence
├── reasoning
└── extension_id (which interpretation it's based on)
```

### Precision Levels

```
EXACT       - Known to the day
YEAR        - Known to the year
DECADE      - Known to ~10 years
CENTURY     - Known to ~100 years
MILLENNIUM  - Known to ~1000 years
UNKNOWN     - No reliable dating
```

Precision affects display and calculations. A "1450 AD ± century" is very different from "1450 AD exact."

### Frame Divergence

Instead of a single "gap" between two dates, we measure how much a factoid's position varies across frames:

```python
def calculate_frame_divergence(factoid_id, frame_ids):
    """
    Calculate how much a factoid's placement varies across selected frames.
    High divergence = contested chronology for this event.
    """
    placements = get_placements(factoid_id, frame_ids)

    if len(placements) < 2:
        return None  # Need multiple frames to compare

    dates = [p.date_start for p in placements if p.date_start]

    if not dates:
        return None

    spread_years = (max(dates) - min(dates)).days / 365.25

    return {
        'spread_years': spread_years,
        'frame_count': len(placements),
        'divergence_level': categorize_divergence(spread_years),
        'frames_agree': spread_years < 10,
        'most_different': identify_outlier_frames(placements)
    }

def categorize_divergence(years):
    if years < 10:
        return 'minimal'      # Frames roughly agree
    elif years < 50:
        return 'notable'      # Some disagreement
    elif years < 200:
        return 'significant'  # Major disagreement
    else:
        return 'extreme'      # Frames fundamentally conflict
```

### Divergence Patterns

**Low divergence (frames agree)**
- Event is well-anchored
- Dating methodology is consistent
- Less contested

**High divergence (frames disagree)**
- Dating depends heavily on frame assumptions
- Contested chronology
- Worth investigating why frames differ

---

## Relational Time

### Concept

Instead of (or in addition to) absolute dates, store relationships:

```
CONNECTION:
  from_entity: "Reign of King X"
  to_entity: "Construction of Temple Y"
  connection_type: "during"
  
CONNECTION:
  from_entity: "Battle of Z"
  to_entity: "Death of General W"
  connection_type: "followed_by"
  delta_value: 15
  delta_unit: "years"
  delta_confidence: "approximate"
```

### Delta Types

```
EXACT DELTA
- "15 years, 3 months, 2 days after"
- High confidence, specific

APPROXIMATE DELTA
- "About 15 years after"
- Known imprecision

GENERATIONAL DELTA
- "Three generations after"
- ~25-30 years per generation, compounding uncertainty

REIGN DELTA
- "In the 5th year of King X's reign"
- Depends on knowing when reign started

RELATIVE ONLY
- "After", "before", "during"
- Sequence known, interval unknown
```

### Relational Chain Resolution

When absolute dates are unknown but relationships exist, the system can propagate from anchors:

```
KNOWN: Battle of X = 490 BCE (astronomical anchor)
KNOWN: Treaty of Y occurred 10 years after Battle of X
CALCULATED: Treaty of Y = 480 BCE

KNOWN: King Z's reign began 3 generations before Treaty of Y
CALCULATED: King Z's reign ≈ 555-570 BCE (with generational uncertainty)
```

This propagation is explicit — users see the chain and its cumulating uncertainty.

---

## Event Chains

### Concept

An **event chain** is a sequence of connected events with known temporal relationships. Chains are the structural backbone of chronology — more reliable than absolute dates, and the foundation for anchor propagation.

```
CHAIN: "Life of Julius Caesar"
├── Birth
│   ↓ ~40 years
├── Crosses the Rubicon
│   ↓ 4 years
├── Becomes Dictator
│   ↓ 1 year
├── Assassination ◆ ANCHORED (March 15, 44 BCE - well documented)
│
└── Anchor propagates UP the chain:
    - Dictator: ~45 BCE
    - Rubicon: ~49 BCE
    - Birth: ~100 BCE (with compounding uncertainty)
```

### Why Chains Matter

**1. Relative time is more reliable than absolute**
- "The siege lasted 7 months" - from primary sources
- "The siege was in 332 BCE" - requires anchor chain
- The duration survives even if absolute dates shift

**2. One anchor illuminates entire chains**
- Anchor a single event (eclipse, documented death)
- All connected events get approximate dates
- Connected chains also inherit dating

**3. Chains reveal structure**
- See how events connect causally
- Identify where chains branch (successions, wars)
- Find synchronization points between cultures

**4. Chains expose problems**
- If a chain's total duration exceeds available time → something's wrong
- If two chains conflict at a synchronization point → dating issue
- If a chain has no anchors → all dates are relative only

### Chain Components

```
EVENT CHAIN
├── Identity
│   ├── name: "Reign of Ramesses II"
│   ├── description
│   └── chain_type: biographical, dynastic, campaign, institutional
│
├── Span
│   ├── total_duration (calculated from links)
│   ├── duration_confidence
│   └── duration_unit (days, years, generations)
│
├── Anchors
│   ├── anchor_points: events with hard anchors
│   ├── anchor_count
│   └── strongest_anchor
│
└── Connections
    ├── branches_to: [other chains]
    ├── merges_from: [other chains]
    └── synchronizes_with: [other chains]


CHAIN LINK (connection between events in a chain)
├── from_factoid_id
├── to_factoid_id
├── sequence_order (1, 2, 3...)
│
├── Delta
│   ├── delta_value: 15
│   ├── delta_unit: days | months | years | generations | reigns
│   ├── delta_confidence: exact | approximate | estimated | unknown
│   └── delta_source_id (where we got this interval)
│
├── Link Type
│   ├── sequential: A then B (no direct causation)
│   ├── causal: A caused B
│   ├── genealogical: parent/child/sibling
│   └── duration: A lasted until B (same entity)
│
└── Bidirectional
    └── If A→B is "15 years before", B→A is "15 years after"
```

### Chain Types

**Biographical Chain**
```
Person's life: Birth → Education → Marriage → Children → Career events → Death
             ↓                    ↓
             Links to parent      Links to spouse's
             chains               chain
```

**Dynastic Chain**
```
Succession: King A (40 year reign) → King B (15 years) → King C (28 years)
                                   ↓
                                   Total: 83 years
                                   Anchor any one → date them all
```

**Campaign Chain**
```
Military: Mobilization → March (15 days) → Battle → Siege (7 months) → Treaty
                        ↓
                        Detailed timing often preserved in sources
```

**Institutional Chain**
```
Organization: Founded → Key events → Reforms → Dissolution
             ↓
             Often spans centuries, connects to many biographical chains
```

### Chain Connections

Chains don't exist in isolation — they connect, branch, and synchronize.

**Branching (one chain spawns others)**
```
Alexander's Death
       ↓
    ┌──┴──┬──────┬──────┐
    ↓     ↓      ↓      ↓
Ptolemy  Seleucus  Antigonus  Cassander
Chain    Chain     Chain      Chain
```

**Merging (chains come together)**
```
Caesar's Chain ────┐
                   ├──→ Battle of Pharsalus
Pompey's Chain ────┘
                         ↓
                   Caesar's Chain continues
                   Pompey's Chain ends
```

**Synchronization (chains touch at a point)**
```
Egyptian Chain                    Greek Chain
      │                                │
  Ramesses II ───── synchronizes ───── Trojan War (?)
      │            (claimed in          │
      │             some sources)       │

If true: anchoring either anchors both
If false: reveals dating problem
```

### Anchor Propagation

When an event in a chain gets anchored, dates propagate:

```
CHAIN: Early Roman Kings (traditional)

Romulus (37 years) → Numa (43 years) → Tullus (32 years) → Ancus (24 years)
                                                                   ↓
                                                          ◆ ANCHOR:
                                                          Foundation of Ostia
                                                          (archaeological)
                                                          ~620 BCE

PROPAGATION (backward):
- Ancus starts: ~640 BCE (620 + ~20 years into reign)
- Tullus starts: ~672 BCE (640 + 32)
- Numa starts: ~715 BCE (672 + 43)
- Romulus starts: ~752 BCE (715 + 37)

CONFIDENCE DECAY:
- Ancus: High (near anchor)
- Tullus: Medium (one link away)
- Numa: Lower (two links, reign lengths uncertain)
- Romulus: Low (three links, possibly legendary)
```

### Chain Visualization

**Linear Chain View**
```
──●────────●────────●────────●────────●────────●──
  Birth    Marriage  War     Eclipse  Crowned  Death
  │        │         │       ◆        │        │
  │←─20y──→│←──5y───→│←─2y──→│←─10y──→│←─15y──→│
  │                          │
  │                          ANCHOR: known date
  │←──────── dates calculated from anchor ────────→│
```

**Branching Chain View**
```
                    Philip II
                        │
           ┌────────────┼────────────┐
           ↓            ↓            ↓
      Alexander    Cleopatra    Philip III
           │      (to Epirus)        │
     ┌─────┼─────┐                   ↓
     ↓     ↓     ↓              Arrhidaeus
  Roxana  Heir  Wars                 │
     │                               │
     └───────────────────────────────┘
                    │
            Succession Wars
```

**Synchronized Chains**
```
Egypt                  Hittites                Babylon
  │                       │                       │
  ●─────────────────●─────●───────────────────────●
  │    Battle of    │     │                       │
  │     Kadesh      │     │                       │
  │    (sync point) │     │                       │
  ●─────────────────●     │                       │
  │                       ●───────────────────────●
  │                       │    Treaty             │
```

### Chains in Extraction

When extracting from sources, many events naturally form chains:

**Source text**: "In the third year of his reign, the king marched for fifteen days to reach the enemy. After a siege of seven months, the city fell. The king returned home where he died two years later."

**Extracted chain**:
```
CHAIN: "King's Final Campaign"
├── Reign begins (reference point)
│   ↓ 3 years
├── March begins
│   ↓ 15 days
├── Arrives at city / Siege begins
│   ↓ 7 months
├── City falls
│   ↓ [travel time - unknown]
├── Returns home
│   ↓ ~2 years
└── Death

Extraction captures:
- Events (factoids)
- Temporal links (deltas)
- What's known vs unknown (travel time missing)
```

### Chain Integrity Checks

**Duration consistency**
```
If: Dynasty lasted 200 years (documented)
And: Sum of reign lengths = 250 years
Then: Problem - either total or individual reigns wrong
```

**Synchronization consistency**
```
If: Egyptian king X synchronizes with Hittite king Y
And: X's chain puts him at 1250 BCE
And: Y's chain puts him at 1180 BCE
Then: One chain (or synchronization) is wrong
```

**Lifespan plausibility**
```
If: Birth to death span = 150 years
Then: Flag for review (not impossible, but unlikely)
```

### Open Questions for Chains

- **Chain ownership**: Can chains span multiple extraction sets? (e.g., Alexander's chain from Greek + Persian + Egyptian sources)

- **Conflicting links**: If source A says "15 years" and source B says "20 years", how to represent?

- **Generational uncertainty**: Standard assumption is ~25-30 years/generation. Should this be configurable per frame?

- **Chain confidence scoring**: How to calculate overall chain confidence from link confidences?

---

## Anchor System

### Anchor Types

```
HARD ANCHORS (high confidence, independent of texts)
├── Astronomical
│   ├── Solar eclipses (calculable to the minute)
│   ├── Lunar eclipses
│   ├── Comets with known periods (e.g., Halley's)
│   └── Planetary conjunctions
├── Dendrochronology
│   ├── Tree ring sequences (where continuous)
│   └── Radiocarbon calibration curves
├── Radiometric
│   ├── Carbon-14 (with calibration caveats)
│   ├── Other isotopic methods
│   └── (Always with margin of error)
└── Living Memory
    └── Events within ~150 years of documentation

SOFT ANCHORS (medium confidence, text-dependent)
├── Documentary
│   ├── King lists
│   ├── Chronicle sequences
│   └── Administrative records
├── Archaeological
│   ├── Stratigraphy (relative)
│   └── Pottery sequences (relative)
└── Traditional
    ├── "Foundation of Rome = 753 BCE"
    ├── Epoch dates by convention
    └── Religious calendars

RELATIONAL ANCHORS (relative confidence)
├── Synchronisms
│   ├── "In the same year as..."
│   └── Cross-cultural mentions
├── Generational
│   ├── King lists with reign lengths
│   └── Family trees
└── Sequential
    └── Event A before Event B (no interval)
```

### Anchor Records

```sql
-- Example anchor records

-- Hard anchor: astronomical
INSERT INTO anchors (factoid_id, description, anchor_type, anchor_date, confidence, methodology) 
VALUES (
    'uuid-battle-factoid',
    'Eclipse during battle mentioned by Herodotus calculable to Aug 15, 310 BCE',
    'astronomical',
    '0310-08-15 BCE',
    0.95,
    'NASA eclipse calculator cross-referenced with textual description of location and time of day'
);

-- Soft anchor: documentary
INSERT INTO anchors (factoid_id, description, anchor_type, anchor_date, confidence, challenges)
VALUES (
    'uuid-reign-start',
    'Start of Pharaoh X reign per king list',
    'documentary',
    '1479-01-01 BCE',
    0.60,
    'King list has uncertain gaps; date depends on earlier reign lengths being accurate'
);
```

### Anchor Chain Visualization

For any dated event, show the anchor chain:

```
┌─────────────────────────────────────────────────────┐
│ EVENT: Construction of Temple X                     │
│ MAINSTREAM DATE: 1250 BCE                           │
│ EVIDENCE DATE: 1250 BCE (matches)                   │
├─────────────────────────────────────────────────────┤
│ ANCHOR CHAIN                                        │
│                                                     │
│ ┌─ Dated inscription on temple                      │
│ │  "Year 5 of Ramesses II"                          │
│ │  Confidence: HIGH (primary source)                │
│ │                                                   │
│ └─► Requires knowing when Ramesses II reign began   │
│     │                                               │
│     ├─ King list gives reign sequence               │
│     │  Confidence: MEDIUM (some gaps in list)       │
│     │                                               │
│     └─► Anchored by:                                │
│         │                                           │
│         ├─ Lunar eclipse in Year 52 of Ramesses II  │
│         │  Calculated: 1213 BCE                     │
│         │  Confidence: HIGH (astronomical)          │
│         │                                           │
│         └─ Sothic cycle observation                 │
│            Confidence: MEDIUM (assumptions about    │
│            observation location)                    │
│                                                     │
│ OVERALL CHAIN CONFIDENCE: 0.72                      │
│ WEAKEST LINK: King list continuity                  │
└─────────────────────────────────────────────────────┘
```

---

## Reference Frames

### Concept

A reference frame is a configuration that determines:
- Which anchor types are trusted
- What epoch offset (if any) is applied
- What calendar system is used
- Any custom anchor overrides

Different frames show history differently. The same data, viewed through different frames, may cluster events differently.

### Built-in Frames

```
MAINSTREAM
- Trusts all anchor types
- Conventional calendar (Gregorian/Julian)
- No epoch offset
- Standard academic chronology

ASTRONOMICAL ONLY
- Trusts only hard astronomical anchors
- Everything else floats
- Many events become undated
- Shows how much depends on soft anchors

COMPRESSED (Fomenko-style)
- Applies ~1000 year compression
- Removes "phantom centuries"
- Controversial but explorable
- User sees how events would cluster

EVIDENCE-BASED
- Trusts hard anchors
- Trusts archaeology
- Distrusts king lists and chronicles
- Documentary dates shown as tentative
```

### Custom Frames

Users can create personal frames:

```javascript
{
  name: "My Research Frame",
  description: "Testing whether removing Byzantine chronology changes clustering",
  
  anchor_trust: {
    astronomical: true,
    dendro: true,
    radiometric: true,
    documentary: false,  // Don't trust texts
    traditional: false
  },
  
  epoch_offset_years: 0,
  calendar_system: "gregorian",
  
  anchor_overrides: {
    "anchor-uuid-1": { trust: false, reason: "Disputed eclipse identification" },
    "anchor-uuid-2": { trust: true, adjustment_years: -50 }
  }
}
```

### Frame Switching

When user switches frames:

1. All dates recalculate based on frame settings
2. Events without trusted anchors become "undated" in that frame
3. Relational chains recalculate from trusted anchors
4. Gap visualization updates
5. Clusters may shift

The data doesn't change — the lens changes.

---

## Calendar Systems

### The Problem

History uses many calendars:
- Julian (pre-Gregorian Europe)
- Gregorian (post-1582, varying adoption)
- Byzantine (creation era)
- Islamic (Hijri)
- Hebrew
- Chinese
- Various ancient systems

Converting between them requires:
- Knowing which calendar the source used
- Handling varying adoption dates
- Dealing with pre-calendar periods

### Approach

Store dates internally in a neutral format (Julian Day Number or ISO date with era marker). Display converts to user's preferred calendar or source's original calendar.

```python
class HistoricalDate:
    julian_day: float  # Internal storage
    
    original_calendar: str  # What calendar the source used
    original_representation: str  # How the source expressed it
    
    def to_gregorian(self) -> str: ...
    def to_julian(self) -> str: ...
    def to_byzantine(self) -> str: ...
    # etc.
```

### BCE/CE Handling

No year 0 in historical convention (1 BCE → 1 CE). Astronomical convention has year 0. We support both:

```
Historical: 44 BCE
Astronomical: -43

System stores astronomical internally
Display converts based on user preference
```

---

## Timeline Visualization

### Basic Timeline

```
        ─────────────────────────────────────────────────────►
        500 BCE        0        500 CE       1000 CE    1500 CE
        
        ●─────● Greek Classical Period
                    ●───────● Roman Republic → Empire
                              ●─────────────────● Byzantine
                                        ●───────● Medieval Europe
                    
        [Mainstream Frame]
```

### Multi-Frame Timeline (Divergence Visualization)

```
MAINSTREAM:    ──●────────●────────●────────●────────●──────►
               500 BCE    0    500 CE   1000 CE  1500 CE

               Event A    |    Event B    |    Event C
                          |               |
                          |  ═══ DIVERGENCE ZONE ═══
                          |               |
ASTRONOMICAL:  ──●────────●────●─────────●────────────●────►
               500 BCE    0   300 CE    700 CE    1500 CE

               Event A    |  Event B    Event C

          [ Events B and C have high divergence - frames disagree by 300+ years ]
          [ Event A has low divergence - frames agree ]
```

### Frame Comparison

Side-by-side timelines showing how events cluster differently under different frames:

```
┌─────────────────────┬─────────────────────┐
│   MAINSTREAM        │   COMPRESSED        │
├─────────────────────┼─────────────────────┤
│         ●           │                     │
│    Rome Founded     │                     │
│      753 BCE        │         ●           │
│                     │    Rome Founded     │
│         ●           │      ~250 BCE       │
│   Trojan War        │         ●           │
│    1180 BCE         │    Trojan War       │
│                     │      ~300 BCE       │
│         ●           │                     │
│   Exodus            │         ●           │
│   ~1450 BCE         │      Exodus         │
│                     │      ~250 BCE       │
├─────────────────────┼─────────────────────┤
│ Events spread over  │ Events compressed   │
│ ~700 years          │ into ~100 years     │
└─────────────────────┴─────────────────────┘
```

---

## Features

### MVP (Phase 1)

**Raw observation and placement entry**
- Enter raw observations (what the source actually says)
- Create placements in frames (where it lands temporally)
- Precision selection per placement
- Basic confidence

**Simple timeline view**
- Linear timeline with events from selected frame
- Zoom and pan
- Click for details

**Frame toggle**
- Switch between system frames (Mainstream, Astronomical, etc.)
- Watch events shift position
- See which events disappear (no placement in that frame)

**Basic event chains**
- Create chains linking events
- Enter temporal deltas between events
- See chain structure

### Phase 2

**Full chain support**
- Chain visualization (linear and branching)
- Anchor propagation through chains
- Chain integrity checks
- Cross-chain synchronization

**Anchor management**
- View anchors for any date
- Add new anchors
- Mark anchor type and confidence
- See anchor chains

**Frame divergence visualization**
- Highlight high-divergence events
- Filter by divergence level
- Pattern detection across periods

**Custom frames**
- User-created frame configurations
- Frame inheritance (base frame + modifications)
- Share frames with community

### Phase 3 (Dream)

**Animated frame transitions**
- Watch events slide as frame changes
- See clusters form and dissolve

**Anchor chain visualization**
- Interactive graph of date dependencies
- Trace any date to its anchors

**Circular dating detection**
- Automated detection of A→B→A chains
- Visual flagging

**Multi-frame overlay**
- See 3+ frames simultaneously
- Identify frame-invariant events (stable across all frames)

**AI-assisted dating**
- Extract temporal markers from texts
- Suggest anchor links
- Identify dating contradictions

---

## Anti-Patterns

### Circular Dating

**Problem**: Event A dated by reference to Event B, Event B dated by reference to Event A.

**Detection**: Graph analysis of anchor chains for cycles.

**Display**: "⚠️ Circular dating detected" with cycle visualization.

### Phantom Precision

**Problem**: Source says "long ago" → compiled into "500 BCE" → cited as established date.

**Detection**: Trace precision through citation chain.

**Display**: "⚠️ Original source less precise than current claim."

### Anchor Concentration

**Problem**: Entire chronology depends on single anchor (e.g., one eclipse identification).

**Detection**: Calculate what percentage of dates trace to each anchor.

**Display**: "⚠️ 80% of dates in this period depend on single anchor."

### Frame Lock-In

**Problem**: User only ever uses one frame, never sees alternatives.

**Mitigation**: Periodically prompt "See how this looks in [other frame]?"

---

## Data Structures

### Factoid Placement

```typescript
interface FactoidPlacement {
  id: string;
  factoid_id: string;
  frame_id: string;

  // Temporal position in this frame
  date_start: Date | null;
  date_end: Date | null;
  precision: 'exact' | 'year' | 'decade' | 'century' | 'millennium';

  // Confidence
  confidence: number;  // 0-1
  reasoning: string;   // Why this date in this frame

  // Which interpretation this is based on
  extension_id?: string;

  // Who placed it
  placement_type: 'system' | 'community' | 'user';
  placed_by: string;
}
```

### Event Chain

```typescript
interface EventChain {
  id: string;
  name: string;
  chain_type: 'biographical' | 'dynastic' | 'campaign' | 'institutional' | 'genealogical';

  // Subject
  subject_entity_type: 'actor' | 'location' | 'artifact';
  subject_entity_id: string;

  // Calculated totals (cached)
  total_duration_value: number;
  total_duration_unit: 'days' | 'months' | 'years' | 'generations';
  duration_confidence: number;

  // Anchoring
  is_anchored: boolean;
  anchor_count: number;
  strongest_anchor_id?: string;
}

interface ChainLink {
  id: string;
  chain_id: string;
  sequence_order: number;

  from_factoid_id: string;
  to_factoid_id: string;

  delta_value?: number;
  delta_unit: 'days' | 'months' | 'years' | 'generations' | 'reigns';
  delta_confidence: 'exact' | 'approximate' | 'estimated' | 'unknown';

  link_type: 'sequential' | 'causal' | 'genealogical' | 'duration' | 'concurrent';

  source_id?: string;
  source_excerpt?: string;
}
```

### Reference Frame Configuration

```typescript
interface ReferenceFrame {
  id: string;
  name: string;
  slug: string;
  description: string;

  frame_type: 'system' | 'community' | 'user';

  // Anchor trust
  trust_settings: {
    astronomical: boolean;
    dendro: boolean;
    radiometric: boolean;
    documentary: boolean;
    traditional: boolean;
  };

  // Adjustments
  epoch_offset_years: number;
  calendar_system: string;

  // Inheritance
  parent_frame_id?: string;

  // Extension adoption
  adopted_extension_ids: string[];

  // Overrides
  anchor_overrides: Map<string, {
    trust: boolean;
    adjustment_years?: number;
    reason?: string;
  }>;

  // Metadata
  is_public: boolean;
  created_by: string;
}
```

### Frame Divergence

```typescript
interface FrameDivergence {
  factoid_id: string;
  frames_compared: string[];

  spread_years: number;
  divergence_level: 'minimal' | 'notable' | 'significant' | 'extreme';

  placements: Map<string, {  // frame_id -> placement
    date_start: Date;
    confidence: number;
  }>;

  frames_agree: boolean;
  outlier_frames: string[];  // Frames that differ most from others
}
```

---

## Open Questions

- **Negative dates**: How to handle BCE dates in database? Negative years? Separate era field?

- **Precision propagation**: When calculating from relational chains, how does precision degrade?

- **Frame versioning**: If a user modifies their frame, do old calculations need recalculating?

- **Default frame**: What frame should new users see by default? (Probably mainstream, but should we prompt them to explore?)

- **Frame conflicts**: If two users create similar frames, should they merge? How to handle namespace conflicts?

---

## Dependencies

- **01-core-concepts.md**: Anchor definitions, frame concept
- **02-data-model.md**: Schema for dates, anchors, frames
- **03-source-system.md**: Sources that provide dating evidence

---

## Technical Notes

### Date Storage

Using Julian Day Number internally simplifies calculations:
- JDN is continuous (no year 0 problem)
- Easy arithmetic for intervals
- Well-defined conversion algorithms

PostgreSQL `DATE` type works for most cases but struggles with very ancient dates and BCE. Consider custom type or numeric JDN storage.

### Performance

- Frame switching recalculates many dates — cache results per frame
- Relational chain resolution can be expensive — compute incrementally
- Timeline rendering with thousands of events needs virtualization

### API Endpoints (Preview)

```
GET /events?frame={frame_id}
GET /events/{id}/anchors
GET /events/{id}/date-chain
GET /frames
GET /frames/{id}
POST /frames
GET /timeline?start={date}&end={date}&frame={frame_id}
GET /gaps?min_years={n}&frame={frame_id}
POST /temporal-relations
```

---

## Summary

The chronology system embodies the project's philosophy: don't assert what's true, make structure visible. By treating dates as claims with varying support rather than settled facts, and by allowing multiple chronological frameworks to coexist, the system invites exploration rather than passive acceptance.

Time itself becomes a question, not an answer.
