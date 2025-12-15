# Frames, Lenses & Communities

## Overview

Three distinct concepts enable different researchers, communities, and perspectives to coexist:

| Concept | Purpose | Affects |
|---------|---------|---------|
| **Frame** | Chronological interpretation | WHERE things land in time |
| **Lens** | Curated view/collection | WHAT you see |
| **Community** | Social workspace | WHO works together |

### Reference Frames
Handle chronological perspectives - different anchor trust hierarchies, epoch offsets, calendar systems. The same factoid viewed through different frames may show different dates. Frames govern **placements** (where a factoid sits in time).

### Lenses
Curated collections of events that can be scoped geographically and temporally. A teacher's presentation on "Ancient Egypt", a YouTuber's video on "The Bronze Age Collapse", a researcher's exploration of "Mediterranean Trade Routes 500-200 BCE". Lenses define **what you see**, not where it sits chronologically.

### Communities (formerly Namespaces)
Social workspaces where research groups collaborate. Each community can have preferred frames, shared annotations, governance rules, and quality standards. Communities handle **who works together** and **frame-level interpretations**.

### Core Data
Beneath all three sits the **Core Data layer** - the shared foundation of "source says X" observations that all frames and communities build upon. Core Data is frame-independent and community-independent.

---

## Core Principles

### 1. Core Data is Sacred
The foundation is non-interpretive: "Source X says Y." Raw observations from sources exist independently of any frame or community. All enrichment to core data (tagging, describing, connecting) benefits the entire system.

### 2. Frame Data is Interpretation
How raw observations are placed in time, what they mean, which connections are emphasized - these live in frames. Different frames can place the same factoid at different dates without conflict.

### 3. No Privileged Frame
Mainstream chronology is a frame like any other. It may be the default for comparison, but it's not privileged as "true." The system is agnostic about which frame is correct.

### 4. Lenses Curate, Don't Interpret
Lenses select WHAT to show (geographic scope, temporal range, topic focus) but don't change WHERE things sit chronologically. A lens is always viewed through some frame.

### 5. Communities Own Interpretations
Each community can maintain their own frame with their own placements and extensions. A university research group's interpretations don't pollute an alternative chronology community's workspace.

### 6. Cross-Frame Convergence
When different frames independently place the same event at the same time, that's significant signal. The system tracks and surfaces convergence.

### 7. Transparency
Users always know which frame, lens, and community context they're viewing. Nothing is hidden.

---

## User Stories

### Explorer
- As an explorer, I want to toggle between frames, so I can see how dates shift under different chronological models.
- As an explorer, I want to browse lenses created by teachers/content creators, so I can learn about specific topics.
- As an explorer, I want to compare how different frames place the same events, so I understand chronological debates.

### Content Creator
- As a teacher, I want to create a lens for "Ancient Greece 500-300 BCE", so students can explore a curated selection.
- As a YouTuber, I want to save my research as a lens, so viewers can explore my video's content interactively.
- As a content creator, I want to share my lens with geographic and temporal bounds, so others can follow along.

### Researcher
- As a researcher, I want to create a custom frame, so I can test chronological hypotheses.
- As a researcher, I want to work within a community that shares my methodology, so my interpretations are understood in context.
- As a researcher, I want to see where my frame agrees with mainstream, so I identify robust conclusions.

### Community Builder
- As a community builder, I want to create a community for my research group, so we have a shared workspace.
- As a community builder, I want to set community guidelines and default frame, so new members understand our approach.
- As a community builder, I want to moderate our community's frame interpretations, so quality is maintained.

---

## Reference Frames

### What Is a Frame?

A reference frame is a configuration that determines:
- How different anchor types are weighted (tiered hierarchy)
- What epoch offset (if any) is applied
- What calendar system is used
- Any custom anchor overrides or placements

The same factoid viewed through different frames may show different dates based on how the frame interprets the underlying evidence.

### Anchor Hierarchy

All frames share the same anchor hierarchy, but differ in which tiers they trust:

