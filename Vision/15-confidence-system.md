# Confidence System

## Overview

Confidence scoring is how we answer "how sure are we?" for any claim. Unlike simple voting systems, our confidence incorporates source quality, independence verification, cross-community agreement, and anti-gaming measures.

**Three types of confidence:**

| Type | Question | Example |
|------|----------|---------|
| **Core Data confidence** | "Did the source say this?" | "Herodotus wrote X" - 0.95 |
| **Placement confidence** | "When did this happen?" | "490 BCE per mainstream" - 0.78 |
| **Frame confidence** | "How confident in this frame's dating?" | Depends on anchor hierarchy |

**Core Data confidence** is about the raw observation - did the source actually say this? This is frame-independent.

**Placement confidence** is frame-dependent - how confident is this frame in placing this event at this date? Different frames may have different confidence for the same factoid's date.

**Community confidence** reflects a specific community's assessment, which may weight sources differently or prefer certain frames.

These may diverge. The divergence itself is data.

---

## Core Principles

### 1. Independence Is Everything
Ten sources that all copy from one original equals one source, not ten. True confidence requires verified independence.

### 2. Transparency Over Authority
Users see exactly how confidence is calculated. No black boxes. Every score shows its work.

### 3. Anti-Gaming by Design
The system resists manipulation through independence verification, velocity limits, and cycle detection.

### 4. Uncertainty Is Honest
When we don't know, we say so. Low confidence is not failure — it's accurate representation of epistemic state.

### 5. Cross-Community Convergence Matters
When independent communities reach the same conclusion through different methods, that's stronger than single-community consensus.

---

## User Stories

### Explorer
- As an explorer, I want to see confidence scores, so I can calibrate my trust.
- As an explorer, I want to understand why confidence is high or low, so I can evaluate for myself.
- As an explorer, I want to see where communities disagree, so I understand contested areas.

### Researcher
- As a researcher, I want to see the independence analysis, so I can verify the methodology.
- As a researcher, I want to contribute independence assessments, so confidence improves.
- As a researcher, I want to be warned about suspicious confidence patterns, so I can investigate.

### Skeptic
- As a skeptic, I want to see when "high confidence" traces to single sources, so I'm not fooled by citation count.
- As a skeptic, I want to detect circular reasoning in source trees, so I can identify artificial support.
- As a skeptic, I want to see confidence without community effects, so I can evaluate raw evidence.

---

## Confidence Components

### Source Health Score

```python
def calculate_source_health(factoid_id):
    """
    Calculate confidence based on source structure.
    """
    sources = get_factoid_sources(factoid_id)
    
    metrics = {
        # Source count (diminishing returns)
        'source_count_score': min(len(sources) / 10, 1.0),
        
        # Primary source presence
        'primary_source_bonus': 0.2 if any(s.source_type == 'primary' for s in sources) else 0,
        
        # Source type mix
        'type_diversity': calculate_type_diversity(sources),
        
        # Root analysis
        'root_count': count_independent_roots(sources),
        'root_depth': calculate_root_depth(sources),
        'concentration_risk': calculate_concentration(sources),
        
        # Cycles
        'has_cycles': detect_citation_cycles(sources),
        'cycle_penalty': -0.3 if detect_citation_cycles(sources) else 0
    }
    
    # Composite score
    score = (
        metrics['source_count_score'] * 0.15 +
        metrics['primary_source_bonus'] +
        metrics['type_diversity'] * 0.15 +
        (metrics['root_count'] / 5) * 0.20 +  # More roots = better
        (1 - metrics['concentration_risk']) * 0.20 +  # Less concentration = better
        metrics['cycle_penalty']
    )
    
    return {
        'score': max(0, min(1, score)),
        'components': metrics,
        'explanation': generate_explanation(metrics)
    }
```

### Independence Score

