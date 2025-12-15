# Gamification

## Overview

Gamification done wrong is hollow points and meaningless badges. Gamification done right recognizes genuine contribution, creates meaningful feedback, and builds community around shared goals.

Our approach: tie recognition to actual value created. Points that mean something. Achievements that reflect real accomplishment. Feedback that helps contributors understand their impact.

---

## Core Principles

### 1. Meaningful, Not Hollow
Every metric connects to real contribution. No arbitrary points. No badges for logging in. If you earn recognition, you earned it.

### 2. Quality Over Quantity
We don't reward volume for its own sake. One deeply-sourced factoid is worth more than ten shallow ones. The system knows the difference.

### 3. Contextual Feedback
Don't just say "contribution added." Say "You've connected another thread to the 1893 Chicago cluster" or "This source was cited by 4 existing factoids — your addition strengthens the foundation."

### 4. Visible Impact
Show contributors how their work fits into the larger picture. Visualize their contribution graph. Show ripple effects when their work enables others.

### 5. Community, Not Competition
Leaderboards exist but aren't the focus. Collaborative challenges matter more. We're building something together.

---

## User Stories

### New Contributor
- As a new contributor, I want to understand what valuable contribution looks like, so I can focus on quality.
- As a new contributor, I want early wins, so I stay motivated.
- As a new contributor, I want to see a clear path forward, so I know how to grow.

### Regular Contributor
- As a regular contributor, I want to see my impact, so I feel my work matters.
- As a regular contributor, I want recognition for specialized expertise, so I can develop depth.
- As a regular contributor, I want to participate in community challenges, so I feel part of something larger.

### Expert Contributor
- As an expert contributor, I want rare achievements that reflect exceptional work, so mastery is recognized.
- As an expert contributor, I want my track record visible, so new users can find reliable contributions.
- As an expert contributor, I want to help set challenges, so I can guide community focus.

---

## Contribution Types & Value

### Value Calculation

```python
def calculate_contribution_value(contribution):
    """
    Calculate the value of a contribution.
    Higher value = more points and recognition.
    """
    base_value = BASE_VALUES[contribution.type]
    
    multipliers = 1.0
    
    # Source quality multiplier
    if contribution.has_primary_source:
        multipliers *= 1.5
    
    # Independence multiplier (connecting independent sources)
    independence_score = contribution.independence_score
    multipliers *= (1.0 + independence_score * 0.5)
    
    # Gap-filling multiplier (under-documented areas)
    if contribution.fills_gap:
        multipliers *= 1.3
    
    # Connection multiplier (links to existing data)
    connection_count = contribution.meaningful_connections
    multipliers *= (1.0 + min(connection_count * 0.1, 0.5))
    
    # First-in-area multiplier
    if contribution.is_first_in_area:
        multipliers *= 2.0
    
    return base_value * multipliers

BASE_VALUES = {
    # Core contributions
    'factoid': 10,
    'source': 15,
    'primary_source': 25,
    'connection': 5,
    'verification': 3,
    'correction': 8,
    'source_tree_expansion': 20,
    'independence_verification': 15,

    # Enrichment (making data usable)
    'media_upload': 8,
    'media_with_metadata': 15,  # date, description, tags
    'media_connected': 20,      # linked to entities/events
    'tag_addition': 2,
    'description_addition': 5,
    'entity_connection': 5,

    # Event chains
    'chain_creation': 15,
    'chain_link_addition': 5,
    'journey_mapping': 20,      # chain with geographic route

    # Source Reader
    'reading_annotation': 3,
    'extraction_flag': 5,       # flagging errors
    'reading_contribution': 12, # adding factoid while reading

    # Corrections (improving core data)
    'typo_fix': 2,
    'citation_correction': 8,
    'misquote_identification': 15,
    'source_reattribution': 20, # finding the real source

    # Gap identification
    'gap_flagged': 5,
    'narrative_gap_documented': 10,
    'first_in_period': 25,      # first data in timeline gap
    'first_in_region': 25,      # first data in geographic gap
}
```

### Contextual Feedback Examples

Instead of: "Factoid added. +10 points."