```yaml
# ANCHOR TIERS (from hardest to softest):

tier_1_hard_anchors:
  description: "Mathematically verifiable, frame-independent"
  types:
    - astronomical_calculation  # Eclipses, comets - can be back-calculated
  status: "Hard anchor - all frames should respect"

tier_2_strong_scientific:
  description: "Countable, physically verifiable"
  types:
    - dendrochronology  # Tree rings - 1 ring = 1 year, cross-matched sequences
  status: "Near-anchor - very strong evidence"

tier_3_scientific_claims:
  description: "Scientific dating with methodological assumptions"
  types:
    - ice_cores  # Layering assumptions
    - radiocarbon  # Calibration debates, methodology disputes
    - thermoluminescence
  status: "Cite the source - frames decide weight"

tier_4_documentary:
  description: "Textual claims requiring interpretation"
  types:
    - king_lists  # May have gaps, propaganda
    - chronicles  # Author bias
    - inscriptions  # Dating context needed
  status: "Interpretive - frames may differ"

tier_5_traditional:
  description: "Cultural memory, oral tradition"
  types:
    - oral_history
    - legendary_accounts
    - genealogical_tradition
  status: "Speculative - use with care"
```

### Built-In Frames

```yaml
mainstream:
  name: "Mainstream Chronology"
  description: "Conventional academic dating system"

  anchor_weights:
    astronomical: 1.0      # Full trust
    dendro: 0.95           # Near-full trust
    radiocarbon: 0.85      # Standard scientific trust
    ice_cores: 0.80
    documentary: 0.70      # Trust established documents
    traditional: 0.30      # Low but considered

  epoch_offset_years: 0
  calendar_system: "gregorian"

  is_default: true
  is_builtin: true

  notes: |
    Useful as baseline for comparison. The "conventional"
    view, but not privileged as "true."

astronomical_only:
  name: "Astronomical Anchors Only"
  description: "Only trust hard astronomical calculations"

  anchor_weights:
    astronomical: 1.0      # Only hard anchors
    dendro: 0.0
    radiocarbon: 0.0
    ice_cores: 0.0
    documentary: 0.0
    traditional: 0.0

  notes: |
    Many events become undated in this frame. Shows how much
    of our chronology depends on softer evidence.

dendro_anchored:
  name: "Dendro + Astronomical"
  description: "Trust countable evidence only"

  anchor_weights:
    astronomical: 1.0      # Hard anchors
    dendro: 0.95           # Countable rings
    radiocarbon: 0.0       # Too disputed
    ice_cores: 0.0         # Layering assumptions
    documentary: 0.0       # Textual bias
    traditional: 0.0

  notes: |
    Conservative frame trusting only mathematically
    verifiable or physically countable evidence.

compressed:
  name: "Compressed Chronology"
  description: "Fomenko-style compressed timeline"

  anchor_weights:
    astronomical: 0.5      # Only accepts some eclipse identifications
    dendro: 0.2            # Skeptical of long sequences
    radiocarbon: 0.1       # Heavy skepticism
    ice_cores: 0.1
    documentary: 0.0
    traditional: 0.0

  epoch_offset_years: -1000  # Approximate

  custom_rules:
    - "Phantom centuries removed"
    - "Ancient and medieval collapsed"

  notes: |
    Alternative chronology. Included for exploration -
    system is agnostic about which frame is "correct."
```

### Custom Frames

Users can create personal frames:

```javascript
{
  name: "My Research Frame",
  description: "Testing Byzantine chronology without Theophanes",

  base_frame: "mainstream",  // Start from existing frame

  anchor_weights: {
    // Override specific weights from base:
    documentary: 0.0  // Don't trust chronicles for this research
  },

  anchor_overrides: {
    "anchor-uuid-1": {
      weight: 0.0,
      reason: "Disputed eclipse identification"
    },
    "anchor-uuid-2": {
      weight: 1.0,
      adjustment_years: -50,
      reason: "Alternative interpretation of comet sighting"
    }
  },

  // Frame can maintain its own placements
  custom_placements: {
    "factoid-uuid-1": {
      year_point: -520,  // Place in 520 BCE
      confidence: 0.7,
      reasoning: "Based on revised eclipse dating"
    }
  },

  is_public: false,  // Personal frame
  share_with_communities: ["research-group-uuid"]  // Or share with specific community
}
```