```python
def calculate_independence_score(factoid_id):
    """
    Calculate how truly independent the sources are.
    """
    sources = get_factoid_sources(factoid_id)
    
    if len(sources) < 2:
        return {'score': 0, 'reason': 'Single source - no independence possible'}
    
    # Get pairwise independence assessments
    independence_matrix = []
    for i, source_a in enumerate(sources):
        for source_b in sources[i+1:]:
            assessment = get_independence_assessment(source_a, source_b)
            if assessment:
                independence_matrix.append(assessment.overall_independence)
    
    if not independence_matrix:
        return {'score': 0, 'reason': 'No independence assessments available'}
    
    # Average independence
    avg_independence = sum(independence_matrix) / len(independence_matrix)
    
    # Independence factors breakdown
    factors = aggregate_independence_factors(sources)
    
    return {
        'score': avg_independence,
        'factors': {
            'geographic': factors.get('geographic', 0),
            'temporal': factors.get('temporal', 0),
            'methodological': factors.get('methodological', 0),
            'cultural': factors.get('cultural', 0),
            'citation_tree': factors.get('citation_tree', 0)
        },
        'assessments_count': len(independence_matrix),
        'explanation': f"{len(independence_matrix)} independence assessments, average {avg_independence:.2f}"
    }
```

### Corroboration Score

```python
def calculate_corroboration(factoid_id):
    """
    Calculate agreement across sources and communities.
    """
    # Direct corroboration (sources agreeing)
    source_agreement = calculate_source_agreement(factoid_id)
    
    # Cross-community corroboration
    namespace_views = get_namespace_views(factoid_id)
    community_agreement = calculate_community_agreement(namespace_views)
    
    # Cross-frame stability
    frame_views = get_frame_views(factoid_id)
    frame_stability = calculate_frame_stability(frame_views)
    
    return {
        'source_agreement': source_agreement,
        'community_agreement': community_agreement,
        'frame_stability': frame_stability,
        'composite': (
            source_agreement * 0.5 +
            community_agreement * 0.3 +
            frame_stability * 0.2
        )
    }
```

### Contradiction Penalty

```python
def calculate_contradiction_penalty(factoid_id):
    """
    Reduce confidence when sources contradict.
    """
    sources = get_factoid_sources(factoid_id)
    contradicting = [s for s in sources if s.relationship == 'contradicts']
    supporting = [s for s in sources if s.relationship in ['supports', 'primary_source']]
    
    if not contradicting:
        return 0  # No penalty
    
    # Weight by source quality
    contradict_weight = sum(source_quality_weight(s) for s in contradicting)
    support_weight = sum(source_quality_weight(s) for s in supporting)
    
    # Penalty proportional to contradiction strength
    if support_weight > 0:
        ratio = contradict_weight / (support_weight + contradict_weight)
    else:
        ratio = 1.0
    
    return ratio * 0.5  # Max 50% penalty
```

---

## Composite Confidence Calculation

### Core Confidence

```python
def calculate_core_confidence(factoid_id):
    """
    Calculate core confidence - the honest epistemic assessment.
    """
    # Component scores
    source_health = calculate_source_health(factoid_id)
    independence = calculate_independence_score(factoid_id)
    corroboration = calculate_corroboration(factoid_id)
    contradiction = calculate_contradiction_penalty(factoid_id)
    
    # Bias adjustment (from source bias profiles)
    bias_adjustment = calculate_bias_adjustment(factoid_id)
    
    # Composite
    raw_score = (
        source_health['score'] * 0.25 +
        independence['score'] * 0.35 +  # Independence weighted heavily
        corroboration['composite'] * 0.25 +
        0.15  # Base (for documented existence)
    )
    
    # Apply penalties
    adjusted = raw_score - contradiction - bias_adjustment
    
    # Clamp to valid range
    final = max(0.05, min(0.95, adjusted))
    
    return {
        'score': final,
        'components': {
            'source_health': source_health,
            'independence': independence,
            'corroboration': corroboration,
            'contradiction_penalty': contradiction,
            'bias_adjustment': bias_adjustment
        },
        'explanation': generate_confidence_explanation(final, source_health, independence, corroboration)
    }
```

### Placement Confidence (Frame-Dependent)