Say:
```
"Factoid added to the Late Bronze Age cluster. You've connected this to 3
existing sources, strengthening the network around the 1200 BCE collapse."

"Source linked. This primary source now anchors 7 factoids that previously
relied on secondary sources only."

"Connection made. You've bridged the Roman and Chinese timelines — this is
only the 3rd cross-cultural link in this period."

"Verification complete. Your confirmation gives this factoid its 3rd
independent verification — it's now in the 'well-established' tier."

"Image enriched. Your metadata (date, description, 5 tags) makes this
painting of the Siege of Vienna findable across all research contexts."

"Chain extended. The campaign route now has 8 waypoints — users can
trace the army's march on the map."

"Reading contribution. While reading Herodotus, you added a factoid about
the Battle of Marathon that connects to 4 existing sources."

"Eclipse anchor added. This astronomical event is mathematically verified
to May 28, 585 BCE — it now anchors 12 related factoids."
```

---

## Achievement System

### Achievement Categories

#### Sourcerer Path (Finding and linking sources)

```yaml
sourcerer_achievements:
  novice_sourcerer:
    requirement: Link 10 sources to factoids
    tier: bronze
    description: "Beginning to trace the roots"
    
  sourcerer:
    requirement: Link 50 sources with proper citations
    tier: silver
    description: "Building the foundation"
    
  deep_root_sourcerer:
    requirement: Link 25 primary sources
    tier: gold
    description: "Going to the origins"
    
  origin_seeker:
    requirement: Find primary source for 5 factoids that previously had only secondary sources
    tier: platinum
    description: "Strengthening the roots"
    
  root_exposer:
    requirement: Reveal that a widely-cited "fact" (cited 20+ times) traces to a single questionable source
    tier: special
    description: "The canopy was thin all along"
    rarity: rare
```

#### Cartographer Path (Geographic contributions)

```yaml
cartographer_achievements:
  local_mapper:
    requirement: Document 10 locations with accurate coordinates
    tier: bronze
    
  regional_cartographer:
    requirement: Document 50 locations across 3+ regions
    tier: silver
    
  historical_geographer:
    requirement: Link 20 historical map references to modern locations
    tier: gold
    
  terra_incognita:
    requirement: First contribution in a previously empty region
    tier: special
    description: "First light in the darkness"
    rarity: uncommon
```

#### Chronologist Path (Timeline and dating)

```yaml
chronologist_achievements:
  timekeeper:
    requirement: Add 20 factoids with raw temporal observations captured
    tier: bronze

  divergence_mapper:
    requirement: Document 5 factoids where different frames place events differently
    tier: silver
    description: "Mapping where timelines diverge"

  synchronist:
    requirement: Establish 10 cross-cultural synchronisms (linking events across civilizations)
    tier: gold

  chain_builder:
    requirement: Build 5 event chains with temporal relationships
    tier: gold
    description: "Connecting the sequence"

  astronomical_anchor:
    requirement: Add 3 astronomical anchors (eclipses, comets) verified against calculations
    tier: platinum
    description: "Pinning time to the sky"
    note: "True hard anchors - mathematically verifiable"

  dendro_linker:
    requirement: Link 5 factoids to dendrochronology sequences
    tier: gold
    description: "Reading the rings"
    note: "Strong scientific claims - near-anchor status"

  mainstream_gap_finder:
    requirement: Identify 10 events with no mainstream frame placement
    tier: silver
    description: "Finding the blind spots"
    note: "Mainstream frame serves as baseline - gaps indicate areas for research"

  evidence_hunter:
    requirement: Add primary source evidence for 5 factoids that mainstream has only secondary sources for
    tier: gold
    description: "Strengthening the foundations"
```

#### Connector Path (Finding relationships)

```yaml
connector_achievements:
  thread_finder:
    requirement: Create 25 meaningful connections
    tier: bronze
    
  web_weaver:
    requirement: Create connections that link 3+ clusters
    tier: silver
    
  pattern_seer:
    requirement: Your connection reveals a pattern (flagged by system or community)
    tier: gold
    description: "Seeing what others missed"
    
  bridge_builder:
    requirement: Connect two previously unlinked major clusters (50+ factoids each)
    tier: special
    description: "Bridging worlds"
    rarity: rare
```

