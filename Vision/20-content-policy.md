# Content Policy

## Overview

This document defines what content the platform hosts, what it doesn't, and why. The core principle: **the platform's structure IS the content policy**. We don't editorialize, hide, or sanitize history. We show sources, evidence, and structure — and trust users to think for themselves.

---

## Core Philosophy

### History Will Outlive Our Ideals

The platform is being built for decades or centuries, not for what passes as acceptable in 2025. The sensibilities of this moment are temporary. What's offensive today wasn't 50 years ago and won't be in 50 years. Different cultures find different things harmful right now.

If we build around current sensibilities, we create something that:
- Looks dated within a generation
- Participates in whatever erasures are fashionable now
- Requires constant re-litigation as norms shift
- Becomes a tool of whoever controls "acceptable" at any moment

The only durable approach: **sources, evidence, structure, transparency**. Let each generation, each culture, each user interpret through their own lens.

### Facts Are Not Evil

Facts are not evil in themselves — it's what people create from them. Our job is to make history a rich tapestry that enables understanding, not a sanitized narrative that enables misunderstanding.

Hiding history doesn't make it unhappen. It just makes people ignorant of it — and ignorance breeds the very misunderstandings we might claim to be preventing.

### The Structure Is the Policy

By requiring everything to trace to sources, by showing confidence based on evidence, by classifying bias and author stake, by making the full citation tree visible — we create an environment where:

- Weak claims look weak (thin source trees, low confidence)
- Strong claims look strong (independent corroboration, high confidence)
- Propaganda is labeled propaganda (genre classification visible)
- Bias is visible (author stake, cultural context documented)
- Users see the full picture and decide for themselves

We don't need to decide what's true or acceptable. We show the structure and trust people to think.

---

## What We Host

### Everything Historical — Unaltered

```yaml
we_host:
  controversial_interpretations:
    description: "Alternative views on historical events"
    examples:
      - "Alternative chronologies"
      - "Disputed causation theories"
      - "Minority scholarly positions"
    handling: "Source and confidence reflect evidence base"
    
  uncomfortable_history:
    description: "History that disturbs modern sensibilities"
    examples:
      - "Colonialism documented from all perspectives"
      - "Historical atrocities in full detail"
      - "Beliefs and practices now considered abhorrent"
    handling: "Documented as it happened, not rewritten for today"
    
  propaganda_sources:
    description: "Historical propaganda, including vile propaganda"
    examples:
      - "Nazi documents"
      - "Soviet propaganda"
      - "Colonial justification literature"
      - "Religious persecution materials"
    handling: "Genre: propaganda. Author stake: extreme. Fully visible classification."
    
  contested_narratives:
    description: "Topics where legitimate disagreement exists"
    examples:
      - "Disputed death tolls"
      - "Contested attributions"
      - "Alternative theories"
    handling: "Multiple sources visible, confidence reflects evidence, different frames can interpret dates differently, communities can hold different views"
    
  culturally_sensitive_content:
    description: "Content offensive to some cultures"
    examples:
      - "LGBTQ history (offensive in some regions)"
      - "Religious criticism (offensive to believers)"
      - "Anti-religious history (offensive to others)"
      - "Sexual history and practices"
    handling: "Not hidden for any audience. History is history."
    
  erased_histories:
    description: "History some would prefer forgotten"
    examples:
      - "Magnus Hirschfeld and early transgender research"
      - "Persecution of minorities by current powers"
      - "Uncomfortable national histories"
    handling: "Documented fully. The platform resists erasure."
    
  offensive_language:
    description: "Historical sources using language now considered offensive"
    examples:
      - "Racial terms in historical documents"
      - "Gendered language from past eras"
      - "Derogatory terminology in primary sources"
    handling: "Preserved as written. We don't bowdlerize sources."
```

### The Roald Dahl Principle

When publishers rewrite Roald Dahl to remove the word "fat," they're not protecting anyone — they're falsifying the historical record of what Dahl wrote.

This platform preserves what sources actually say. If a historical document uses language that offends modern readers, that's historically significant information. Sanitizing it serves no one.

---

## What We Don't Host

### Minimal Hard Limits

These limits exist not because of cultural sensitivity, but because of **platform integrity** or **operational harm to living people**:

```yaml
hard_limits:
  content_sexualizing_minors:
    description: "No sexual content involving children"
    rationale: "Universal. Not culturally relative. Not debatable."
    scope: "Historical framing does not exempt this"
    
  doxxing_living_people:
    description: "Personal information enabling targeting of living individuals"
    rationale: "This is operational harm, not historical documentation"
    examples_prohibited:
      - "Current home addresses"
      - "Family member details for harassment"
      - "Workplace information for targeting"
    examples_allowed:
      - "Historical figure X lived at address Y (deceased)"
      - "Public figure's publicly known information"
    test: "Is this documentation or targeting?"
    
  operational_harm_instructions:
    description: "How-to guides for causing harm, disguised as history"
    rationale: "Documenting that something happened ≠ providing instructions"
    examples_prohibited:
      - "Working chemical weapon synthesis"
      - "Detailed poison recipes"
      - "Bomb-making instructions"
    examples_allowed:
      - "Historical records describe Greek fire being used at siege"
      - "Alchemists attempted to synthesize poisons using mercury"
      - "The Manhattan Project developed nuclear weapons"
    test: "Is this historical documentation or a functional how-to guide?"
    
  fabricated_sources:
    description: "Fake documents presented as real historical sources"
    rationale: "Platform integrity depends on sources being real"
    note: "Biased sources, propaganda, wrong sources = fine. Fabricated sources = fraud."
    examples_prohibited:
      - "Forged historical documents"
      - "AI-generated fake primary sources"
      - "Hoax documents presented as authentic"
    examples_allowed:
      - "Known historical forgeries (documented AS forgeries)"
      - "Propaganda (real propaganda, classified as such)"
      - "Disputed documents (authenticity debate documented)"
    test: "Is this a real artifact, even if its contents are lies?"
    
  platform_misuse:
    description: "Using historical framing as pretext for non-historical purposes"
    rationale: "The platform exists for historical inquiry"
    examples_prohibited:
      - "Contemporary harassment campaigns with historical veneer"
      - "Coordinated disinformation operations"
      - "Commercial spam disguised as contributions"
    test: "Is this genuine historical inquiry or something else entirely?"
```

### Why These Limits

| Limit | Why It Exists |
|-------|--------------|
| CSAM | Universal harm. No historical framing justifies it. |
| Doxxing | Operational harm to living people. Not documentation. |
| Harm instructions | Functional weapon, not historical record. |
| Fabricated sources | Destroys platform integrity. Fraud, not perspective. |
| Platform misuse | Not historical inquiry. Pretextual abuse of tools. |

Note what these have in common: they're not about **what claims are acceptable**. They're about **platform integrity** and **operational harm to living people today**.

---

## What We Explicitly Don't Police

This list exists to be clear about what moderation will NOT act on:

```yaml
not_policed:
  offensive_content:
    description: "Content that offends people"
    policy: "Not grounds for removal"
    note: "Offense is subjective and culturally variable"
    
  controversial_views:
    description: "Perspectives many disagree with"
    policy: "Not grounds for removal"
    note: "Controversy is often where important inquiry happens"
    
  cultural_sensitivities:
    description: "Content sensitive in some cultures"
    policy: "Not grounds for removal or hiding"
    note: "We don't hide LGBTQ history for conservative regions, or religious history for secular regions, or secular history for religious regions"
    
  politically_sensitive:
    description: "Topics that are politically charged"
    policy: "Not grounds for removal"
    note: "Political sensitivity shifts constantly. We don't track it."
    
  currently_unfashionable:
    description: "Views out of favor in current discourse"
    policy: "Not grounds for removal"
    note: "Fashion changes. History remains."
    
  might_be_misused:
    description: "Content someone could theoretically misuse"
    policy: "Not grounds for removal"
    note: "Almost anything can be misused. We document history."
    
  mainstream_challenges:
    description: "Content challenging established narratives"
    policy: "Not grounds for removal"
    note: "This is explicitly part of our mission"
    
  weak_claims:
    description: "Claims with thin evidence"
    policy: "Not removed — shown with appropriate low confidence"
    note: "The structure reveals weakness. Users decide."
    
  wrong_claims:
    description: "Claims that appear to be factually wrong"
    policy: "Not removed — contradicting evidence shown alongside"
    note: "We show the evidence landscape, not decree truth"
```