```python
def calculate_placement_confidence(factoid_id, frame_id):
    """
    Calculate confidence in a factoid's temporal placement within a specific frame.
    This depends on the frame's anchor hierarchy and the placement's anchor chain.
    """
    placement = get_placement(factoid_id, frame_id)
    if not placement:
        return {'score': 0, 'reason': 'No placement in this frame'}

    frame = get_frame(frame_id)

    # Get the anchor chain supporting this placement
    anchor_chain = get_anchor_chain(placement.anchor_chain_id)

    if not anchor_chain:
        return {
            'score': placement.confidence or 0.3,
            'reason': 'No anchor chain - using raw placement confidence'
        }

    # Calculate confidence based on anchor hierarchy
    # Hard anchors (astronomical) = highest confidence
    # Soft anchors (documentary) = lower confidence
    anchor_confidence = calculate_anchor_chain_confidence(anchor_chain, frame)

    return {
        'score': anchor_confidence['score'],
        'anchor_type': anchor_confidence['primary_anchor_type'],
        'chain_length': anchor_confidence['chain_length'],
        'frame': frame.name,
        'breakdown': {
            'anchor_strength': anchor_confidence['anchor_strength'],
            'chain_degradation': anchor_confidence['chain_degradation'],
            'frame_weight': anchor_confidence['frame_weight_applied']
        }
    }

def calculate_anchor_chain_confidence(anchor_chain, frame):
    """
    Calculate confidence based on anchor type and chain length.

    Anchor hierarchy (from 04-chronology-system.md):
    - Astronomical: 1.0 (hard anchor, mathematically verifiable)
    - Dendrochronology: 0.95 (countable, near-anchor)
    - Radiocarbon/Ice cores: 0.80-0.85 (scientific claims, disputed)
    - Documentary: 0.70 (textual claims)
    - Traditional: 0.30 (oral tradition)
    """
    # Get the primary anchor (root of chain)
    primary_anchor = get_chain_root_anchor(anchor_chain)

    # Base confidence from anchor type
    anchor_type_confidence = {
        'astronomical': 1.0,
        'dendro': 0.95,
        'radiocarbon': 0.85,
        'ice_cores': 0.80,
        'documentary': 0.70,
        'traditional': 0.30
    }

    base = anchor_type_confidence.get(primary_anchor.anchor_type, 0.5)

    # Apply frame's weight for this anchor type
    frame_weight = frame.anchor_weights.get(primary_anchor.anchor_type, 0.5)
    weighted_base = base * frame_weight

    # Degrade confidence along chain (each step loses some certainty)
    chain_length = len(anchor_chain.links)
    chain_degradation = 0.95 ** chain_length  # 5% loss per link

    final_score = weighted_base * chain_degradation

    return {
        'score': max(0.1, min(0.99, final_score)),
        'primary_anchor_type': primary_anchor.anchor_type,
        'anchor_strength': base,
        'frame_weight_applied': frame_weight,
        'chain_length': chain_length,
        'chain_degradation': chain_degradation
    }
```

### Community Confidence

```python
def calculate_community_confidence(factoid_id, community_id):
    """
    Calculate confidence within a specific community.
    """
    community = get_community(community_id)

    # Community's own assessments
    community_verifications = get_community_verifications(factoid_id, community_id)

    # Community's source preferences
    community_weights = get_community_source_weights(community_id)

    # Apply community-specific weighting
    weighted_sources = weight_sources_for_community(
        get_factoid_sources(factoid_id),
        community_weights
    )

    # Community's frame affects placement confidence
    frame = community.community_frame
    placement_confidence = calculate_placement_confidence(factoid_id, frame.id)

    # Composite
    score = (
        verification_score(community_verifications) * 0.3 +
        weighted_source_score(weighted_sources) * 0.4 +
        placement_confidence['score'] * 0.3
    )

    return {
        'score': score,
        'community': community.name,
        'frame_used': frame.name,
        'verifications': len(community_verifications),
        'placement_confidence': placement_confidence,
        'note': 'Community confidence may differ from core confidence'
    }
```

### Divergence Tracking

```python
def track_confidence_divergence(factoid_id):
    """
    Track where community confidence differs from core confidence.
    Also tracks frame divergence for placement confidence.
    """
    core = calculate_core_confidence(factoid_id)

    divergences = []

    # Community divergence
    for community in get_all_communities():
        comm_conf = calculate_community_confidence(factoid_id, community.id)

        diff = abs(core['score'] - comm_conf['score'])
        if diff > 0.2:  # Significant divergence
            divergences.append({
                'type': 'community',
                'community': community.name,
                'core_confidence': core['score'],
                'community_confidence': comm_conf['score'],
                'divergence': diff,
                'direction': 'community_higher' if comm_conf['score'] > core['score'] else 'community_lower',
                'possible_reasons': analyze_divergence(core, comm_conf)
            })

    # Frame divergence (placement confidence varies by frame)
    for frame in get_all_frames():
        placement_conf = calculate_placement_confidence(factoid_id, frame.id)
        if placement_conf['score'] > 0:
            divergences.append({
                'type': 'frame_placement',
                'frame': frame.name,
                'placement_confidence': placement_conf['score'],
                'anchor_type': placement_conf.get('anchor_type'),
                'chain_length': placement_conf.get('chain_length')
            })

    return divergences
```