#### Verifier Path (Quality assurance)

```yaml
verifier_achievements:
  reviewer:
    requirement: Verify 25 core data contributions
    tier: bronze

  quality_guardian:
    requirement: Verify 100 contributions with 95%+ accuracy
    tier: silver

  independent_voice:
    requirement: Your verifications are rarely overturned
    tier: gold

  foundation_layer:
    requirement: Verify 10 contributions that become highly-cited
    tier: platinum
```

#### Corrector Path (Improving core data)

Core data corrections strengthen the foundation for everyone.

```yaml
corrector_achievements:
  typo_hunter:
    requirement: Correct 10 minor errors (typos, formatting)
    tier: bronze
    description: "Attention to detail"

  citation_fixer:
    requirement: Fix 10 incorrect or incomplete citations
    tier: silver
    description: "Getting the sources right"

  misquote_catcher:
    requirement: Identify 5 factoids that misrepresent their source
    tier: gold
    description: "The source doesn't say that"

  core_improver:
    requirement: Your corrections are accepted 25+ times
    tier: platinum
    description: "Making the foundation solid"

  resurrection:
    requirement: Find the actual source for a factoid that was mis-attributed
    tier: special
    rarity: rare
    description: "Tracing back to the truth"
```

#### Gap Finder Path (Identifying missing data)

Finding what's missing is as valuable as adding what's present.

```yaml
gap_finder_achievements:
  gap_spotter:
    requirement: Flag 10 topics with insufficient sources
    tier: bronze

  period_pioneer:
    requirement: First to add data in a 50+ year gap in the timeline
    tier: silver
    rarity: uncommon

  region_opener:
    requirement: First contributor in a geographic region with < 10 factoids
    tier: silver
    rarity: uncommon

  lost_voice_seeker:
    requirement: Document 5 narrative gaps (missing perspectives)
    tier: gold
    description: "Noting who isn't speaking"

  mainstream_challenger:
    requirement: Add primary sources that contradict 3+ mainstream secondary claims
    tier: gold
    description: "The sources tell a different story"
```

#### Lineage Path (Family tree contributions)

```yaml
lineage_achievements:
  family_historian:
    requirement: Add 5 generations of a family tree
    tier: bronze

  migration_mapper:
    requirement: Document a family migration across 3+ locations
    tier: silver

  living_history:
    requirement: Connect a family tree to 10 historical events
    tier: gold

  dynasty_anchor:
    requirement: Your family tree provides a dating anchor for historical events
    tier: special
```

#### Enricher Path (Making data usable across all frames)

Data is only valuable when it's findable and connected. These achievements reward enrichment.

```yaml
enricher_achievements:
  tagger:
    requirement: Add tags to 25 items (images, sources, factoids)
    tier: bronze
    description: "Making data findable"

  describer:
    requirement: Add detailed descriptions to 20 media items
    tier: bronze
    description: "Context is everything"

  connector:
    requirement: Link 50 media items to entities, events, or locations
    tier: silver
    description: "Building the web"

  metadata_master:
    requirement: Fully enrich 25 items (date, description, tags, connections)
    tier: gold
    description: "The complete picture"

  curator:
    requirement: Your enriched items are viewed/used 100+ times
    tier: platinum
    description: "Your work serves others"
```

#### Media Path (Images, maps, artifacts)

```yaml
media_achievements:
  collector:
    requirement: Upload 10 images with proper metadata
    tier: bronze

  gallery_builder:
    requirement: Upload 50 images connected to entities/events
    tier: silver

  map_hunter:
    requirement: Upload 10 historical maps with location tagging
    tier: gold

  artifact_documenter:
    requirement: Document 20 artifacts with provenance information
    tier: gold

  visual_historian:
    requirement: Your media is used in 10+ different research contexts
    tier: platinum
```

#### Reader Path (Source Reader engagement)

For users engaging with extracted books via the Source Reader (see 21-source-reader.md).

