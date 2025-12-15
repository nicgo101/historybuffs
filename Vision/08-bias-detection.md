# Bias Detection

## Overview

Every historical source has a perspective. Authors have stakes, audiences, agendas. Some viewpoints survive; others are systematically lost. This system doesn't claim to eliminate bias — it makes bias visible.

By profiling authors, classifying genres, tracking whose voices survive and whose are lost, we help users understand not just what sources say, but why they might say it.

---

## Core Principles

### 1. Bias Is Universal
Every source has bias. Primary sources, modern academics, our own system — all have perspectives. The goal isn't to find "unbiased" sources but to understand each source's bias.

### 2. Stake Matters
How much does the author have riding on the narrative? A general writing about his own campaigns has extreme stake. A distant chronicler has less. Stake doesn't mean lying — but it affects what gets emphasized, omitted, framed.

### 3. Genre Shapes Content
A propaganda piece and a private diary follow different rules. Genre conventions affect what can be said and how. Recognizing genre is essential to reading any source.

### 4. Survival Is Selection
What survives is not random. Victors, institutions, literate cultures, elites — their voices dominate. The absence of counter-narratives is itself data.

### 5. Layers of Truth

We distinguish two layers (see detailed "Dual Layer Model" section below):

- **Layer 1: What the source says** (textual fact) - High confidence. The text exists and says this.
- **Layer 2: What happened** (historical inference) - Lower confidence. Must account for bias, stake, and missing perspectives.

A source can be perfectly accurate about Layer 1 ("Caesar wrote that 430,000 were killed") while Layer 2 is highly uncertain ("430,000 were actually killed" - unlikely given extreme author stake).