---

## Anti-Gaming Measures

### Sockpuppet Independence

```python
def verify_contributor_independence(factoid_id):
    """
    Check that contributors are truly independent.
    """
    contributors = get_factoid_contributors(factoid_id)
    verifiers = get_factoid_verifiers(factoid_id)
    
    # Check for suspicious patterns
    flags = []
    
    # Same IP addresses
    if ip_overlap(contributors):
        flags.append('ip_overlap')
    
    # Mutual verification rings
    if mutual_verification_pattern(contributors, verifiers):
        flags.append('verification_ring')
    
    # New accounts acting together
    if coordinated_new_accounts(contributors):
        flags.append('coordinated_newbies')
    
    # Timing patterns (rapid sequential contributions)
    if suspicious_timing(contributors, factoid_id):
        flags.append('timing_anomaly')
    
    if flags:
        apply_independence_penalty(factoid_id, flags)
        alert_moderators(factoid_id, flags)
    
    return flags
```

### Velocity Limits

```python
def check_velocity_limits(factoid_id):
    """
    Prevent rapid artificial confidence inflation.
    """
    # Get confidence change history
    history = get_confidence_history(factoid_id, window=timedelta(days=7))
    
    # Check for suspicious velocity
    if len(history) > 2:
        recent_change = history[-1]['score'] - history[-3]['score']
        
        if recent_change > 0.3:  # 30% increase in 7 days
            # Flag for review
            flag_rapid_confidence_change(factoid_id, recent_change)
            
            # Apply temporary cap
            apply_confidence_cap(factoid_id, max_score=history[-3]['score'] + 0.1)
            
            return {
                'flagged': True,
                'reason': f'Confidence increased {recent_change:.0%} in 7 days',
                'action': 'Capped pending review'
            }
    
    return {'flagged': False}
```

### Citation Cycle Detection

```python
def detect_and_penalize_cycles(factoid_id):
    """
    Find and penalize circular citation patterns.
    """
    sources = get_factoid_sources(factoid_id)
    citation_graph = build_citation_graph(sources)
    
    cycles = find_cycles(citation_graph)
    
    if cycles:
        # Log the cycles
        for cycle in cycles:
            log_citation_cycle(factoid_id, cycle)
        
        # Calculate penalty based on cycle involvement
        cycle_nodes = set()
        for cycle in cycles:
            cycle_nodes.update(cycle)
        
        affected_ratio = len(cycle_nodes) / len(sources)
        penalty = affected_ratio * 0.4  # Up to 40% penalty
        
        return {
            'cycles_found': len(cycles),
            'affected_sources': len(cycle_nodes),
            'penalty': penalty,
            'cycle_details': [describe_cycle(c) for c in cycles]
        }
    
    return {'cycles_found': 0, 'penalty': 0}
```

### Cross-Community Requirement

```python
def require_cross_community_for_high_confidence(factoid_id, new_score):
    """
    Require cross-community agreement for highest confidence levels.
    """
    if new_score > 0.85:  # High confidence threshold
        community_views = get_community_views(factoid_id)

        # Need agreement from multiple communities
        agreeing_communities = [
            c for c in community_views
            if c.confidence > 0.7
        ]

        if len(agreeing_communities) < 2:
            # Cap at lower level until cross-community agreement
            return {
                'capped': True,
                'cap_level': 0.85,
                'reason': 'High confidence requires agreement from 2+ communities',
                'current_agreement': len(agreeing_communities)
            }

    return {'capped': False}
```

---

## Confidence Display

### Detailed View