```yaml
reader_achievements:
  first_read:
    requirement: Complete reading session with an extraction set
    tier: bronze
    description: "Journey begun"

  annotator:
    requirement: Add 25 annotations while reading
    tier: silver
    description: "Active reading"

  flag_finder:
    requirement: Flag 10 extraction errors while reading
    tier: silver
    description: "Quality guardian"

  book_completer:
    requirement: Read through an entire extraction set
    tier: gold
    description: "Cover to cover"

  cross_reader:
    requirement: Read same events across 3+ different sources
    tier: gold
    description: "Multiple perspectives"

  reading_contributor:
    requirement: Add 20 factoids/connections while reading
    tier: platinum
    description: "Reading that enriches"
```

### Rare Achievements

```yaml
rare_achievements:
  resurrection:
    description: Found primary source for something that was hearsay-only for 50+ years
    rarity: very_rare
    
  paradigm_shift:
    description: Your contribution changed the community confidence on a major topic
    rarity: legendary
    
  silent_voice:
    description: Documented a lost perspective that challenges surviving narratives
    rarity: rare
    
  century_hunter:
    description: Contributions span 10+ centuries
    rarity: uncommon
    
  polymath:
    description: Reached silver tier in 4+ different paths
    rarity: uncommon
    
  first_light:
    description: First documented contribution for a time period (100+ year span)
    rarity: rare
```

---

## Community Challenges

### Monthly Expeditions

```yaml
expedition_structure:
  announcement:
    - Theme revealed at month start
    - Clear goals and scope
    - Resources and starting points provided
    
  duration: 1 month
  
  participation:
    - Anyone can contribute
    - Progress tracked publicly
    - Discussion thread for coordination
    
  completion:
    - Goals met = expedition success
    - Pattern analysis runs on new data
    - Results shared with all participants
    - Participants get expedition badge
```

### Example Expeditions

```yaml
orphan_train_trail:
  theme: "Document the Orphan Train Movement (1854-1929)"
  goals:
    - Add 100 factoids about orphan trains
    - Document 50 specific children or families
    - Link to 20 cities/towns receiving children
    - Find 10 primary sources (records, photos, testimonies)
  context: |
    250,000 children were transported from Eastern cities to Midwest 
    towns. Where did they come from? What happened to their families?
    Let's map this largely undocumented migration.
    
worlds_fair_excavation:
  theme: "The 1893 Chicago World's Fair"
  goals:
    - Document 75 buildings/exhibits
    - Find 30 photographs with locations
    - Track construction timelines
    - Document demolition records (or lack thereof)
  context: |
    The "White City" appeared impossibly fast and disappeared 
    almost completely. What can we document about what was 
    actually there?

536_dark_year:
  theme: "The 536 CE Climate Catastrophe"
  goals:
    - Collect 50 textual references to climate anomalies 535-545 CE
    - Map geographic spread of accounts
    - Link to scientific claims (ice core studies, dendro sequences)
    - Identify impacts (famines, plagues, political changes)
  note: "Ice cores and dendro are scientific claims - cite the studies"
```

### Challenge Rewards

```
INDIVIDUAL:
├── Participation badge for contributing
├── Points multiplier during expedition (1.5x)
├── Expedition-specific achievements
└── Leaderboard recognition (optional visibility)

COLLECTIVE:
├── If goals met: Pattern analysis revealed
├── New data visualization created
├── Summary report shared
└── Community celebration
```

---

## Progress Visualization

### Personal Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ YOUR CONTRIBUTION MAP                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │     ●                    Your contribution clusters      │  │
│  │    ●●●      ●           shown on timeline                │  │
│  │     ●●●●●●●●●●●●                                         │  │
│  │         ●●●●●   ●●●                                      │  │
│  │              ●●●●●●                                      │  │
│  │                   ●●                                     │  │
│  │                                                          │  │
│  │  |──────|──────|──────|──────|──────|──────|──────|     │  │
│  │  500   BCE    0     500    1000   1500   1900   NOW     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  PRIMARY FOCUS: Roman Republic (47 contributions)               │
│  EMERGING: Byzantine Empire (12 contributions)                  │
│  UNEXPLORED: [See suggested areas]                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PATH PROGRESS                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SOURCERER     ████████████████░░░░░░░░  67% to Gold           │
│  CARTOGRAPHER  █████████░░░░░░░░░░░░░░░  38% to Silver         │
│  CHRONOLOGIST  ████████████████████░░░░  82% to Silver         │
│  CONNECTOR     ██████░░░░░░░░░░░░░░░░░░  25% to Bronze         │
│  VERIFIER      ████████████░░░░░░░░░░░░  52% to Silver         │
│                                                                 │
│  [View all achievements]                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Impact Visualization