### Frame Switching

When viewing data:

```
┌─────────────────────────────────────────────────────────────────┐
│ CURRENT FRAME: Mainstream Chronology            [Change ▼]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Event: Destruction of Library of Alexandria                    │
│                                                                 │
│  MAINSTREAM FRAME:           EVIDENCE-BASED FRAME:             │
│  Date: ~48 BCE (Caesar)      Date: Uncertain                   │
│  Alt: 391 CE (Theophilus)    Multiple possible events          │
│  Alt: 641 CE (Arab conquest) Archaeological: inconclusive      │
│                                                                 │
│  [Compare frames] [View anchor chains]                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Frame Comparison View

```
┌─────────────────────────────────────────────────────────────────┐
│ FRAME COMPARISON: Trojan War Dating                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MAINSTREAM         ASTRONOMICAL      COMPRESSED                │
│  ───────────        ───────────       ──────────                │
│  ~1180 BCE          Undated           ~200 BCE                  │
│                     (no verified      (collapsed                │
│  Based on:          eclipse)          chronology)               │
│  - Eratosthenes                                                 │
│  - Later Greek      Based on:         Based on:                 │
│    calculations     - No hard         - Chronological           │
│  - Egyptian         anchors           compression               │
│    synchronisms     found             - Parallel                │
│    (disputed)                         histories                 │
│                                       merged                    │
│  Confidence: 0.4    Confidence: N/A   Confidence: 0.2          │
│                                                                 │
│  Events that shift with this dating:                           │
│  - Greek Dark Ages (collapse / shorten / disappear)            │
│  - Mycenaean period (same / shift / merge)                     │
│  - Egyptian New Kingdom synchronisms (break / hold / adjust)   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Lenses

### What Is a Lens?

A lens is a curated view that defines WHAT you see - not where things sit chronologically, but which subset of history to explore. Lenses can be scoped by:

- **Geography**: Mediterranean, East Asia, specific city
- **Time period**: 500-300 BCE, Bronze Age, Medieval
- **Topic**: Trade routes, military campaigns, religious history
- **Source**: Everything from Herodotus, archaeological evidence only

### Lens vs Frame

| Aspect | Frame | Lens |
|--------|-------|------|
| Controls | WHERE things sit in time | WHAT things you see |
| Scope | Entire chronological model | Filtered subset |
| User creates for | Testing hypotheses | Presenting/teaching |
| Can conflict? | Yes (different dates) | No (just different scope) |

A lens is always viewed *through* a frame. "Ancient Egypt lens in mainstream frame" vs "Ancient Egypt lens in compressed frame" show the same events, but at different dates.

### Lens Types

```yaml
geographic_lens:
  name: "Mediterranean World"
  description: "Events within Mediterranean basin"

  bounds:
    geographic:
      type: "polygon"  # or bounding box
      region: "mediterranean"
    temporal: null  # All time periods

  examples:
    - "Ancient Greece 500-300 BCE"
    - "Roman Empire at its Height"
    - "Silk Road Trade Routes"

topic_lens:
  name: "Bronze Age Collapse"
  description: "Events related to the Late Bronze Age collapse"

  bounds:
    temporal:
      start_year: -1250
      end_year: -1100
    geographic:
      regions: ["eastern_mediterranean", "near_east"]

  topic_tags: ["bronze_age", "collapse", "sea_peoples"]

  # Can include specific factoids
  included_factoids: ["uuid-1", "uuid-2"]

source_lens:
  name: "Herodotus's World"
  description: "Everything Herodotus wrote about"

  source_filter:
    sources: ["herodotus-histories"]
    include_corroborating: true  # Also show related evidence

  notes: |
    See the ancient world through Herodotus's eyes,
    with modern corroboration overlaid.

presentation_lens:
  name: "WWI Overview - Lesson 3"
  description: "Teacher's curated selection for class"

  created_by: "teacher-uuid"
  is_public: true

  bounds:
    temporal:
      start_year: 1914
      end_year: 1918
    geographic:
      regions: ["europe", "middle_east"]

  # Explicit curation
  included_factoids: [...]
  excluded_factoids: [...]  # Too complex for this lesson
  focus_actors: ["franz_ferdinand", "gavrilo_princip", ...]

  annotations:
    - "Start here for context"
    - "Key turning point"
```