```
┌─────────────────────────────────────────────────────────────────┐
│ FACTOID: "Battle of Marathon occurred in 490 BCE"              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ CORE CONFIDENCE: 0.78 ████████████████████░░░░                 │
│                                                                 │
│ BREAKDOWN:                                                      │
│                                                                 │
│ Source Health           0.72 ████████████████░░░░              │
│ ├── Sources: 12 (2 primary, 6 secondary, 4 tertiary)          │
│ ├── Root count: 3 independent roots                            │
│ ├── Root depth: 4 layers average                               │
│ └── Concentration: 45% traces to Herodotus                     │
│                                                                 │
│ Independence            0.65 ████████████████░░░░              │
│ ├── Geographic: HIGH (Greek, Persian, modern sources)          │
│ ├── Temporal: MEDIUM (ancient + modern archaeology)            │
│ ├── Methodological: HIGH (text + archaeology + astronomy)      │
│ └── Citation tree: MEDIUM (some shared ancestry)               │
│                                                                 │
│ Corroboration           0.82 ████████████████████░░            │
│ ├── Source agreement: HIGH                                     │
│ ├── Community agreement: 3 namespaces agree                    │
│ └── Frame stability: Date stable across 4 frames               │
│                                                                 │
│ Penalties Applied:                                              │
│ ├── Contradiction: -0.05 (minor source disputes on details)   │
│ └── Bias adjustment: -0.08 (Greek sources dominate)           │
│                                                                 │
│ PLACEMENT CONFIDENCE (by frame):                                │
│ ├── Mainstream: 0.82 (astronomical anchor, chain length 2)    │
│ ├── Astronomical-only: 0.95 (direct hard anchor)              │
│ └── Compressed: 0.35 (disputes eclipse identification)        │
│                                                                 │
│ COMMUNITY VIEWS:                                                │
│ ├── Academic Research: 0.82 (uses mainstream frame)           │
│ ├── Alternative Chronology: 0.45 (uses compressed frame)      │
│ └── Genealogy Network: 0.78 (uses mainstream frame)           │
│                                                                 │
│ [View source tree] [View independence details] [History]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Simple View

```
Battle of Marathon occurred in 490 BCE

Confidence: ●●●●●●●●○○ 78%
└── Well-sourced with good independence

[Details]
```

### Confidence Badges

```yaml
confidence_badges:
  well_established:
    range: [0.8, 1.0]
    badge: "🟢 Well-established"
    meaning: "Strong evidence, good independence"
    
  supported:
    range: [0.6, 0.8]
    badge: "🟡 Supported"
    meaning: "Good evidence, some limitations"
    
  uncertain:
    range: [0.4, 0.6]
    badge: "🟠 Uncertain"
    meaning: "Limited evidence or contested"
    
  weakly_supported:
    range: [0.2, 0.4]
    badge: "🔴 Weakly supported"
    meaning: "Thin evidence base"
    
  speculative:
    range: [0.0, 0.2]
    badge: "⚪ Speculative"
    meaning: "Little to no verified support"
```

---

## Confidence History

### Change Tracking

```sql
CREATE TABLE confidence_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    factoid_id UUID NOT NULL REFERENCES factoids(id),
    
    -- Snapshot
    core_confidence DECIMAL(3,2) NOT NULL,
    community_confidences JSONB,  -- {namespace_id: score}
    
    -- Components at time of snapshot
    source_health JSONB,
    independence_score JSONB,
    corroboration JSONB,
    penalties_applied JSONB,
    
    -- What triggered the change
    trigger_type VARCHAR(30),
    -- new_source, verification, independence_assessment, correction, recalculation
    trigger_details JSONB,
    
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conf_history_factoid ON confidence_history(factoid_id);
CREATE INDEX idx_conf_history_time ON confidence_history(recorded_at DESC);
```

### History Visualization

```
CONFIDENCE HISTORY: "Battle of Marathon in 490 BCE"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1.0 │                              ┌────────
    │                         ┌────┘
0.8 │                    ┌────┘
    │               ┌────┘
0.6 │          ┌────┘
    │     ┌────┘
0.4 │┌────┘
    ││
0.2 │┘
    │
0.0 └─────────────────────────────────────────────
    Jan    Mar    May    Jul    Sep    Nov
    2024
    
KEY EVENTS:
├── Jan: Initial entry (single source)
├── Mar: +3 secondary sources linked
├── May: Primary source (Herodotus) connected  
├── Jul: Independence assessment completed
├── Sep: Archaeological corroboration added
└── Nov: Cross-community verification