```
YOUR CONTRIBUTIONS' RIPPLE EFFECT:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  YOUR WORK          ENABLED              LED TO                 │
│  ──────────         ───────              ──────                 │
│                                                                 │
│  Source: Livy ───► 12 factoids ───────► 3 new connections      │
│  Book 21    │                    │                              │
│             │                    └────► 2 chronology anchors    │
│             │                                                   │
│             └────► Cited by 4 ───────► Used in expedition      │
│                    researchers                                  │
│                                                                 │
│  Factoid: ───────► Connected to ─────► Revealed pattern:       │
│  Punic War         Rome cluster        Carthage destruction    │
│  dating                                timeline questions       │
│                                                                 │
│  TOTAL DOWNSTREAM IMPACT: 23 items trace to your contributions │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Leaderboards

### Design Philosophy

Leaderboards can motivate or discourage. Our approach:
- **Optional visibility**: Users choose whether to appear
- **Multiple dimensions**: Not just total points
- **Time-bounded**: Monthly leaderboards reset
- **Quality-weighted**: Accuracy and impact, not just volume

### Leaderboard Types

```yaml
monthly_contributors:
  metric: Quality-weighted contribution points
  display: Top 20, opt-in
  recognition: "Top Contributor - [Month]" badge
  
verification_leaders:
  metric: Verifications with high accuracy
  display: Top 10, opt-in
  recognition: "Verification Champion" badge
  
expedition_leaders:
  metric: Contributions to current expedition
  display: All participants
  recognition: "Expedition Leader" badge if top 3
  
specialists:
  metric: Contributions in specific areas
  display: By topic/period/region
  recognition: "Specialist: [Area]" title
```

### Anti-Gaming

```python
def validate_leaderboard_entry(user, contribution):
    """
    Prevent gaming of leaderboards.
    """
    # Check for unusual patterns
    if contribution_rate_spike(user, factor=3):
        flag_for_review(user)
    
    # Check for trivial contributions
    if is_trivial_contribution(contribution):
        exclude_from_leaderboard(contribution)
    
    # Check for self-dealing
    if verification_is_self_dealing(contribution):
        exclude_and_flag(contribution)
    
    # Quality gate
    if contribution.quality_score < LEADERBOARD_THRESHOLD:
        exclude_from_leaderboard(contribution)
```

---

## Feedback System

### Immediate Feedback

On every contribution:
```python
def generate_contribution_feedback(contribution):
    feedback = {
        'summary': f"Factoid added to {contribution.cluster_name}",
        'points': contribution.points_earned,
        'connections': f"Connected to {len(contribution.connections)} existing items",
        'impact': assess_impact(contribution),
        'suggestions': generate_suggestions(contribution),
    }
    
    # Contextual additions
    if contribution.fills_gap:
        feedback['highlight'] = f"This fills a gap in {contribution.gap_description}"
    
    if contribution.strengthens_source:
        feedback['highlight'] = f"This source now anchors {contribution.anchored_count} factoids"
    
    if contribution.unlocks_achievement:
        feedback['achievement'] = contribution.new_achievement
    
    return feedback
```

### Weekly Digest

```
YOUR WEEK IN REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Contributions: 12 factoids, 3 sources, 8 connections
Points earned: 187
Verifications: 24

🎯 Impact Highlight:
Your source addition (Tacitus, Annals) is now connected to 
14 factoids in the Julio-Claudian dynasty cluster.

📈 Progress:
Sourcerer path: 67% → 71% (Gold tier)
Next milestone: 8 more primary sources

🔍 Interesting Pattern:
Your contributions this week cluster around 14-37 CE. 
3 other contributors are working in the same period.
Consider coordinating?