### Lens UI Example

```
┌─────────────────────────────────────────────────────────────────┐
│ LENS: Bronze Age Collapse                                       │
│ FRAME: Mainstream Chronology                     [Change ▼]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Geographic scope: Eastern Mediterranean, Near East             │
│  Temporal scope: 1250 BCE - 1100 BCE                           │
│                                                                 │
│  Showing 847 factoids in this lens                              │
│                                                                 │
│  [View Map] [View Timeline] [View as List]                      │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │     [Map showing Eastern Mediterranean with collapse      │ │
│  │      events marked, cities destroyed, migrations]         │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Switch frame to see different dating:                          │
│  [Mainstream: 1200 BCE] [Compressed: ~200 BCE] [Compare]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Lens Sharing

Lenses can be:
- **Private**: Personal research workspace
- **Shared**: Accessible via link
- **Public**: Discoverable by all users
- **Featured**: Highlighted by platform (quality/educational value)

```
BROWSE LENSES
───────────────────────────────────────

FEATURED:
  - "Ancient Mediterranean Trade" (Educational)
  - "World War I Interactive" (Teacher-created)
  - "Archaeological Sites of Egypt" (Curated)

POPULAR:
  - "Alexander's Campaigns" (1,234 views)
  - "Viking Age" (987 views)

BY TOPIC:
  - Military History (234 lenses)
  - Trade & Economics (156 lenses)
  - Religious History (189 lenses)

BY CREATOR:
  - Universities (45 lenses)
  - YouTubers (78 lenses)
  - Teachers (234 lenses)
```

---

## Communities

### What Is a Community?

A community is a social workspace where researchers collaborate. Unlike frames (chronological interpretation) or lenses (curated views), communities handle:

- **Membership**: Who works together
- **Frame governance**: The community's preferred/official frame
- **Shared annotations**: Community-specific notes and extensions
- **Quality standards**: Guidelines for frame-level interpretations

**Important distinction**: Communities do NOT own Core Data. All factoids, sources, and connections exist in the shared Core Data layer. Communities own their **frame interpretations** (placements, extensions) and **collaborative workspace**.

### Community vs Core Data

```
┌─────────────────────────────────────────────────────────────────┐
│                        CORE DATA LAYER                          │
│  (Shared by all - "source says X")                             │
│                                                                 │
│  Factoids, Sources, Actors, Events, Connections, Media          │
│  Tagged, described, enriched - benefits everyone                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                     COMMUNITY LAYER                             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Academic     │  │ Alternative  │  │ Genealogy    │          │
│  │ Research     │  │ Chronology   │  │ Network      │          │
│  │              │  │              │  │              │          │
│  │ Frame:       │  │ Frame:       │  │ Frame:       │          │
│  │ mainstream   │  │ compressed   │  │ mainstream   │          │
│  │              │  │              │  │              │          │
│  │ Placements   │  │ Placements   │  │ Placements   │          │
│  │ Extensions   │  │ Extensions   │  │ Extensions   │          │
│  │ Annotations  │  │ Annotations  │  │ Annotations  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Community Types

```yaml
research_community:
  type: "research"
  description: |
    Academic or research groups with shared methodology.
    Can maintain their own frame with custom placements.

  examples:
    - "University of X Ancient History Department"
    - "Megalithic Researchers"
    - "Alternative Chronology Society"
    - "Biblical History Network"

  features:
    - Custom frame with peer-reviewed placements
    - Shared annotations and extensions
    - Publication workflow
    - Citation tracking

  governance:
    - Community owner + moderators
    - Community-defined quality standards
    - Internal peer review for placements

interest_community:
  type: "interest"
  description: |
    Enthusiast groups sharing common interests.
    Typically use existing frames, focus on exploration.

  examples:
    - "Ancient Egypt Enthusiasts"
    - "WWI History Buffs"
    - "Local History Network"

  features:
    - Shared lenses and reading lists
    - Discussion and annotation
    - Collaborative enrichment

  governance:
    - Lighter moderation
    - Community guidelines

personal_workspace:
  type: "personal"
  description: |
    Individual workspace for private research.

  features:
    - Private frame experiments
    - Personal annotations
    - Draft placements before sharing

  visibility: private (shareable by link)
```