Note: Interpretation itself can be subjective. "The people celebrated" (victor's account) vs "The people mourned" (vanquished account) - both might be Layer 1 accurate for different populations.

---

## User Stories

### Reader
- As a reader, I want to see the author's stake level, so I can calibrate my trust.
- As a reader, I want to know the source genre, so I understand its conventions.
- As a reader, I want to see whose voices are missing, so I understand the limits of evidence.

### Researcher
- As a researcher, I want to profile authors I add, so their biases are documented.
- As a researcher, I want to flag propaganda vs. history, so readers are warned.
- As a researcher, I want to note counter-narratives that don't survive, so silence is visible.

### Analyst
- As an analyst, I want to see bias patterns across periods, so I understand systematic gaps.
- As an analyst, I want to compare sources with different stakes, so I can triangulate.
- As an analyst, I want to identify when all sources share the same bias, so I flag low independence.

---

## Author Profiling

### Stake Assessment

How much does the author have invested in the narrative?

```
STAKE LEVELS:

NONE
├── Definition: Author has no personal, political, or financial interest in events
├── Example: Byzantine chronicler recording events 500 years earlier in distant land
├── Trust adjustment: Minimal (still subject to sources used)
└── Watch for: Uncritical copying of earlier biased sources

LOW  
├── Definition: Author has opinions but not directly affected
├── Example: Historian writing about foreign events with scholarly interest
├── Trust adjustment: Minor skepticism on interpretations
└── Watch for: Scholarly biases, theoretical commitments

MEDIUM
├── Definition: Author is contemporary, has political/social views engaged
├── Example: Thucydides writing about wars he lived through and had opinions on
├── Trust adjustment: Note potential blind spots, compare perspectives
└── Watch for: Implicit assumptions, cultural biases, hero/villain framing

HIGH
├── Definition: Author is participant whose reputation depends on account
├── Example: General's memoir justifying decisions, politician's autobiography
├── Trust adjustment: Significant skepticism, look for corroboration
└── Watch for: Self-justification, blame-shifting, omission of failures

EXTREME
├── Definition: Author's survival, power, or legal status depends on narrative
├── Example: Caesar during civil war, Soviet historian under Stalin
├── Trust adjustment: Major skepticism, treat as propaganda unless corroborated
└── Watch for: Everything serving author's immediate interests
```

### Author Profile Fields

```sql
-- Fields in actors table for authors

-- When acting as source author:
known_biases TEXT,  -- "Pro-Athenian", "Anti-Persian", "Christian apologist"
political_position TEXT,  -- "Democratic faction", "Imperial loyalist"
patron_or_employer TEXT,  -- Who paid/supported them?
religious_affiliation TEXT,
cultural_identity TEXT,
education_background TEXT,
career_stake TEXT,  -- How did their career depend on what they wrote?

-- Relationships that matter for bias:
-- - employed_by (who paid them)
-- - patron_of / patronized_by
-- - political_ally_of / political_enemy_of
-- - co-religionist_of
```

### Extraction Integration

The extraction pipeline (see 07-extraction-pipeline.md) captures author attribution during AI extraction:

```javascript
// From extraction prompt
{
  claim_text: "The Persians numbered one million men",
  attribution: "author_states",  // How Herodotus presents this
  attribution_detail: null,      // No hedging

  // vs.

  claim_text: "The Egyptians say cats are sacred",
  attribution: "they_say",       // Herodotus attributes to others
  attribution_detail: "the Egyptians say"
}
```

This attribution data feeds directly into bias assessment:
- `i_saw` / `i_heard` → Author as witness (consider stake)
- `they_say` → Author reporting others (consider both author's and reported group's bias)
- `author_states` → Presented as fact (highest need for skepticism)
- `it_is_said` → General tradition (source unclear, treat carefully)

### Bias Indicators

Specific markers to look for:

```
LANGUAGE MARKERS:
├── Charged terms ("barbarians", "savages", "heretics")
├── Consistently positive/negative framing for groups
├── Passive voice hiding agency ("mistakes were made")
└── Round numbers (430,000 killed → suspiciously precise)

STRUCTURAL MARKERS:
├── One side's speeches included, other's summarized
├── One side's motivations explained, other's assumed evil
├── Detailed on victories, vague on defeats
└── Counter-arguments mentioned only to dismiss

OMISSION MARKERS:
├── Known events not mentioned
├── Known figures absent
├── Failures glossed over
├── Alternative interpretations not engaged
```

---

## Genre Classification

### Genre Types

```
HISTORY
├── Characteristics: Attempts objectivity, cites sources, explanatory
├── Trust level: Moderate (depends on period/author)
├── Watch for: Theoretical biases, source selection bias
└── Examples: Herodotus, Thucydides, modern academic history

CHRONICLE
├── Characteristics: Annalistic, less interpretive, records events by year
├── Trust level: Moderate-high for events, low for interpretation
├── Watch for: Institutional bias (monastery, court), copying errors
└── Examples: Anglo-Saxon Chronicle, Byzantine chronicles

PROPAGANDA
├── Characteristics: Explicitly persuasive, serves political purpose
├── Trust level: Low for narrative, useful for understanding agendas
├── Watch for: Everything serves a message
└── Examples: Caesar's Gallic Wars, official inscriptions, state histories

MEMOIR/AUTOBIOGRAPHY
├── Characteristics: Personal account, self-focused
├── Trust level: Good for author's experience, suspect for self-assessment
├── Watch for: Self-justification, selective memory, score-settling
└── Examples: Churchill's war memoirs, ancient generals' accounts

ADMINISTRATIVE
├── Characteristics: Records, lists, accounts, not narrative
├── Trust level: High for recorded facts, low for interpretation
├── Watch for: Institutional perspective, incomplete records
└── Examples: Tax records, census data, military rolls

RELIGIOUS
├── Characteristics: Theological framework shapes everything
├── Trust level: Varies; may preserve older traditions
├── Watch for: Miracles, divine intervention, theological editing
└── Examples: Ecclesiastical histories, hagiography, religious chronicles

EPIC/LITERARY
├── Characteristics: Artistic/entertainment purpose, not primarily factual
├── Trust level: Low for facts, may contain historical kernel
├── Watch for: Genre conventions override accuracy
└── Examples: Homer, medieval romances, national epics

LEGAL
├── Characteristics: Records transactions, disputes, judgments
├── Trust level: High for specific events, limited narrative context
├── Watch for: Legal framing, procedural bias
└── Examples: Court records, treaties, contracts

PRIVATE
├── Characteristics: Not intended for publication (letters, diaries)
├── Trust level: Often more candid than public writing
├── Watch for: Still has audience (letter recipient), emotional state
└── Examples: Personal correspondence, private diaries

ENCYCLOPEDIC
├── Characteristics: Compiles and summarizes, not original research
├── Trust level: Depends entirely on sources used
├── Watch for: Source quality, editorial bias, over-simplification
└── Examples: Pliny's Natural History, medieval encyclopedias
```

### Genre Detection

Questions to classify:

```
1. PRIMARY PURPOSE
   - To record events → Chronicle, Administrative
   - To explain/analyze → History
   - To persuade → Propaganda
   - To entertain → Literary
   - To glorify → Hagiography, Panegyric
   - To justify → Memoir, Apologia

2. INTENDED AUDIENCE
   - General public → Consider propaganda elements
   - Elite/court → Consider patronage bias
   - Institution → Consider institutional interests
   - Private → Potentially more candid
   - Posterity → Consider legacy-building

3. AUTHOR'S ROLE
   - Participant → High stake, insider knowledge
   - Contemporary observer → Medium stake
   - Later compiler → Dependent on sources
   - Official position → Institutional bias

4. SURVIVAL CONTEXT
   - Copied by monasteries → Passed institutional filter
   - Single manuscript → Limited transmission
   - Widely popular → Appealed to some audience
   - Discovered recently → Escaped earlier filters
```

---

## The Dual Layer Model

### Layer 1: What the Source Says (Textual Fact)

High confidence. The source exists and contains these words.

```javascript
{
  layer: 1,
  statement: "Caesar writes that 430,000 Usipetes and Tencteri were killed",
  confidence: 0.99,  // The text says this
  source: "De Bello Gallico, Book 4",
  verifiable_by: "Reading the text"
}
```

### Layer 2: What Happened (Historical Inference)

Lower confidence. Must account for bias.

```javascript
{
  layer: 2,
  statement: "430,000 Usipetes and Tencteri were killed",
  confidence: 0.30,  // Much lower
  
  confidence_factors: {
    author_stake: "EXTREME - Caesar's political career at stake",
    genre: "PROPAGANDA - Written to justify to Roman public",
    number_type: "Suspiciously round",
    corroboration: "No independent verification",
    counter_narrative: "Usipetes/Tencteri accounts do not survive",
    archaeological: "No mass grave found to support scale"
  },
  
  adjusted_assessment: "Large massacre occurred; scale likely exaggerated"
}
```

### Dual Layer in Database

```sql
-- In factoid_sources table:

-- Layer 1: What source says
relevant_excerpt TEXT,  -- Exact quote
relationship VARCHAR(30),  -- 'states', 'claims', 'reports'

-- Layer 2: Historical inference
author_attribution VARCHAR(50),  -- How author sourced it
confidence_weight DECIMAL(3,2),  -- Adjusted for bias

-- Bias factors affecting Layer 2
bias_factors JSONB DEFAULT '{}',
-- {
--   "author_stake": "extreme",
--   "genre_adjustment": -0.3,
--   "round_number_flag": true,
--   "corroboration_status": "none"
-- }
```

---

## Lost Voices Tracking

### The Problem

What survives is selected. For most of history:
- Victors over vanquished
- Literate over illiterate
- Elites over commoners
- Institutions over individuals
- Men over women
- Colonizers over colonized

The absence of counter-narratives doesn't mean consensus. It may mean suppression or destruction.

### Tracking Systematic Gaps

```sql
CREATE TABLE narrative_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- What's missing
    missing_perspective TEXT NOT NULL,
    -- "Gallic accounts of Roman conquest"
    -- "Female perspectives on Athenian society"
    -- "Commoner views of Roman Republic"

    -- Period description (raw, frame-independent)
    period_description TEXT,  -- "During the Gallic Wars", "Classical Athens"
    geographic_scope TEXT,

    -- Related entities (for linking to factoids/events)
    related_event_ids UUID[] DEFAULT '{}',
    related_actor_ids UUID[] DEFAULT '{}',
    related_location_ids UUID[] DEFAULT '{}',

    -- Why it's missing
    gap_reason VARCHAR(50),
    -- destroyed, never_written, suppressed, not_preserved, unknown

    gap_explanation TEXT,

    -- Evidence for the gap
    evidence_for_gap TEXT,
    -- "Caesar mentions Gallic druids had oral traditions now lost"
    evidence_source_ids UUID[] DEFAULT '{}',

    -- What we do have instead
    surviving_perspectives TEXT[],
    -- ["Roman military accounts", "Roman elite commentary"]
    surviving_source_ids UUID[] DEFAULT '{}',

    -- Impact on interpretation
    interpretation_impact TEXT,

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gaps_reason ON narrative_gaps(gap_reason);
```

Note: Gaps describe meta-level absences in the historical record. Rather than assigning specific dates (which would be frame-dependent), we link gaps to related events, actors, and locations. The period is described in raw text form.

### Gap Display

For any topic, show what's missing:

```
┌─────────────────────────────────────────────────────────────────┐
│ TOPIC: Gallic Wars (58-50 BCE)                                 │
├─────────────────────────────────────────────────────────────────┤
│ SURVIVING PERSPECTIVES:                                         │
│ ├── Caesar (Roman general, commander) - EXTREME stake          │
│ ├── Cicero (Roman politician) - References in letters          │
│ ├── Later Roman historians (Livy, etc.) - Based on Caesar      │
│ └── Archaeological evidence - Settlements, artifacts           │
│                                                                 │
│ ⚠️ LOST PERSPECTIVES:                                           │
│ ├── Gallic self-accounts (oral tradition, not preserved)       │
│ ├── Gallic writing (if any existed, destroyed)                 │
│ ├── Roman common soldiers (illiterate, no records)             │
│ ├── Civilian populations (Gallic and Roman)                    │
│ └── Women (on all sides)                                       │
│                                                                 │
│ BIAS WARNING:                                                   │
│ All narrative accounts derive from the conquering side.        │
│ Counter-narratives do not survive.                             │
│ Caesar's account served his immediate political interests.     │
│                                                                 │
│ Numbers, motivations, and framing should be treated with       │
│ significant skepticism.                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Common Gap Patterns

```
VICTOR/VANQUISHED
├── Roman vs. Carthaginian accounts (Carthage destroyed)
├── Greek vs. Persian accounts (Greek victory, Persian archives less accessible)
├── Colonial vs. Indigenous accounts (widespread)
└── Revolutionary vs. Ancien régime (losers' archives often destroyed)

LITERATE/ORAL
├── Greek accounts of "barbarian" peoples
├── Christian accounts of pagan religions
├── Written histories vs. oral traditions
└── Administrative records vs. folk memory

ELITE/COMMON
├── Senatorial history vs. plebeian experience
├── Court chronicles vs. peasant life
├── Merchant records vs. worker conditions
└── Intellectual discourse vs. popular belief

INSTITUTIONAL/INDIVIDUAL
├── Church history vs. lay perspectives
├── State records vs. family memory
├── Official accounts vs. dissent
└── Approved history vs. suppressed alternatives

GENDER
├── Male-authored accounts dominate almost everywhere
├── Women's experiences filtered through male writing
├── Domestic/private sphere under-documented
└── Female-authored texts often lost or unattributed
```

---

## Confidence Adjustment

### Bias-Adjusted Confidence

```python
def calculate_bias_adjusted_confidence(factoid, source_link):
    """
    Adjust confidence based on bias factors.
    """
    base_confidence = source_link.base_confidence
    
    # Author stake adjustment
    stake_adjustments = {
        'none': 0.0,
        'low': -0.05,
        'medium': -0.15,
        'high': -0.30,
        'extreme': -0.50
    }
    adjustment = stake_adjustments.get(source_link.source.author_stake, 0)
    
    # Genre adjustment
    genre_adjustments = {
        'administrative': 0.0,
        'chronicle': -0.05,
        'history': -0.10,
        'memoir': -0.20,
        'propaganda': -0.40,
        'epic': -0.50
    }
    adjustment += genre_adjustments.get(source_link.source.genre, -0.10)
    
    # Round number penalty
    if is_suspiciously_round(factoid.description):
        adjustment -= 0.15
    
    # Corroboration bonus
    independent_sources = count_independent_sources(factoid)
    adjustment += min(independent_sources * 0.10, 0.30)
    
    # Counter-narrative penalty
    if no_counter_narrative_survives(factoid):
        adjustment -= 0.10
    
    # Apply adjustment
    adjusted = base_confidence + adjustment
    return max(0.05, min(0.95, adjusted))  # Clamp to reasonable range
```

### Displaying Adjustments

```
CLAIM: "430,000 killed in massacre"

BASE CONFIDENCE: 0.70 (source states clearly)

ADJUSTMENTS:
├── Author stake (extreme): -0.50
├── Genre (propaganda): -0.40  
├── Round number: -0.15
├── No corroboration: +0.00
├── No counter-narrative: -0.10
├── Physical evidence: +0.00
└── TOTAL ADJUSTMENT: -1.15

LAYER 2 CONFIDENCE: 0.05 (minimum floor)

INTERPRETATION: Source clearly states this. However, extreme
author stake, propaganda genre, suspiciously round number, and
lack of counter-narrative suggest significant exaggeration.
A massacre likely occurred; scale is highly uncertain.
```

---

## Frame-Dependent Bias Evaluation

Bias assessment itself can be frame-dependent. Different chronological or interpretive frameworks may evaluate the same source's bias differently.

### The Problem

Consider a hagiography (saint's life):
- **Secular academic frame**: High bias - miracle claims, theological agenda, institutional interests
- **Religious devotional frame**: Moderate bias - author's piety is feature not bug, miracles accepted
- **Mythological research frame**: Low bias for symbolic content - looking for patterns, not literal truth

The same text, evaluated differently depending on what you're trying to learn.

### Bias Profiles as Frame-Linked

```sql
-- Bias evaluations can vary by frame
CREATE TABLE source_bias_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    source_id UUID NOT NULL REFERENCES sources(id),
    frame_id UUID REFERENCES reference_frames(id),  -- NULL = universal evaluation

    -- Bias assessment for this frame
    stake_level VARCHAR(20),  -- none, low, medium, high, extreme
    genre_classification VARCHAR(30),
    bias_notes TEXT,
    trust_adjustment DECIMAL(3,2),

    -- Frame-specific reasoning
    evaluation_reasoning TEXT,
    -- "From a secular perspective, the miracle accounts indicate hagiographic convention"
    -- vs. "From a devotional perspective, the miracles are the point"

    -- Metadata
    evaluated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Example: Evaluating Josephus

```javascript
// Secular academic frame
{
  source: "Josephus - Jewish War",
  frame: "Mainstream Academic",
  stake_level: "high",
  genre: "propaganda/history hybrid",
  bias_notes: "Writing for Roman audience, justifying own surrender, theological agenda",
  trust_adjustment: -0.30
}

// Jewish historical frame
{
  source: "Josephus - Jewish War",
  frame: "Jewish History",
  stake_level: "high",
  genre: "apologetic history",
  bias_notes: "Despite Roman patronage, preserves Jewish perspective otherwise lost",
  trust_adjustment: -0.15  // Less harsh - the alternative is silence
}

// Alternative chronology frame
{
  source: "Josephus - Jewish War",
  frame: "Fomenko Chronology",
  stake_level: "unknown",
  genre: "possibly medieval compilation",
  bias_notes: "Dating of text itself questioned; may not be 1st century",
  trust_adjustment: -0.50
}
```

### Default Behavior

- If no frame-specific evaluation exists, use universal (NULL frame) evaluation
- If no evaluation exists at all, use system defaults based on genre
- Users can create frame-specific evaluations for their research needs

---

## Source Reader Bias Display

When users read sources via the Source Reader (see 21-source-reader.md), bias information should be visible.

### Reading View Integration

```
┌─────────────────────────────────────────────────────────────────┐
│ READING: Caesar - De Bello Gallico                              │
│ Book IV, Chapter 15                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ⚠️ BIAS ALERT: EXTREME STAKE                                     │
│ Author: Military commander describing own campaign               │
│ Genre: Political propaganda                                      │
│ Purpose: Justify actions to Roman Senate and public             │
│                                                                  │
│ [Show Details] [Dismiss for Session]                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ "Having killed 430,000 of the enemy..."                         │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📊 CLAIM ANALYSIS                                           │ │
│ │                                                             │ │
│ │ Layer 1 (textual): Caesar states 430,000 killed ✓          │ │
│ │ Layer 2 (historical): Highly uncertain                      │ │
│ │                                                             │ │
│ │ Red flags:                                                  │ │
│ │ • Suspiciously round number                                │ │
│ │ • Extreme author stake                                      │ │
│ │ • No counter-narrative survives                            │ │
│ │ • No archaeological corroboration                          │ │
│ │                                                             │ │
│ │ [Compare Other Sources] [View Lost Perspectives]           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Playback Bias Cues

During book playback:
- **Bias indicator**: Persistent icon showing current source's stake level
- **Claim highlighting**: High-stake claims highlighted differently
- **Gap warnings**: When entering topics with known narrative gaps, display warning
- **Attribution display**: Show whether author claims firsthand knowledge or reports others

```javascript
// Playback bias configuration
{
  show_stake_indicator: true,
  highlight_high_stake_claims: true,
  show_attribution_badges: true,  // "Caesar states" vs "Others report"
  gap_warnings: true,
  round_number_flags: true
}
```

---

## Features

### MVP (Phase 1)

**Basic author profiling**
- Stake level (dropdown)
- Genre classification (dropdown)
- Free-text bias notes

**Simple bias display**
- Show stake level on sources
- Show genre on sources
- Warning icons for high-stake sources

### Phase 2

**Structured bias factors**
- Multiple bias dimensions
- Quantified adjustments
- Confidence impact calculation

**Lost voices tracking**
- Document known gaps
- Display gap warnings on topics
- Link gaps to factoids

**Comparative bias analysis**
- Side-by-side source comparison
- Independence assessment with bias consideration
- "All sources share this bias" warnings

### Phase 3 (Dream)

**AI-assisted bias detection**
- Language analysis for charged terms
- Structural analysis for one-sidedness
- Automatic flagging of propaganda markers

**Systematic gap analysis**
- Period-by-period gap assessment
- Automatic identification of under-documented perspectives
- "What's missing" reports for any query

**Counter-narrative search**
- "Find alternative perspectives" feature
- Cross-cultural source matching
- Archaeological counter-evidence linking

---

## Bias Profile Template

For each source, capture:

```yaml
source_bias_profile:
  # Author factors
  author_stake: extreme  # none/low/medium/high/extreme
  author_role: participant  # participant/contemporary/later/unknown
  author_affiliation: Roman military elite
  patron_interests: Caesar needed military glory for political career
  
  # Work factors
  genre: propaganda  # history/chronicle/propaganda/memoir/etc.
  intended_audience: Roman public and Senate
  purpose: Justify Gallic campaign, build political support
  
  # Survival factors
  survival_reason: Became school text, copied extensively
  institutional_filter: Roman/Christian educational system
  lost_alternatives: Gallic accounts, if any existed
  
  # Content markers
  language_bias: "Barbarians" used for non-Romans
  structural_bias: Gallic speeches summarized, Roman speeches quoted
  omissions_noted: Defeats minimized, atrocity details selective
  round_numbers: Multiple suspiciously round casualty figures
  
  # Overall assessment
  primary_value: Roman military perspective, campaign logistics
  primary_limitation: Extreme self-interest, no counter-narrative
  recommended_use: Treat as primary source for Caesar's claims; 
                   do not treat as objective account of events
```

---

## Open Questions

- **Bias scoring granularity**: How fine-grained should adjustment scores be? Risk of false precision?

- **AI bias detection**: Can AI reliably detect bias markers? Risk of false positives?

- **Controversial biases**: How to handle sources whose biases are themselves contested? (e.g., religious texts)

- **Modern sources**: How to handle bias in modern academic sources? (Theoretical commitments, institutional pressures)

- **Meta-bias**: How to acknowledge and track our own system's biases?

---

## Dependencies

- **01-core-concepts.md**: Actor entity for author profiling, Frame concept for bias evaluation
- **02-data-model.md**: Schema for bias fields, narrative_gaps, source_bias_evaluations
- **03-source-system.md**: Source classification, source layers
- **04-chronology-system.md**: Frames that bias evaluations can be linked to
- **07-extraction-pipeline.md**: Author attribution extraction
- **15-confidence-system.md**: Confidence calculation integration
- **21-source-reader.md**: Bias display during reading/playback

---

## Summary

Bias detection doesn't claim to achieve objectivity — it achieves transparency. By systematically documenting who wrote what, why, and for whom, and by tracking whose voices are absent, we give users the tools to read sources critically rather than naively.

The source said it. But why did they say it? And who isn't speaking?

These questions matter as much as the claims themselves.