---

## How Structure Handles Concerns

Instead of removal or editorializing, the platform structure surfaces information:

### Propaganda

```
FACTOID: "[Claim from Nazi propaganda document]"

SOURCE CLASSIFICATION:
├── Type: Primary
├── Genre: Propaganda
├── Author stake: Extreme (state propaganda apparatus)
├── Cultural context: Nazi Germany, 1938
└── Bias indicators: [explicit markers]

CONFIDENCE: 0.15
├── Single source
├── Propaganda genre penalty
├── Extreme author stake penalty
├── No independent corroboration
└── Contradicted by [12 other sources]

USER SEES: The claim, clearly labeled as propaganda, with 
low confidence, with contradicting evidence visible.
```

### Contested Death Tolls

```
FACTOID: "Death toll of [Event] was [Number]"

SOURCES:
├── Source A: Claims X (methodology: census comparison)
├── Source B: Claims Y (methodology: document analysis)
├── Source C: Claims Z (methodology: demographic modeling)
└── Source D: Claims W (methodology: disputed)

CONFIDENCE: 0.6 (contested)
├── Multiple sources disagree
├── Methodological independence: partial
└── Range: [lowest] to [highest]

USER SEES: The range of claims, the methodologies, the 
disagreements. They can evaluate the evidence themselves.
```

### Fringe Theory

```
FACTOID: "[Alternative chronology claim]"

SOURCE TREE:
├── 3 sources (all trace to single author)
├── Root count: 1
├── Independence: None
└── Mainstream contradictions: 47 sources

CORE DATA CONFIDENCE: 0.12
FRAME: Revised Chronology (places events 300 years earlier)
COMMUNITY: Alternative Chronology Research

USER SEES: The claim exists with its thin source tree visible.
In the Default frame it appears at mainstream dates. In the
Revised Chronology frame it appears at alternative dates.
The evidence basis is visible regardless of frame.
```

### Uncomfortable History

```
FACTOID: "[Historical atrocity documented in detail]"

SOURCES:
├── 8 primary sources (contemporary accounts)
├── 15 secondary sources (historical analysis)
├── Archaeological evidence
└── Multiple cultural perspectives

CONFIDENCE: 0.89

LAYER: Documented (strong evidence)

USER SEES: Full documentation of the atrocity, from multiple
perspectives, with high confidence. Not sanitized.
```

---

## Moderation Scope

### What Moderators Do

```yaml
moderator_responsibilities:
  verify_source_reality:
    description: "Confirm sources are real (not fabricated)"
    action: "Remove fabricated sources; flag suspicious ones for review"
    
  classify_appropriately:
    description: "Ensure genre, bias, author stake are accurately labeled"
    action: "Correct misclassifications"
    
  enforce_hard_limits:
    description: "Remove content violating hard limits"
    action: "Remove CSAM, doxxing, operational harm, platform misuse"
    
  maintain_structure_integrity:
    description: "Ensure the platform structure works as designed"
    action: "Correct gaming, fix broken links, maintain quality"
```

### What Moderators Don't Do

```yaml
moderators_do_not:
  judge_truth:
    description: "Decide which claims are true or false"
    instead: "Confidence scores and source trees show evidence"
    
  remove_offensive:
    description: "Remove content because it's offensive"
    instead: "Appropriate classification; users decide engagement"
    
  follow_current_sensibilities:
    description: "Adjust content to current cultural norms"
    instead: "Historical content preserved as-is"
    
  protect_narratives:
    description: "Shield mainstream narratives from challenge"
    instead: "All perspectives shown with their evidence"
    
  balance_viewpoints:
    description: "Artificially balance perspectives"
    instead: "Evidence strength speaks for itself"
```

---

## Edge Cases

### Historical Forgeries

**Example:** The Donation of Constantine (medieval forgery)

**Handling:** Hosted as a source, documented AS a forgery. The forgery itself is historically significant. Classification: "Known forgery, historically significant."

This is different from someone creating a fake document today and uploading it as genuine.

### Denial Claims

**Example:** Claims denying well-documented events

**Handling:** The claims can exist (documented that someone made them). The source tree will show:
- Origin of denial claims (often propaganda, often single source)
- Counter-evidence (often overwhelming, independent, multi-source)
- Confidence score reflecting this reality