### Community Examples

```yaml
megalithic_researchers:
  name: "Megalithic Researchers"
  type: "research"
  description: |
    Community focused on megalithic structures worldwide.
    Open to alternative dating and construction theories.

  methodology:
    - Physical evidence prioritized over textual
    - Alternative construction techniques considered
    - Cross-cultural connections explored

  frame:
    base: "dendro_anchored"  # Trust countable evidence
    custom_placements: true  # Community maintains placements

  guidelines: |
    - All claims should reference physical evidence
    - Speculation clearly labeled
    - Respectful of mainstream views while exploring alternatives

alternative_chronology:
  name: "Alternative Chronology Society"
  type: "research"
  description: |
    Exploring chronological revisions including compressed
    timelines, phantom time hypotheses, and revised dating.

  methodology:
    - Skeptical of documentary dating
    - Astronomical anchors scrutinized
    - Pattern matching across cultures

  frame:
    base: "compressed"
    custom_placements: true
    custom_anchor_overrides: true  # Can dispute specific anchors

  guidelines: |
    - Clearly state which chronological model being used
    - Engage with mainstream objections
    - Show work on revised dating

genealogy_network:
  name: "Genealogy Network"
  type: "interest"
  description: |
    Family history researchers sharing trees and historical context.

  methodology:
    - Standard genealogical evidence standards
    - Primary document preference
    - Living memory valued

  frame:
    base: "mainstream"  # Standard dating
    custom_placements: false  # Use mainstream placements

  focus: "enrichment"  # Adding family connections to core data

  guidelines: |
    - Cite sources for all family connections
    - Privacy considerations for living persons
    - Link to historical events where relevant
```

### Community Governance

```python
class CommunityGovernance:
    owner_id: UUID  # Creator and ultimate authority
    moderator_ids: list[UUID]  # Can moderate interpretations

    # Membership
    is_public: bool  # Anyone can view
    requires_approval: bool  # Membership needs approval
    member_ids: list[UUID]

    # Frame settings
    community_frame_id: UUID  # The community's official frame
    allow_member_frames: bool  # Can members use personal frames?

    # What community can do
    can_create_placements: bool  # Can add placements to frame
    can_create_extensions: bool  # Can add extensions to factoids
    placement_requires_review: bool  # Peer review for placements

    # Guidelines
    contribution_guidelines: str
    methodology_description: str

    def can_contribute_placement(self, user_id):
        if user_id not in self.member_ids:
            return False
        if self.placement_requires_review:
            return "pending_review"
        return True
```

### Core Data vs Community Interpretations

**Key principle**: Factoids live in Core Data, interpretations live in communities.

```sql
-- CORE DATA: The factoid exists once, shared by all
-- "Herodotus says Cambyses conquered Egypt"
INSERT INTO factoids (
    id,
    raw_observation,
    source_id
    -- NO community_id - this is core data
) VALUES (
    'factoid-uuid',
    'Cambyses conquered Egypt after battle at Pelusium',
    'herodotus-histories'
);

-- COMMUNITY INTERPRETATION: Each community places it differently
-- Mainstream community placement
INSERT INTO factoid_placements (
    factoid_id,
    frame_id,          -- Mainstream frame
    community_id,      -- Academic community
    year_point,
    confidence,
    reasoning
) VALUES (
    'factoid-uuid',
    'mainstream-frame-uuid',
    'academic-community-uuid',
    -525,              -- 525 BCE
    0.85,
    'Standard Egyptian chronology'
);

-- Alternative community placement (same factoid, different frame)
INSERT INTO factoid_placements (
    factoid_id,
    frame_id,          -- Compressed frame
    community_id,      -- Alt chronology community
    year_point,
    confidence,
    reasoning
) VALUES (
    'factoid-uuid',
    'compressed-frame-uuid',
    'alt-chronology-community-uuid',
    -200,              -- Different date in compressed chronology
    0.70,
    'Based on revised Egyptian timeline'
);
```