Current: 0.78
Change: +0.53 since creation
```

---

## Features

### MVP (Phase 1)

**Basic confidence**
- Source count
- Primary source bonus
- Simple display

**Transparency**
- Show source list
- Show calculation basics

### Phase 2

**Full confidence system**
- All components
- Independence scoring
- Corroboration tracking
- Penalty system

**Anti-gaming**
- Cycle detection
- Velocity limits
- Cross-community requirements

**Detailed display**
- Full breakdown view
- History tracking
- Community comparisons

### Phase 3 (Dream)

**Predictive confidence**
- "This would increase confidence if..."
- Gap identification for improvement
- Automated suggestions

**Network analysis**
- Graph-based confidence propagation
- Cluster confidence
- Structural vulnerabilities

**Confidence auditing**
- Periodic recalculation
- Drift detection
- Manipulation pattern recognition

---

## Data Model

### factoid_confidence table

```sql
CREATE TABLE factoid_confidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    factoid_id UUID NOT NULL UNIQUE REFERENCES factoids(id),
    
    -- Core confidence
    core_confidence DECIMAL(3,2) NOT NULL,
    
    -- Component scores (cached)
    source_health_score DECIMAL(3,2),
    independence_score DECIMAL(3,2),
    corroboration_score DECIMAL(3,2),
    
    -- Penalties
    contradiction_penalty DECIMAL(3,2) DEFAULT 0,
    bias_penalty DECIMAL(3,2) DEFAULT 0,
    gaming_penalty DECIMAL(3,2) DEFAULT 0,
    
    -- Anti-gaming flags
    velocity_flagged BOOLEAN DEFAULT FALSE,
    cycle_detected BOOLEAN DEFAULT FALSE,
    cross_community_required BOOLEAN DEFAULT FALSE,
    
    -- Component details (full breakdown)
    breakdown JSONB,
    
    -- Calculation metadata
    last_calculated TIMESTAMPTZ DEFAULT NOW(),
    calculation_version INTEGER DEFAULT 1,
    
    CONSTRAINT valid_confidence CHECK (
        core_confidence >= 0 AND core_confidence <= 1
    )
);
```

### independence_assessments table

```sql
CREATE TABLE independence_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Sources being compared
    source_a_id UUID NOT NULL REFERENCES sources(id),
    source_b_id UUID NOT NULL REFERENCES sources(id),
    
    -- Factor scores
    geographic_independence DECIMAL(3,2),
    temporal_independence DECIMAL(3,2),
    methodological_independence DECIMAL(3,2),
    cultural_independence DECIMAL(3,2),
    citation_tree_independence DECIMAL(3,2),
    
    -- Overall
    overall_independence DECIMAL(3,2),
    
    -- Evidence
    reasoning TEXT,
    shared_ancestors UUID[],  -- Common sources if any
    
    -- Verification
    assessed_by UUID REFERENCES users(id),
    assessed_at TIMESTAMPTZ DEFAULT NOW(),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    
    UNIQUE(source_a_id, source_b_id)
);
```

---

## Open Questions

- **Weighting calibration**: How to calibrate component weights? Empirical testing?

- **Gaming arms race**: As gamers learn the system, they'll adapt. How to evolve defenses?

- **Subjectivity in independence**: Independence assessment has subjective elements. How to standardize?

- **Confidence inflation over time**: As more sources are added to everything, does confidence inflate? Normalization?

- **Expert override**: Should verified experts be able to override calculated confidence? With what safeguards?

---

## Dependencies

- **02-data-model.md**: Schema for confidence tables
- **03-source-system.md**: Source health calculation
- **04-chronology-system.md**: Anchor hierarchy, anchor chains for placement confidence
- **08-bias-detection.md**: Bias adjustments
- **09-users-community.md**: Anti-gaming user tracking, Core Data verification
- **11-frames-namespaces.md**: Frame system (anchor weights), Community confidence

---

## Summary

The confidence system answers "how do we know?" with transparency and rigor:

- **Core Data confidence**: Did the source say this? (frame-independent)
- **Placement confidence**: When did this happen? (frame-dependent, based on anchor hierarchy)
- **Community confidence**: How confident is this community? (combines source weighting and frame choice)

By decomposing confidence into verifiable components, integrating the anchor hierarchy (astronomical > dendro > radiocarbon > documentary), requiring independence, detecting gaming, and showing the work, we create trust not through authority but through methodology.

High confidence means something. Low confidence is honest. The system shows its reasoning, and users decide for themselves.