We don't remove denial claims. We show their evidentiary basis (or lack thereof) compared to the counter-evidence. The structure reveals reality.

### Hate Speech in Historical Sources

**Example:** Historical document containing virulent racism

**Handling:** Preserved as written. The document is a historical artifact. Sanitizing it falsifies history. Classification shows bias, genre, context.

Someone studying the history of racism NEEDS access to racist documents. Hiding them doesn't make racism unhappen — it just makes studying it impossible.

### Sacred Texts

**Example:** Religious texts making supernatural claims

**Handling:** Hosted with appropriate layer (Traditional/Theological). Confidence reflects source basis. Treated as historical documents making claims, same as any other source.

Not elevated. Not debunked. Shown with their source basis like everything else.

### Currently Illegal Topics (Jurisdiction-Dependent)

**Example:** Content legal in some jurisdictions, illegal in others

**Handling:** Platform operates under its hosting jurisdiction's laws. We don't customize content visibility by user location (that would require surveillance and enable selective censorship).

Users in restrictive jurisdictions access the same content as everyone else. Their governments may block access; we don't do their filtering for them.

---

## Appeals Process

When content is removed under hard limits:

```yaml
appeals_process:
  notification:
    - Contributor notified of removal
    - Specific policy cited
    - Evidence/reasoning provided
    
  appeal:
    - Contributor can appeal
    - Different moderator reviews
    - Decision documented
    
  escalation:
    - If disputed, escalates to admin review
    - Final decision documented
    - Patterns inform policy refinement
    
  transparency:
    - Removal statistics published (aggregate)
    - Policy interpretations documented (anonymized)
    - Community can see how policies are applied
```

---

## Transparency

### What We Publish

```yaml
transparency_reports:
  removal_statistics:
    - Count by category (CSAM, doxxing, etc.)
    - NOT content details
    
  policy_interpretations:
    - Anonymized edge cases and decisions
    - How policies were applied
    
  appeals_outcomes:
    - Aggregate statistics
    - Policy refinements resulting from appeals
```

### What We Don't Do

```yaml
we_dont:
  publish_removed_content:
    reason: "Don't amplify actual harmful content"
    
  remove_silently:
    reason: "Contributors deserve to know and appeal"
    
  change_policy_secretly:
    reason: "Policy changes are public and documented"
```

---

## Evolution

### Policy Changes

```yaml
policy_evolution:
  process:
    - Proposed changes published for comment
    - Community input period
    - Decision documented with reasoning
    - Implementation announced
    
  principles:
    - Err toward less restriction, not more
    - Hard limits remain hard (CSAM, doxxing, etc.)
    - Cultural fashion doesn't drive policy
    - Platform integrity is paramount
```

### What Doesn't Change

```yaml
immutable:
  - CSAM prohibition
  - No editorializing of historical sources
  - Structure-as-policy principle
  - Transparency commitment
  - Resistance to cultural-moment censorship
```

---

## Summary

**We host history — all of it, unaltered.**

The platform's structure — source trees, confidence scores, bias classification, frames (where in time), lenses (what to see), and communities (who works together) — IS the content policy. We don't need to decide what's true or acceptable. We show the evidence and its structure. Users think for themselves.

**Hard limits exist for:**
- Platform integrity (no fabricated sources)
- Operational harm to living people (no doxxing, no harm instructions)
- Universal prohibitions (no CSAM)

**Everything else:**
- Controversial? Hosted.
- Offensive? Hosted.
- Unpopular? Hosted.
- Challenges mainstream? Hosted.
- Uncomfortable? Hosted.

History will outlive our current sensibilities. We build for that timescale.

---

## Open Questions

- **Jurisdiction:** Where will the platform be hosted? What legal constraints apply?

- **Government requests:** How do we handle government takedown demands?

- **Platform liability:** What legal structure protects against content liability?

- **Moderator selection:** How do we ensure moderators apply policy consistently without ideological bias?

---

## Dependencies

- **00-vision.md**: Core philosophy
- **08-bias-detection.md**: How bias is shown, not hidden
- **09-users-community.md**: Moderation roles
- **11-frames-namespaces.md**: How Frames, Lenses & Communities handle different perspectives without censorship
- **15-confidence-system.md**: Core Data confidence vs Placement confidence

