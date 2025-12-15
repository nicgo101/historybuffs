# Source System

## Overview

The source system is the epistemic backbone of the project. Every claim traces to a source. Every source can be examined for reliability, bias, and independence. The citation tree — showing how sources reference each other — reveals whether apparent consensus has deep roots or shallow ones.

**The core insight**: What looks like independent verification often isn't. A "fact" cited by 50 books may trace through layers of citation to a single origin. The source system makes this visible.

---

## Core Principles

### 1. Everything Has a Source
No floating claims. Every factoid links to at least one source. If something can't be sourced, it's flagged as "hearsay" — visible but marked.

### 2. Sources Have Character
A source isn't just a reference — it's an entity with properties: who created it, what was their stake, what genre is it, how did it survive. These properties affect how we weight it.

### 3. Citations Are Explicit
When Source A uses information from Source B, we record that relationship. Over time, this builds the citation tree — the ancestry of any claim.

### 4. Independence Is Verified, Not Assumed
Two sources agreeing doesn't mean independent verification. If they share a common ancestor in the citation tree, they're not independent. Independence must be explicitly assessed.

### 5. Roots Matter More Than Canopy
A claim with 100 tertiary sources but only 1 primary source root is weaker than a claim with 5 truly independent primary sources. We measure and display root structure.

---

## Source Layers

A single factoid often involves multiple layers of "source" - each with its own reliability questions.

### The Three Layers

```
LAYER 1: TRANSMISSION SOURCE (Physical Container)
├── The document/book/artifact we're extracting from
├── Example: "Histories" by Herodotus (specific manuscript/edition)
├── Questions: Is the text corrupted? Is this a faithful copy?
└── This is WHERE we got the information

LAYER 2: AUTHORIAL SOURCE (Who Created It)
├── The person who wrote/created the document
├── Example: Herodotus himself (writing ~450 BCE)
├── Questions: Was he present? What's his bias? Is he reliable?
└── This is WHO is telling us

LAYER 3: CLAIMED SOURCE (Attribution Within)
├── What the author says THEIR source was
├── Example: "The Egyptian priests told me..." / "Emperor X decreed..."
├── Questions: Is this attribution real? Did the author invent it?
└── This is WHO THE AUTHOR CLAIMS told them
```

### Why This Matters

Each layer can fail independently:

```
FACTOID: "Emperor Psamtik proved Phrygian was the oldest language"

TRANSMISSION: Histories, Book II ✓
├── Text is well-preserved
└── Multiple manuscript traditions agree

AUTHORIAL: Herodotus ?
├── Writing 100+ years after alleged events
├── Known for including entertaining stories
└── Reliability: Medium

CLAIMED SOURCE: "The Egyptians say..." ?
├── Which Egyptians? Priests? Officials?
├── Did Herodotus understand correctly?
├── Is this propaganda? Court flattery?
└── We have only Herodotus's word

VERDICT: One source (Herodotus) claiming Egyptian oral tradition.
         Not independently verifiable.
```

### Modeling Source Layers

```
SOURCE (physical/documentary - Layer 1)
├── The container we extract from
├── Has author_id linking to authorial source
└── Tracked in sources table

AUTHOR (person/institution - Layer 2)
├── The creator of the source
├── Tracked in actors table
└── Linked via sources.author_id

ATTRIBUTION CHAIN (claimed sources - Layer 3)
├── What the author claims as their source
├── Tracked on factoid_sources or separately
├── May link to actors (if we can identify them)
└── Often unverifiable ("priests say", "it is said")
```

---

## Extraction Sets