The factoid exists once. Each community can place it in their frame without affecting others.

---

## Cross-Frame / Cross-Community Analysis

### Convergence Detection

When different frames or communities agree on dating:

```python
def detect_convergence(factoid_id):
    """
    Find where different frames agree on this factoid's placement.
    Convergence from different methodologies = strong signal.
    """
    # Get all placements for this factoid
    placements = get_all_placements(factoid_id)

    # Group by frame
    by_frame = group_by(placements, 'frame_id')

    convergences = []

    # Compare each pair of frames
    for frame_a, frame_b in combinations(by_frame.keys(), 2):
        placement_a = by_frame[frame_a]
        placement_b = by_frame[frame_b]

        # Do they agree on date within tolerance?
        if dates_overlap(placement_a.year_point, placement_b.year_point, tolerance=50):
            convergences.append({
                'type': 'date_convergence',
                'frames': [frame_a.name, frame_b.name],
                'date': average(placement_a.year_point, placement_b.year_point),
                'significance': calculate_significance(frame_a, frame_b)
                # High if frames have very different methodologies
            })

    return convergences

def calculate_significance(frame_a, frame_b):
    """
    Agreement between similar frames = low significance
    Agreement between different methodologies = high significance
    """
    # Mainstream + Compressed agreeing = very significant
    # Mainstream + Academic variant = less significant
    pass
```

### Divergence Mapping

Where do frames disagree most? This helps identify chronological "hot zones":

```
DIVERGENCE REPORT: 1000 BCE - 500 BCE Mediterranean
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HIGH DIVERGENCE ZONES:

1. Greek Dark Ages (1100-800 BCE conventional)
   - Mainstream: 300-year gap, minimal evidence
   - Alternative: Gap artificial, compressed to ~50 years
   - Archaeological: Sees continuity some areas, gap others
   - Divergence score: 0.85

2. Phoenician Expansion
   - Mainstream: 1000-800 BCE gradual
   - Alternative: Later, faster
   - Evidence-based: Dating uncertain, relative sequence clear
   - Divergence score: 0.72

3. Egyptian Third Intermediate Period
   - Mainstream: Complex, 400 years
   - Alternative: Compressed, possible overlapping dynasties
   - Divergence score: 0.78

LOW DIVERGENCE (AGREEMENT) ZONES:

1. Persian Wars (490-479 BCE)
   - All frames: Within 20 years of conventional
   - Multiple astronomical anchors
   - Agreement score: 0.92

2. Alexander's Campaigns
   - All frames: Strong astronomical anchors
   - Agreement score: 0.95
```

---

## Epistemological Layers

### Layer Definitions

```yaml
documented:
  name: "Documented"
  description: |
    Events with primary sources, multiple independent 
    verifications, physical artifacts examined.
  confidence_range: [0.7, 1.0]
  allowed_in: all namespaces
  
attested:
  name: "Attested"
  description: |
    Events with secondary sources, single primary source,
    reasonable chain of custody.
  confidence_range: [0.4, 0.7]
  allowed_in: all namespaces

traditional:
  name: "Traditional"
  description: |
    Oral histories, cultural memory, myths with potential
    historical kernel.
  confidence_range: [0.2, 0.5]
  allowed_in: [core (tagged), all communities]

theoretical:
  name: "Theoretical"
  description: |
    Researcher interpretations, connections proposed but
    not verified, hypotheses.
  confidence_range: [0.1, 0.4]
  allowed_in: research communities, personal workspaces

speculative:
  name: "Speculative"
  description: |
    Creative exploration, mythological timelines,
    experimental frameworks.
  confidence_range: [0.0, 0.2]
  allowed_in: research communities, personal workspaces only
```

### Layer Filtering