🏆 Expedition Update:
"The Julio-Claudian Mystery" - 67% complete
Your contributions: 18% of total
[View expedition progress]
```

---

## Features

### MVP (Phase 1)

**Basic points**
- Points for contributions
- Simple display on profile
- Contribution count

**Simple achievements**
- 5-10 starter achievements
- Bronze/silver/gold tiers
- Profile display

**Basic feedback**
- "Contribution added" with point value
- Connection count shown

### Phase 2

**Full achievement system**
- All paths implemented
- Rare achievements
- Progress tracking

**Community challenges**
- Monthly expeditions
- Collective goals
- Challenge-specific achievements

**Impact visualization**
- Contribution map
- Ripple effect display
- Downstream tracking

**Leaderboards**
- Optional visibility
- Multiple dimensions
- Monthly reset

### Phase 3 (Dream)

**Personalized suggestions**
- "Based on your expertise..."
- Gap-filling recommendations
- Collaboration suggestions

**Team features**
- Research groups
- Shared goals
- Team achievements

**Advanced analytics**
- Contribution pattern analysis
- Expertise mapping
- Community health metrics

---

## Data Model

### achievements table

```sql
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    
    category VARCHAR(30),  -- sourcerer, cartographer, chronologist, etc.
    tier VARCHAR(20),  -- bronze, silver, gold, platinum, special
    rarity VARCHAR(20),  -- common, uncommon, rare, very_rare, legendary
    
    -- Auto-grant criteria
    requirement_type VARCHAR(30),  -- count, threshold, special
    requirement_config JSONB,
    -- e.g., {"entity_type": "source", "count": 50, "conditions": {"source_type": "primary"}}
    
    -- Stats
    times_granted INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_achievements table

```sql
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID NOT NULL REFERENCES users(id),
    achievement_id UUID NOT NULL REFERENCES achievements(id),
    
    earned_for_entity_type VARCHAR(30),
    earned_for_entity_id UUID,
    context JSONB,  -- Additional context about how it was earned
    
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_id)
);
```

### community_challenges table

```sql
CREATE TABLE community_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    theme TEXT,
    
    -- Timing
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Goals
    goals JSONB NOT NULL,
    -- [{"description": "Add 100 factoids", "target": 100, "current": 47, "type": "factoid_count"}]
    
    -- Participation
    participant_count INTEGER DEFAULT 0,
    contribution_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'upcoming',  -- upcoming, active, completed
    completed_at TIMESTAMPTZ,
    results JSONB,  -- Pattern analysis results after completion
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### challenge_participation table

```sql
CREATE TABLE challenge_participation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    challenge_id UUID NOT NULL REFERENCES community_challenges(id),
    user_id UUID NOT NULL REFERENCES users(id),
    
    contributions_count INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(challenge_id, user_id)
);
```

---

## Open Questions

- **Point inflation**: How to handle point inflation over time? Reset? Normalize?

- **Achievement difficulty**: How to calibrate achievement difficulty as database grows?

- **Team vs. individual**: Should teams share achievements? How to prevent free-riding?

- **Monetary rewards**: Should top contributors get SaaS credits or other tangible rewards?

- **Expert recognition**: How to formally recognize domain experts beyond achievements?

---

## Dependencies

- **02-data-model.md**: Achievement schema
- **04-chronology-system.md**: Event chains, frame divergence
- **06-environmental-layer.md**: Anchor hierarchy (astronomical, dendro, etc.)
- **09-users-community.md**: User roles and reputation
- **15-confidence-system.md**: Quality scoring for value calculation
- **21-source-reader.md**: Reading sessions and annotations

---

## Summary

Gamification is our way of saying "thank you" and "keep going" in a way that's meaningful rather than manipulative. By tying recognition to genuine contribution, providing contextual feedback, and building community through shared challenges, we create an environment where quality work is visible and valued.

Key principles:
- **All contributions benefit all frames**: A well-tagged image of winged hussars serves every researcher
- **Enrichment matters**: Not just uploading, but making data findable and connected
- **Mainstream as baseline**: The mainstream frame helps identify gaps for further research
- **Anchor hierarchy respected**: Astronomical anchors vs dendro vs other scientific claims
- **Reading is contributing**: Source Reader engagement and annotation add value

Not hollow points. Real impact, recognized.