When we systematically extract data from a source (like cataloguing all events, actors, and dates from Herodotus's Histories), we create an **extraction set** - a corpus of interconnected factoids from a single source.

### Concept

```
EXTRACTION SET: "Herodotus Histories - Complete"
├── Source: Histories by Herodotus
├── Factoids extracted: 523
├── Actors identified: 214
├── Locations mentioned: 89
├── Events catalogued: 312
├── Weather/astronomical: 23
└── Status: Complete

All extracted factoids are tagged with this extraction_set_id
```

### Use Cases

**Explore a single historian's worldview:**
- Filter to show only Herodotus's claims
- See his internal timeline and geography
- Understand how HE saw history

**Compare to external evidence:**
- Toggle: "Herodotus only" vs "Herodotus + archaeology"
- See where external evidence supports or contradicts
- Identify claims with no corroboration

**Cross-source analysis:**
- Extract from Herodotus, Thucydides, Ctesias
- Compare their accounts of same events
- See contradictions and agreements

**Lens integration:**
- Create lens: "Herodotus's World"
- Shows only his extraction set
- His dating, his geography, his worldview
- Then overlay other frames/sources

### What Gets Extracted

From a text like Herodotus:
- **Events**: Battles, treaties, deaths, constructions
- **Actors**: Kings, generals, priests, peoples, institutions
- **Locations**: Cities, rivers, regions, monuments
- **Dates**: As the author states them (raw, frame-independent)
- **Relationships**: Who ruled whom, who fought whom, genealogies
- **Environmental**: Eclipses, floods, famines, plagues
- **Claimed sources**: Who Herodotus says told him what

### Extraction Metadata

Each factoid from an extraction set carries:
- `extraction_set_id`: Which corpus it belongs to
- `extraction_location`: Book II, Chapter 5, Paragraph 3
- `extraction_confidence`: AI confidence in extraction accuracy
- `author_attribution`: What Herodotus claims as his source
- `verified`: Has a human reviewed this extraction?

---

## User Stories

### Explorer
- As an explorer, I want to click on any claim and see its sources, so I can evaluate the foundation.
- As an explorer, I want to see the source tree visualization, so I can understand how deep the roots go.
- As an explorer, I want to filter by source quality, so I can focus on well-sourced claims.

### Researcher
- As a researcher, I want to add sources I've found, so the knowledge base grows.
- As a researcher, I want to link sources to claims, so the connection is documented.
- As a researcher, I want to record citation relationships between sources, so the tree is accurate.

### Skeptic
- As a skeptic, I want to see root concentration metrics, so I know if a "well-established fact" has shallow roots.
- As a skeptic, I want to see where sources disagree, so I can investigate contradictions.
- As a skeptic, I want to identify circular citations, so I can spot artificial reinforcement.

### Contributor
- As a contributor, I want to mark sources as primary/secondary/tertiary, so the hierarchy is clear.
- As a contributor, I want to note the author's stake and bias, so readers can adjust.
- As a contributor, I want to flag sources with uncertain provenance, so trust is calibrated.

---

## Source Classification

### Source Hierarchy

```
PRIMARY SOURCE
Definition: Created during the period under study, by direct participants or witnesses.

Examples:
- Eyewitness account
- Contemporary document (letter, decree, record)
- Physical artifact
- Inscription or monument
- Archaeological finding

Characteristics:
- Closest to events
- May have direct bias (participant)
- Doesn't mean "true" — means "contemporary"
- Highest evidential weight for occurrence

---

SECONDARY SOURCE
Definition: Created after the period, based on primary sources or other secondary sources.

Examples:
- Ancient historian writing about earlier events (Herodotus on Persian Wars)
- Medieval chronicle compiling earlier records
- Modern academic history based on sources
- Analysis or interpretation

Characteristics:
- Distance from events (temporal, sometimes cultural)
- May have access to now-lost primary sources
- Subject to compiler's bias and errors
- Varying quality depending on methods

---

TERTIARY SOURCE
Definition: Compiles and summarizes secondary sources, no original research.

Examples:
- Textbook
- Encyclopedia
- Documentary
- Wikipedia article
- Popular history book

Characteristics:
- Furthest from events
- Dependent on secondary sources' accuracy
- Often smooths over debates and uncertainties
- Useful for entry points, not for evidence
```

### Source Genre

Genre affects how we read the source:

```
HISTORY
- Attempts objectivity
- Cites sources (ideally)
- Subject to method of the period
- Varies widely in quality

CHRONICLE
- Records events (often annalistic)
- Less interpretation
- May be contemporary or compiled later
- Often institutional (monastery, court)

PROPAGANDA
- Explicitly persuasive intent
- Author stake: high to extreme
- Truth subordinate to purpose
- Still valuable if read critically

MEMOIR
- Personal account
- Self-serving likely
- Intimate detail possible
- Memory fallibility issues

ADMINISTRATIVE
- Records, lists, accounts
- Less narrative bias
- Institutional perspective
- Often fragmentary

RELIGIOUS
- Theological frame affects everything
- May preserve older traditions
- Interpretation required
- Genre conventions matter

EPIC/LITERARY
- Truth not primary purpose
- May contain historical kernel
- Genre heavily mediates content
- Dating often uncertain

LEGAL
- Records transactions, disputes
- Institutional bias
- Specific, datable events
- Limited narrative context

PRIVATE
- Letters, diaries
- Less public performance
- Candid possible
- Survival often accidental
```

### Author Stake

How much does the author have riding on the narrative?

```
NONE
- Distant compiler with no personal involvement
- Example: Byzantine chronicler recording distant events

LOW
- Has preferences but not directly affected
- Example: Historian with interpretive stance but no personal stake

MEDIUM
- Contemporary with political/social views engaged
- Example: Thucydides writing about wars he lived through

HIGH
- Participant whose reputation depends on account
- Example: General's memoir justifying campaigns

EXTREME
- Survival, power, or legal status depends on narrative
- Example: Caesar writing during civil war about his own actions
```

---

## The Source Tree

### Concept

Every citation creates a link. Follow the links downward and you reach the roots — the primary sources (or the point where the trail goes cold).

```
VISUALIZATION:

        [Modern textbook] [Wikipedia] [Documentary]
              ↓              ↓            ↓
         [Academic paper A] [Paper B] [Paper C]
              ↓              ↓            ↓
            [19th century historian X]
                      ↓
            [18th century compilation Y]
                      ↓
            [Single chronicle from 1400s]
                      ↓
                 [Unknown origin]

From the top: "Multiple sources agree on this."
Traced to root: One chronicle of uncertain provenance.
```

### Metrics

**Root Count**
How many truly independent primary sources support this claim?
- High root count = robust foundation
- Low root count = shallow foundation

**Root Depth**
How many citation layers to the deepest root?
- Deep = distant from evidence
- Shallow = closer to evidence

**Concentration Risk**
What percentage of supporting sources trace to a single root?
- High concentration = fragile (single point of failure)
- Low concentration = distributed (multiple independent supports)

**Cycle Detection**
Are there circular citations where A cites B cites C cites A?
- Cycles artificially inflate apparent support
- System detects and flags

### Calculation

```python
def calculate_root_metrics(factoid_id):
    # Get all sources for this factoid
    sources = get_factoid_sources(factoid_id)
    
    # Build citation graph
    graph = build_citation_graph(sources)
    
    # Find roots (sources with no citations, or primary sources)
    roots = find_roots(graph)
    
    # Calculate metrics
    return {
        'root_count': len(roots),
        'root_depth': max_path_length(graph),
        'concentration_risk': max_source_concentration(graph, roots),
        'has_cycles': detect_cycles(graph),
        'primary_source_roots': count_primary_roots(roots),
        'independent_roots': count_verified_independent(roots)
    }
```

---

## Independence Verification

### The Problem

Two sources may both say X, but if Source B read Source A, they're not independent verification. They're one verification echoed.

Independence must be explicitly assessed, not assumed.

### Independence Factors

**Geographic Independence**
- Sources from China and Peru = high independence
- Sources from London and Oxford = low independence

**Temporal Independence**
- Ancient account + modern archaeology finding same thing = high
- Two papers from same decade citing same earlier work = low

**Methodological Independence**
- Textual analysis + carbon dating + astronomical calculation = high
- Three linguistic analyses using same method = lower

**Cultural Independence**
- Unconnected cultures with same tradition = high
- Same academic network/school = low

**Citation Tree Independence**
- No shared ancestors in citation tree = high
- Common ancestor within 2 steps = low

### Independence Score

```python
def calculate_independence(source_a, source_b):
    scores = {
        'geographic': geographic_distance_score(source_a, source_b),
        'temporal': temporal_distance_score(source_a, source_b),
        'methodological': methodological_difference_score(source_a, source_b),
        'cultural': cultural_distance_score(source_a, source_b),
        'citation_tree': citation_independence_score(source_a, source_b)
    }
    
    weights = {
        'geographic': 0.20,
        'temporal': 0.20,
        'methodological': 0.25,
        'cultural': 0.20,
        'citation_tree': 0.15
    }
    
    return sum(scores[k] * weights[k] for k in scores)
```

### Verification Process

Independence isn't auto-calculated (too complex for automation). It requires human assessment:

1. User selects two sources
2. System prompts for each factor
3. User provides reasoning and evidence
4. Score calculated and stored
5. Other users can challenge/corroborate

---

## Source Health Dashboard

For any claim, show:

```
┌─────────────────────────────────────────────────────┐
│ CLAIM: "The Battle of Marathon occurred in 490 BCE" │
├─────────────────────────────────────────────────────┤
│ SOURCE SUMMARY                                      │
│                                                     │
│ Total sources citing this: 47                       │
│ Primary sources: 2                                  │
│ Secondary sources: 8                                │
│ Tertiary sources: 37                                │
│                                                     │
│ ROOT ANALYSIS                                       │
│                                                     │
│ Independent roots: 3                                │
│ ├── Herodotus (primary-ish, 50 years after)        │
│ ├── Marathon tumulus archaeology                    │
│ └── Dated inscriptions (2)                          │
│                                                     │
│ Concentration risk: 68%                             │
│ (68% of citations trace through Herodotus)          │
│                                                     │
│ Citation cycles detected: No                        │
│                                                     │
│ INDEPENDENCE ASSESSMENT                             │
│                                                     │
│ Herodotus ↔ Archaeology: INDEPENDENT               │
│   (different methodology, no textual dependency)    │
│                                                     │
│ Herodotus ↔ Inscriptions: PARTIAL                  │
│   (inscriptions dated using framework from texts)   │
│                                                     │
│ ⚠️ Note: Majority of "sources" are secondary/       │
│    tertiary, all deriving from same primary base    │
│                                                     │
│ [View full source tree] [View independence details] │
└─────────────────────────────────────────────────────┘
```

---

## Features

### MVP (Phase 1)

**Source entry and management**
- Create source records with full classification
- Upload or link to source text
- Mark source type, genre, author stake

**Basic citation linking**
- Record "Source A cites Source B"
- Note citation type (quote, paraphrase, reference)

**Source-factoid linking**
- Connect factoids to supporting sources
- Record relevant excerpt and page/section

**Simple source list on factoids**
- Display sources for any claim
- Show source type and basic info

### Phase 2

**Source tree visualization**
- Interactive tree showing citation ancestry
- Zoom/pan, expand/collapse nodes
- Color coding by source type

**Root metrics calculation**
- Automated count of roots
- Depth calculation
- Concentration risk percentage

**Independence assessment interface**
- Guided workflow for assessing independence
- Storage of assessments
- Display on relevant factoids

**Cycle detection**
- Automated detection of citation cycles
- Visual flagging
- Cycle display in tree view

### Phase 3 (Dream)

**AI-assisted citation extraction**
- When processing documents, identify what they cite
- Build citation graph automatically
- Human verification of AI suggestions

**Cross-corpus analysis**
- "Show all sources about X across the database"
- Automatic source clustering
- Gap identification (what's missing?)

**Authority decay modeling**
- Weight sources by how often they're independently verified
- Surface sources that are over-relied-upon
- Identify "hub" sources that everything depends on

**Counter-narrative tracking**
- For any claim, track if counter-arguments existed
- Note if they survive or were suppressed
- "This was contested at the time by..."

---

## Anti-Pattern Detection

### The Echo Chamber Pattern

**Detection**: Many sources, but all trace to single root
**Display**: "⚠️ 45 sources, but only 1 independent root"
**User action**: Understand the apparent consensus is shallow

### The Circular Citation Pattern

**Detection**: A cites B cites C cites A
**Display**: "⚠️ Citation cycle detected" with visual
**User action**: Don't count cycle members as independent

### The Telephone Pattern

**Detection**: Long chain of secondary sources, each adding interpretation
**Display**: "⚠️ 8 layers of interpretation between claim and primary source"
**User action**: Trace to primary, compare to final claim

### The Lost Counter-Narrative Pattern

**Detection**: Source mentions opposition that no longer survives
**Display**: "ℹ️ Counter-narrative existed but is now lost"
**User action**: Weight claim knowing it was contested

### The Survivor Bias Pattern

**Detection**: All sources from one side of a conflict
**Display**: "⚠️ All sources from victorious side"
**User action**: Consider what opposing perspective would say

---

## Workflow: Adding a Source

```
1. BASIC INFORMATION
   - Title
   - Author (create or link Actor)
   - Raw dating evidence (what do we know about when this was composed?)
   
2. CLASSIFICATION
   - Type: primary / secondary / tertiary
   - Genre: history / chronicle / propaganda / etc.
   - Author stake: none / low / medium / high / extreme
   
3. PROVENANCE
   - Survival path: how did this survive?
   - Current location: where is it now?
   - Examination history: who has studied it?
   
4. CONTENT
   - Upload text (if available)
   - Link to digital version (if available)
   - Language and translation notes
   
5. CITATIONS (optional, can add later)
   - What does this source cite?
   - What earlier sources does it depend on?
   
6. REVIEW
   - Preview source record
   - Submit for community review
```

---

## Workflow: Linking Source to Factoid

```
1. SELECT FACTOID
   - Find existing factoid or note new one needed
   
2. SELECT SOURCE
   - Search existing sources or add new one
   
3. SPECIFY RELATIONSHIP
   - supports / contradicts / mentions
   - How strongly? (primary evidence / supporting / tangential)
   
4. LOCATE IN SOURCE
   - Page/section reference
   - Relevant excerpt (quoted or paraphrased)
   
5. NOTE AUTHOR'S OWN ATTRIBUTION
   - Did the source author say where they got this?
   - "I saw" / "Greeks say" / "it is said" / unattributed
   
6. SUBMIT
   - Link created
   - Factoid confidence recalculated
```

---

## Open Questions

- **Orphan sources**: Allow sources with no linked factoids? (Useful for building the library before extraction)

- **Source versioning**: How to handle different editions, translations, manuscript variants?

- **Automated extraction**: When AI extracts citations from text, how to handle uncertainty?

- **Lost source inference**: If Source A says "according to Source B" but B is lost, how to represent?

- **Aggregate sources**: How to handle "all ancient sources agree" without listing each?

---

## Dependencies

- **01-core-concepts.md**: Source entity definition
- **02-data-model.md**: Schema for sources, citations, factoid_sources
- **08-bias-detection.md**: Author stake and genre analysis

---

## Technical Notes

### Citation Graph Storage

Citations form a directed acyclic graph (DAG) in the ideal case. Cycles are possible (and should be detected, not prevented).

Options:
1. Adjacency list in `source_citations` table (current design)
2. PostgreSQL recursive CTEs for traversal
3. Neo4j or similar for complex graph queries (Phase 3)

### Performance Considerations

- Tree visualization may need caching for sources with many descendants
- Root metrics can be expensive to calculate — cache and invalidate on new citations
- Consider materialized views for common queries

### API Endpoints (Preview)

```
GET /sources/{id}
GET /sources/{id}/tree
GET /sources/{id}/cites
GET /sources/{id}/cited-by
GET /factoids/{id}/sources
POST /sources
POST /source-citations
POST /factoid-sources
GET /sources/{id}/independence/{other_id}
POST /independence-assessments
```

---

## Summary

The source system transforms history from "what is claimed" to "who claims what, based on whom." By making citation structures visible and independence explicit, users can evaluate not just whether something is "supported by sources" but whether that support is robust or fragile.

The canopy may look rich. The roots may tell a different story.