Users can filter by layer:

```
┌─────────────────────────────────────────────────────────────────┐
│ LAYER FILTER                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ☑ Documented     (847 factoids)                               │
│  ☑ Attested       (2,341 factoids)                             │
│  ☐ Traditional    (567 factoids)                               │
│  ☐ Theoretical    (234 factoids)                               │
│  ☐ Speculative    (89 factoids)                                │
│                                                                 │
│  Currently showing: 3,188 factoids                              │
│                                                                 │
│  [Apply] [Reset]                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Layer in Display

Every factoid shows its layer:

```
┌─────────────────────────────────────────────────────────────────┐
│ FACTOID                                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  "Atlantis sank in a single day and night"                     │
│                                                                 │
│  LAYER: Traditional                                             │
│  SOURCE: Plato, Timaeus/Critias (secondary - Solon's account)  │
│  DATA LAYER: Core (tagged as traditional)                       │
│                                                                 │
│  Note: Layer indicates this is traditional/legendary            │
│  content. Source is literary dialogue, not historical           │
│  record. Historical kernel (if any) unknown.                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features

### MVP (Phase 1)

**Basic frames**
- Mainstream (default)
- Astronomical-only (alternative)
- Dendro-anchored (countable evidence)
- Simple toggle between them

**Basic lenses**
- Geographic scoping
- Temporal scoping
- Personal lens creation

**Simple communities**
- One or two example research communities
- Personal workspace for users
- Basic membership

**Layer tagging**
- Manual layer selection on contribution
- Layer display on factoids
- Basic filtering

### Phase 2

**Full frame system**
- All built-in frames
- Custom frame creation
- Frame comparison view
- Anchor weight adjustment interface

**Full lens system**
- Topic-based lenses
- Source-based lenses
- Lens sharing and discovery
- Featured/educational lenses

**Research communities**
- User-created communities
- Governance tools
- Frame ownership and placements
- Community peer review

**Cross-analysis**
- Convergence detection
- Divergence mapping
- Cross-frame queries

### Phase 3 (Dream)

**Frame recommendations**
- "This data looks different in frame X"
- Automatic divergence alerts
- Frame suggestion based on research interest

**Community federation**
- Communities across instances
- Shared core data, local interpretations
- Cross-instance convergence

**Interpretation evolution**
- Track how placements change over time
- "Historical historiography" - history of historical views
- Community frame lineage

---

## Data Model

### reference_frames table

```sql
CREATE TABLE reference_frames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,

    -- Base frame (for inheritance)
    base_frame_id UUID REFERENCES reference_frames(id),

    -- Configuration
    calendar_system VARCHAR(30) DEFAULT 'gregorian',
    epoch_offset_years INTEGER DEFAULT 0,

    -- Anchor weights (0.0 = ignore, 1.0 = full trust)
    -- Tiered hierarchy: astronomical > dendro > radiocarbon > documentary > traditional
    anchor_weights JSONB DEFAULT '{
        "astronomical": 1.0,
        "dendro": 0.95,
        "radiocarbon": 0.85,
        "ice_cores": 0.80,
        "documentary": 0.70,
        "traditional": 0.30
    }',

    -- Custom overrides for specific anchors
    anchor_overrides JSONB DEFAULT '{}',
    custom_rules JSONB DEFAULT '{}',

    -- Visibility
    is_public BOOLEAN DEFAULT FALSE,
    is_builtin BOOLEAN DEFAULT FALSE,

    -- Owner (NULL for system frames)
    created_by UUID REFERENCES users(id),
    owning_community_id UUID REFERENCES communities(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### communities table

```sql
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,

    -- Type
    community_type VARCHAR(30) NOT NULL,  -- research, interest, personal

    -- Governance
    owner_id UUID REFERENCES users(id),

    -- Settings
    is_public BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT FALSE,
    contribution_guidelines TEXT,
    methodology_description TEXT,

    -- Frame settings
    community_frame_id UUID REFERENCES reference_frames(id),
    allow_member_frames BOOLEAN DEFAULT TRUE,
    can_create_placements BOOLEAN DEFAULT TRUE,
    placement_requires_review BOOLEAN DEFAULT FALSE,

    -- Stats (cached)
    member_count INTEGER DEFAULT 0,
    placement_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### community_memberships table

```sql
CREATE TABLE community_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    community_id UUID NOT NULL REFERENCES communities(id),
    user_id UUID NOT NULL REFERENCES users(id),

    role VARCHAR(20) NOT NULL DEFAULT 'member',  -- owner, moderator, reviewer, member

    joined_at TIMESTAMPTZ DEFAULT NOW(),
    invited_by UUID REFERENCES users(id),

    UNIQUE(community_id, user_id)
);
```

### lenses table

```sql
CREATE TABLE lenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    description TEXT,

    -- Creator
    created_by UUID NOT NULL REFERENCES users(id),

    -- Bounds (what this lens shows)
    geographic_bounds GEOMETRY(POLYGON, 4326),  -- PostGIS polygon
    geographic_regions VARCHAR[] DEFAULT '{}',  -- Named regions
    temporal_start_year INTEGER,
    temporal_end_year INTEGER,

    -- Topic filtering
    topic_tags VARCHAR[] DEFAULT '{}',
    source_ids UUID[] DEFAULT '{}',  -- Limit to specific sources

    -- Explicit curation
    included_factoid_ids UUID[] DEFAULT '{}',
    excluded_factoid_ids UUID[] DEFAULT '{}',
    focus_actor_ids UUID[] DEFAULT '{}',

    -- Presentation
    annotations JSONB DEFAULT '{}',  -- Lens-specific notes

    -- Sharing
    visibility VARCHAR(20) DEFAULT 'private',  -- private, shared, public, featured
    share_token VARCHAR(50),

    -- Stats
    view_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### factoid_placements table (frame-dependent positions)

```sql
-- NOTE: Factoids exist in Core Data without frame/community.
-- Placements are how each frame positions factoids in time.
CREATE TABLE factoid_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    factoid_id UUID NOT NULL REFERENCES factoids(id),
    frame_id UUID NOT NULL REFERENCES reference_frames(id),

    -- Who created this placement
    community_id UUID REFERENCES communities(id),  -- Community-owned placement
    created_by UUID REFERENCES users(id),          -- Individual placement

    -- Temporal position in this frame
    year_point INTEGER,
    year_range_start INTEGER,
    year_range_end INTEGER,
    date_precision VARCHAR(20),  -- year, decade, century, etc.

    -- Confidence and reasoning
    confidence DECIMAL(3,2),
    reasoning TEXT,
    anchor_chain_id UUID REFERENCES anchor_chains(id),

    -- Review status (for community placements)
    review_status VARCHAR(20) DEFAULT 'approved',  -- pending, approved, rejected

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(factoid_id, frame_id, community_id)  -- One placement per factoid per frame per community
);
```

---

## Open Questions

- **Community proliferation**: How to prevent too many low-quality communities? Minimum member/activity requirements?

- **Frame validation**: Should custom frames be validated? Can users create obviously broken frames (e.g., negative weights)?

- **Lens curation**: How to surface high-quality educational lenses? Community voting? Expert curation?

- **Core Data governance**: Who controls what goes into Core Data? How to handle disputes about what's "documented"?

- **Frame inheritance**: How deep can frame inheritance go? Performance implications for anchor weight calculation?

- **Placement conflicts**: What happens when a community's placement contradicts a hard astronomical anchor? Warning system?

---

## Dependencies

- **02-data-model.md**: Schema for frames, communities, lenses
- **04-chronology-system.md**: How frames affect date display, anchor chains
- **09-users-community.md**: Core Data vs Frame Data model, governance

---

## Summary

Three concepts work together to enable multiple perspectives:

- **Frames** determine WHERE things sit chronologically (placements, anchor weights)
- **Lenses** determine WHAT you see (geographic/temporal scope, curated selections)
- **Communities** determine WHO works together (shared frames, peer review)

All built on **Core Data** - the shared foundation of "source says X" that benefits everyone.

The same underlying facts. Different chronological interpretations. Different curated views. All transparent.
