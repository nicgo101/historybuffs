# Users & Community

## Overview

The system is only as good as its contributors. This document defines user roles, contribution workflows, and community governance.

**Critical distinction**: We separate **Core Data** (what sources say) from **Frame Data** (how sources are interpreted). Core data has light verification. Frame data is governed by each frame's community. No central authority decides "truth."

---

## Core Principles

### 1. Core Data vs Frame Data

The system has two distinct layers:

**Core Data (Layer 1)** - What sources claim + hard anchors:
- Source exists and is correctly cited
- Source actually says what we claim it says
- Raw observations are faithfully transcribed
- Entities are extracted (but identification may vary by frame)
- **Hard anchors**: Calculated astronomical events (eclipses, comets) - mathematically verifiable
- **Strong scientific claims**: Dendrochronology (tree rings) - countable, cross-matched, near-anchor status for established sequences

**Frame Data (Layer 2)** - How sources are interpreted:
- Temporal placements (what dates?)
- Bias evaluations (how reliable?)
- Entity identifications (is this the same person?)
- Extensions and interpretations

Core data is verifiable. Frame data is perspective-dependent.

### 2. No Central Truth Authority

The system is **agnostic**. We don't decide:
- Which chronology is correct
- Which interpretation is true
- Which source is reliable
- What "really happened"

These are frame-level decisions, made by frame communities.

### 3. Frames Govern Themselves

Each frame (reference frame, namespace) can have:
- Its own verification standards
- Its own moderators
- Its own contribution guidelines
- Its own quality criteria

A university research frame might require peer review. A personal exploration frame might have no verification. Both are valid.

### 4. Protection Against Capture

No single group can control "the truth" because:
- Core data is just "source says X" (verifiable, not interpretive)
- Interpretations live in frames, not core
- Anyone can create frames with different interpretations
- Multiple frames can coexist without conflict

Wikipedia-style edit wars become frame divergence instead.

### 5. Diverse Perspectives Welcome

Alternative researchers, mainstream academics, genealogists, enthusiasts — all contribute. Different interpretations exist in different frames, not in conflict over a single "correct" version.

---

## User Stories

### New User
- As a new user, I want to explore data freely, so I can learn the system.
- As a new user, I want clear guidance on how to contribute, so I can start helping.
- As a new user, I want to see my first contributions reviewed quickly, so I stay engaged.

### Contributor
- As a contributor, I want to add factoids and sources, so the knowledge base grows.
- As a contributor, I want feedback on my contributions, so I improve.
- As a contributor, I want to see my impact, so I stay motivated.

### Verifier
- As a verifier, I want a queue of items to review, so I can help with quality.
- As a verifier, I want clear criteria for approval, so decisions are consistent.
- As a verifier, I want to discuss edge cases, so difficult items get proper attention.

### Moderator
- As a moderator, I want to handle disputes efficiently, so the community stays healthy.
- As a moderator, I want to identify problematic users, so I can address issues early.
- As a moderator, I want tools to manage namespaces, so communities can self-govern.

### Researcher
- As a researcher, I want to cite the data in my work, so it's academically useful.
- As a researcher, I want to see contribution provenance, so I can evaluate reliability.
- As a researcher, I want API access, so I can build on the data.

---

## User Roles

Roles exist at two levels: **System-level** (core data) and **Frame-level** (frame data).

### System Roles (Core Data)

```
┌─────────────────────────────────────────────────────────────────┐
│                       SYSTEM ADMIN                              │
│           (Platform operations, ToS enforcement)                │
├─────────────────────────────────────────────────────────────────┤
│                    CORE CONTRIBUTOR                             │
│        (Can add/verify core data - source claims)               │
├─────────────────────────────────────────────────────────────────┤
│                          USER                                   │
│            (Browse, create personal frames)                     │
└─────────────────────────────────────────────────────────────────┘
```

**Note**: System roles are minimal. Most "power" lives at frame level.

### Frame Roles (Per-Frame)

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRAME OWNER                                │
│         (Full control over frame governance)                    │
├─────────────────────────────────────────────────────────────────┤
│                    FRAME MODERATOR                              │
│        (Manage frame content, verify contributions)             │
├─────────────────────────────────────────────────────────────────┤
│                   TRUSTED MEMBER                                │
│       (Contribute with reduced verification)                    │
├─────────────────────────────────────────────────────────────────┤
│                       MEMBER                                    │
│         (Contribute, subject to frame rules)                    │
├─────────────────────────────────────────────────────────────────┤
│                       VIEWER                                    │
│              (Read-only access to frame)                        │
└─────────────────────────────────────────────────────────────────┘
```

### Role Definitions

#### User (System Default)
```yaml
system_permissions:
  - Browse all public core data
  - Search and filter
  - View source citations
  - Export data (with attribution)
  - Create personal frames
  - Join public frames
  - Add core data (goes to verification queue)

frame_permissions:
  - Depends on frame membership
  - Personal frame: full control
  - Other frames: as granted by frame

restrictions:
  - Core contributions need verification
  - Cannot verify others' core submissions (until trusted)
```

#### Core Contributor (System)
```yaml
system_permissions:
  - All User permissions
  - Verify core data submissions
  - Higher API limits

earned_by:
  - 10+ approved core contributions
  - OR trusted member in any established frame

note: >
  This is NOT about expertise or authority.
  Core verification is checking "does source say this?"
  Anyone who has demonstrated basic competence can do it.
```

#### System Admin
```yaml
system_permissions:
  - Platform operations
  - ToS enforcement
  - Account suspension for abuse
  - System configuration

explicitly_cannot:
  - Override frame governance decisions
  - Dictate frame interpretations
  - Remove content based on interpretation disputes

note: >
  Admins handle platform health, not "truth."
  They enforce ToS and handle abuse.
  They do NOT decide which chronology is correct.
```

#### Frame Owner
```yaml
frame_permissions:
  - Set frame governance model
  - Appoint moderators
  - Define verification requirements
  - Set membership rules
  - Delete frame

responsibilities:
  - Frame health and direction
  - Governance transparency
```

#### Frame Moderator
```yaml
frame_permissions:
  - Verify frame contributions
  - Manage frame membership
  - Handle frame disputes
  - Edit/revert frame data

appointed_by: Frame owner
removable_by: Frame owner
```

#### Frame Member
```yaml
frame_permissions:
  - Add placements, extensions, bias evaluations
  - Participate in frame discussions
  - Subject to frame's verification rules

can_always:
  - Leave frame
  - Fork frame to create own version
```

---

## Contribution Workflows

### Two-Layer Contribution Model

Contributions happen at two different levels with different verification:

```
┌─────────────────────────────────────────────────────────────────┐
│                     CORE DATA CONTRIBUTION                      │
│                     (What sources say)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Verifiable questions:                                          │
│  • Does this source exist?                                      │
│  • Does it say what we claim?                                   │
│  • Is the citation accurate?                                    │
│  • Is the raw observation faithfully captured?                  │
│                                                                 │
│  Light verification → Publish to Core                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRAME DATA CONTRIBUTION                      │
│                    (How sources are interpreted)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frame-dependent questions:                                     │
│  • What dates should this factoid have? (placements)           │
│  • How reliable is this source? (bias evaluation)              │
│  • Is Actor X the same as Actor Y? (entity identification)     │
│  • What does this evidence mean? (extensions)                  │
│                                                                 │
│  Frame's own verification → Publish to Frame                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Core Data Flow

Core data verification is lightweight - just checking source accuracy:

```
┌─────────────────┐
│  USER ADDS      │
│  factoid from   │
│  source         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  VERIFICATION   │
│  QUESTIONS:     │
│                 │
│  □ Source cited │
│    correctly?   │
│  □ Quote/claim  │
│    accurate?    │
│  □ Raw obs.     │
│    faithful?    │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────────┐
│  YES  │ │    NO     │
│       │ │           │
└───┬───┘ └─────┬─────┘
    │           │
    ▼           ▼
┌───────┐ ┌───────────┐
│PUBLISH│ │ RETURN    │
│TO CORE│ │ for fixes │
└───────┘ └───────────┘
```

**What core verification does NOT ask:**
- Is this source reliable? (frame decision)
- Is this claim true? (not our job)
- What date should this be? (frame decision)

### Frame Data Flow

Frame contributions follow that frame's own rules:

```
┌─────────────────┐
│  USER ADDS      │
│  placement/     │
│  extension/     │
│  interpretation │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         FRAME'S VERIFICATION            │
│                                         │
│  Examples:                              │
│                                         │
│  Academic Frame:                        │
│  └── Peer review required               │
│                                         │
│  Research Group Frame:                  │
│  └── Group moderator approval           │
│                                         │
│  Personal Frame:                        │
│  └── No verification (your frame)       │
│                                         │
│  Alternative Chronology Frame:          │
│  └── Community standards                │
│                                         │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ PUBLISH TO      │
│ FRAME           │
└─────────────────┘
```

### Extraction Flow (AI-Assisted)

For bulk extraction from books (see 07-extraction-pipeline.md):

```
┌─────────────────┐
│  AI EXTRACTS    │
│  from source    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  HUMAN REVIEW   │
│  (Core data     │
│   accuracy)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PUBLISH TO     │
│  CORE           │
│  (raw factoids) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  FRAME ADOPTS   │
│  & interprets   │
│  (placements,   │
│   etc.)         │
└─────────────────┘
```

---

## Verification Process

### Core Data Verification (System-Wide)

Core data verification is **narrow and verifiable**. We're not judging truth - just source accuracy.

```yaml
core_verification_checklist:
  source_exists:
    - Source is correctly identified
    - Citation is accurate (book, chapter, page)
    - Source is accessible or existence is documented

  claim_accuracy:
    - The source actually says what we claim
    - Quote or paraphrase is faithful to original
    - Raw observation text matches source

  extraction_quality:
    - Factoid type is reasonable
    - Entities mentioned are captured
    - Structural reference is correct

  hard_anchor_verification:
    - Astronomical: Calculation method documented, reproducible
    # Mathematically verifiable, frame-independent

  strong_scientific_claims:
    - Dendrochronology: Sequence source documented, cross-matching verified
    # Tree rings are countable (1 ring = 1 year), near-anchor status
    # Established sequences are highly reliable
    # Ancient master chain linkages can still be debated by frames

  scientific_claims_as_sources:
    # These are treated as source claims - cite the study/lab:
    # - Ice cores: "Study X reports sulfate spike at layer Y"
    # - Radiocarbon: "Lab X reports C14 date Y ± Z"
    # Methodology has assumptions; frames decide weight to give them

  NOT_VERIFIED_AT_CORE_LEVEL:
    - Whether the source is reliable (→ frame decision)
    - What dates this should have (→ frame placement)
    - Whether the claim is historically true (→ not our job)
    - Entity identifications across sources (→ frame decision)
```

### Frame-Level Verification (Frame-Specific)

Each frame defines its own verification standards:

```yaml
# Example: Academic Research Frame
academic_frame_verification:
  requirements:
    - Peer review by frame members
    - Scholarly citation standards
    - Methodology documentation
  who_can_verify:
    - Frame moderators
    - Designated reviewers
  verification_level: strict

# Example: Alternative Chronology Frame
alt_chrono_frame_verification:
  requirements:
    - Internal consistency with frame's model
    - Evidence-based reasoning documented
    - Community review
  who_can_verify:
    - Any trusted frame member
  verification_level: community

# Example: Personal Exploration Frame
personal_frame_verification:
  requirements: none
  who_can_verify: owner_only
  verification_level: none
```

### Verification Actions

**For Core Data:**
```
APPROVE
├── Source citation verified
├── Claim accurately represents source
└── Publish to core database

RETURN FOR FIXES
├── Citation error
├── Misquote or inaccuracy
└── Returns to contributor

REJECT
├── Source doesn't exist
├── Source doesn't say this
├── Vandalism
└── Logged with reason
```

**For Frame Data:**
```
(Defined by each frame)

Examples:
- Academic: Approve / Revise / Reject with peer comments
- Community: Upvote / Downvote / Flag
- Personal: No verification needed
```

### Who Can Verify Core Data

Core verification is not about expertise in the subject matter - it's about checking sources:

```python
def can_verify_core_data(user, submission):
    """
    Core verification requirements are minimal.
    We're checking source accuracy, not subject expertise.
    """
    # Basic requirements
    if user.id == submission.author_id:
        return False  # Can't verify own work

    if user.is_suspended:
        return False

    # Light trust requirement
    if user.core_contributions_approved >= 5:
        return True

    # Or frame-based trust
    if user.is_trusted_in_any_frame():
        return True

    return False
```

---

## Reputation System

### Reputation Components

```python
class UserReputation:
    # Core metrics
    contributions_approved: int
    contributions_rejected: int
    verifications_completed: int
    verification_accuracy: float  # How often your verifications align with others
    
    # Quality metrics  
    contributions_challenged: int  # How often your approved work was later disputed
    contributions_cited: int  # How often your work is referenced
    
    # Community metrics
    helpful_votes: int
    discussion_quality: float
    
    @property
    def reputation_score(self):
        """
        Composite reputation score.
        """
        approval_rate = self.contributions_approved / max(1, self.total_contributions)
        
        score = 0
        score += self.contributions_approved * 10
        score -= self.contributions_rejected * 5
        score += self.verifications_completed * 2
        score += self.verification_accuracy * 100
        score -= self.contributions_challenged * 20
        score += self.contributions_cited * 15
        score += self.helpful_votes * 1
        
        return max(0, score)
    
    @property
    def trust_level(self):
        """
        Trust level based on reputation.
        """
        if self.reputation_score < 50:
            return 'new'
        elif self.reputation_score < 200:
            return 'established'
        elif self.reputation_score < 500:
            return 'trusted'
        else:
            return 'highly_trusted'
```

### Reputation Display

```
┌─────────────────────────────────────────────────────────────────┐
│ USER: HistoryBuff42                                            │
├─────────────────────────────────────────────────────────────────┤
│ REPUTATION: 347 points                                         │
│ LEVEL: Trusted                                                  │
│                                                                 │
│ CONTRIBUTIONS                                                   │
│ ├── Factoids added: 89 (85 approved, 4 rejected)              │
│ ├── Sources added: 23                                          │
│ ├── Connections made: 156                                      │
│ └── Approval rate: 95.5%                                       │
│                                                                 │
│ VERIFICATION                                                    │
│ ├── Items verified: 234                                        │
│ ├── Accuracy: 94.2%                                            │
│ └── Avg. time: 4.2 minutes                                     │
│                                                                 │
│ SPECIALTIES                                                     │
│ ├── Roman History (67 contributions)                           │
│ ├── Chronology (45 contributions)                              │
│ └── Primary Sources (31 contributions)                         │
│                                                                 │
│ ACHIEVEMENTS                                                    │
│ ├── 🏆 Sourcerer (Gold)                                        │
│ ├── 🎯 Pattern Seer                                            │
│ └── 📚 Deep Root Finder                                        │
│                                                                 │
│ MEMBER SINCE: March 2024                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frame Governance

### Frame Types and Governance

Frames have different governance models based on their purpose:

```yaml
# System frames (maintained by platform)
system_frame:
  examples:
    - "Mainstream Academic Consensus"
  governance: platform_maintained
  who_controls: system_admins
  verification: curated
  can_fork: yes  # Users can fork and modify

# ANCHOR HIERARCHY:
#
# HARD ANCHORS (frame-independent):
#   - Astronomical calculations (eclipses, comets) - mathematically verifiable
#
# STRONG SCIENTIFIC CLAIMS (near-anchor):
#   - Dendrochronology - countable rings, cross-matched sequences
#   - Established sequences are highly reliable
#   - Ancient master chain linkages can be debated by frames
#
# SCIENTIFIC CLAIMS (cite the source):
#   - Ice cores, radiocarbon - methodology has assumptions
#   - Treated as "Lab X reports Y" - frames decide weight
#
# See 04-chronology-system.md and 06-environmental-layer.md for details.

# Community frames (shared by groups)
community_frame:
  examples:
    - "Fomenko Chronology"
    - "Biblical Timeline Research"
    - "Roman History Researchers"
  governance: community
  who_controls: frame_moderators
  verification: frame_defined
  membership: open or approval_required

# Institutional frames (universities, research groups)
institutional_frame:
  examples:
    - "Oxford Ancient History Department"
    - "Chronology Research Institute"
  governance: institutional
  who_controls: designated_authorities
  verification: peer_review
  membership: institutional_affiliation

# Personal frames (individual users)
personal_frame:
  examples:
    - "My Research Workspace"
    - "Thesis Project"
  governance: owner
  who_controls: single_user
  verification: none
  membership: owner_only
```

### Frame Creation and Forking

Anyone can create frames. Frames can be forked:

```python
def create_frame(user, frame_type, base_frame=None):
    """
    Create a new frame, optionally forking from existing.
    """
    frame = Frame(
        owner_id=user.id,
        frame_type=frame_type,
        governance_model=default_governance(frame_type)
    )

    if base_frame:
        # Fork: copy placements, extensions, bias evaluations
        frame.forked_from = base_frame.id
        copy_frame_data(base_frame, frame)

    return frame

# Example: Fork mainstream and modify
my_frame = create_frame(user, 'personal', base_frame=MAINSTREAM_FRAME)
# Now I can modify placements, add extensions, change bias evaluations
# without affecting the original frame
```

### Frame Divergence Instead of Edit Wars

When users disagree on interpretations, they don't fight over a single "correct" version:

```
TRADITIONAL WIKI MODEL (problems):
┌────────────────────────────────────────────┐
│  User A: "Event X was in 500 BCE"          │
│  User B: "No, 450 BCE!" [reverts]          │
│  User A: "500 BCE!" [reverts back]         │
│  → Edit war, moderator picks winner        │
│  → Loser's view suppressed                 │
└────────────────────────────────────────────┘

FRAME MODEL (solution):
┌────────────────────────────────────────────┐
│  Core Data: "Source X claims Event Y"      │
│                                            │
│  Frame A (User A's):                       │
│  └── Placement: 500 BCE                    │
│                                            │
│  Frame B (User B's):                       │
│  └── Placement: 450 BCE                    │
│                                            │
│  Both views coexist. Users can compare.    │
│  No edit war. No suppression.              │
└────────────────────────────────────────────┘
```

---

## Dispute Resolution

### Dispute Types (Revised)

```
CORE DATA DISPUTE
├── "The source doesn't say what the factoid claims"
├── Resolution: Check source directly
├── This IS verifiable - someone is wrong
└── Appeal: Additional verifier review

INTERPRETATION DISPUTE
├── "This date/identification/evaluation is wrong"
├── Resolution: NOT A SYSTEM DISPUTE
├── Each user maintains their view in their frame
└── No appeal needed - both views can exist

FRAME GOVERNANCE DISPUTE
├── "Frame moderator is acting unfairly"
├── Resolution: Within frame community
├── Users can fork frame if unresolved
└── System only intervenes for ToS violations

MEMBERSHIP DISPUTE
├── "I was unfairly removed from frame"
├── Resolution: Frame's own process
├── Remedy: Create own frame, fork if desired
└── System doesn't force frame membership

VANDALISM/ABUSE
├── Core data vandalism, harassment, ToS violations
├── Resolution: System moderators
├── Consequences: Account actions
└── This is the ONLY centralized moderation
```

### Dispute Process

```
┌─────────────────┐
│  DISPUTE TYPE?  │
└────────┬────────┘
         │
    ┌────┴─────────────────────┐
    │                          │
    ▼                          ▼
┌──────────┐           ┌──────────────┐
│CORE DATA │           │INTERPRETATION│
│DISPUTE   │           │DISPUTE       │
└────┬─────┘           └──────┬───────┘
     │                        │
     ▼                        ▼
┌──────────┐           ┌──────────────┐
│CHECK     │           │NOT A DISPUTE │
│SOURCE    │           │Both views    │
│DIRECTLY  │           │exist in      │
└────┬─────┘           │different     │
     │                 │frames        │
     ▼                 └──────────────┘
┌──────────┐
│VERIFIABLE│
│RESOLUTION│
└──────────┘
```

---

## Community Spaces

### Discussion Forums

```yaml
forum_structure:
  general:
    - Announcements
    - Introductions
    - Help & Support
    - Feature Requests
    
  research:
    - Source Discussions
    - Methodology
    - Chronology Debates
    - Geographic Questions
    
  namespaces:
    - Each namespace has its own discussion area
    - Moderated by namespace owners
    
  meta:
    - Site Feedback
    - Bug Reports
    - Policy Discussions
```

### Namespace Communities

Each namespace can have:
- Discussion forum
- Shared reference frame
- Community guidelines
- Moderation team
- Member list
- Activity feed

```python
class Namespace:
    name: str
    description: str
    
    # Governance
    owner_id: UUID
    moderator_ids: list[UUID]
    
    # Settings
    is_public: bool
    requires_approval: bool  # For new members
    contribution_guidelines: str
    
    # Community
    member_count: int
    active_discussion_count: int
    
    # Content
    factoid_count: int
    default_frame_id: UUID  # Shared reference frame
```

---

## Protection Against Capture

The Wikipedia problem: organized groups can capture editorial control and push political narratives. We prevent this structurally.

### Why Wikipedia Fails (and We Don't)

```
WIKIPEDIA MODEL:
┌────────────────────────────────────────────────────────────────┐
│ Single "truth" that everyone edits                              │
│ ↓                                                               │
│ Organized groups coordinate edits                               │
│ ↓                                                               │
│ Edit wars resolved by moderators                                │
│ ↓                                                               │
│ Moderators become political                                     │
│ ↓                                                               │
│ Dissenting views suppressed                                     │
│ ↓                                                               │
│ Platform becomes propaganda tool                                │
└────────────────────────────────────────────────────────────────┘

OUR MODEL:
┌────────────────────────────────────────────────────────────────┐
│ Core Data: "Source X says Y" (verifiable, non-interpretive)    │
│ ↓                                                               │
│ Frame A interprets data one way                                 │
│ Frame B interprets data differently                             │
│ Frame C has yet another interpretation                          │
│ ↓                                                               │
│ No edit wars - both interpretations coexist                    │
│ ↓                                                               │
│ Users choose which frame(s) to view                            │
│ ↓                                                               │
│ No single "truth" to capture                                   │
└────────────────────────────────────────────────────────────────┘
```

### Structural Protections

**1. Core data is non-interpretive**
```
Core data cannot be politically captured because it doesn't
make truth claims:

CAPTURABLE (Wikipedia):
  "The moon landing happened on July 20, 1969"
  → Can be edited, disputed, requires moderator ruling

NOT CAPTURABLE (Ours):
  "NASA claims the moon landing was July 20, 1969"
  "Source: NASA press release #69-83"
  → Verifiable. Source either says this or doesn't.
```

**2. Interpretations live in frames, not core**
```
If activists want to push "The moon landing was faked":
- They CANNOT modify core data (it just says what sources claim)
- They CAN create their own frame with their interpretations
- Mainstream frame continues to exist unchanged
- Users see both, can compare, make own judgment
```

**3. Anyone can fork**
```
If a frame is captured by activists:
- Any member can fork the frame
- Take all the placements/interpretations with them
- Start fresh community without the activists
- Original frame's capture becomes irrelevant
```

**4. No single moderator class**
```
Wikipedia: Global moderators decide disputes
Ours: Frame moderators only control their frame
- System admins handle abuse, not interpretation
- Unhappy with frame moderation? Fork and leave.
```

### What We Do Moderate (System Level)

System-level moderation is limited to:

```yaml
moderated_at_system_level:
  - ToS violations (harassment, illegal content)
  - Vandalism of core data (falsifying source claims)
  - Spam and bot abuse
  - Account abuse (sockpuppets for gaming)

NOT_moderated_at_system_level:
  - "Wrong" interpretations
  - Unpopular theories
  - Minority viewpoints
  - Politically incorrect positions
  - "Fringe" chronologies
```

### The Fork Option

The ultimate protection: anyone can fork.

```python
# User unhappy with "Mainstream Academic" frame?
my_frame = fork_frame(
    source_frame="Mainstream Academic",
    new_name="My Research Frame"
)

# Now they have their own copy of all:
# - Placements
# - Extensions
# - Bias evaluations
# - Entity identifications

# They can modify freely without affecting original
# Original frame cannot stop them
```

This makes capture pointless - you can capture a frame, but people just fork and leave.

---

## Anti-Gaming Measures

### Sockpuppet Detection

```python
def detect_sockpuppets():
    """
    Identify potential fake accounts.
    For core data verification gaming.
    """
    signals = []

    # Same IP addresses
    ip_clusters = find_ip_clusters()

    # Similar behavior patterns
    behavior_clusters = find_behavior_clusters()

    # Cross-verification (users verifying each other exclusively)
    verification_rings = find_verification_rings()

    # New accounts approving each other
    new_account_collusion = find_new_account_patterns()

    return merge_signals(signals)
```

### Core Data Gaming

```python
def detect_core_data_gaming():
    """
    Identify attempts to pollute core data.
    """
    # Falsified source claims
    spot_check_citations(random_sample=True)

    # Systematic misquoting
    compare_to_original_sources(flagged_users)

    # Coordinated false sourcing
    detect_coordinated_patterns()
```

Note: Gaming at frame level is that frame's problem. System only worries about core data integrity.

---

## Features

### MVP (Phase 1)

**Basic user accounts**
- Registration and login (via Supabase Auth)
- Viewer and Contributor roles
- Simple profile page

**Basic contribution flow**
- Submit factoids to queue
- Admin verification (simplified)
- Publish approved items

**Simple reputation**
- Count of approved contributions
- Basic quality metrics

### Phase 2

**Full role system**
- All roles implemented
- Promotion paths
- Trust levels

**Verification workflow**
- Verification queue
- Multiple verifier support
- Assignment and timeouts

**Reputation system**
- Full reputation calculation
- Trust levels
- Specialization tracking

**Community features**
- Discussion forums
- User profiles
- Activity feeds

### Phase 3 (Dream)

**Advanced anti-gaming**
- ML-based sockpuppet detection
- Behavior analysis
- Automated flagging

**Community governance**
- Election of moderators
- Policy voting
- Transparent decision logs

**API and integration**
- Public API with auth
- Rate limiting by trust level
- Bulk import/export

---

## Data Model

### users table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE,  -- Supabase auth
    
    -- Profile
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    
    -- Role and status
    role VARCHAR(30) DEFAULT 'viewer',
    -- viewer, contributor, trusted_contributor, verified_researcher, moderator, admin
    
    trust_level VARCHAR(20) DEFAULT 'new',
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT,
    suspension_until TIMESTAMPTZ,
    
    -- Reputation (cached)
    reputation_score DECIMAL(10,2) DEFAULT 0,
    contributions_approved INTEGER DEFAULT 0,
    contributions_rejected INTEGER DEFAULT 0,
    verifications_completed INTEGER DEFAULT 0,
    verification_accuracy DECIMAL(3,2),
    
    -- Preferences
    default_frame_id UUID REFERENCES reference_frames(id),
    notification_preferences JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);
```

### user_actions table (audit log)

```sql
CREATE TABLE user_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID NOT NULL REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    -- create_factoid, verify_submission, approve, reject, flag, edit, delete, etc.
    
    target_type VARCHAR(30),
    target_id UUID,
    
    details JSONB,
    ip_address INET,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_actions_user ON user_actions(user_id);
CREATE INDEX idx_user_actions_time ON user_actions(created_at DESC);
```

---

## Open Questions

- **Verification requirements**: Should high-value sources always require expert verification regardless of contributor level?

- **Namespace autonomy**: How much can namespace moderators override system-wide policies?

- **Anonymous contributions**: Allow anonymous viewing? Anonymous contributions?

- **Academic credit**: How to properly attribute contributions for academic citation?

- **Paid tiers**: Should there be paid tiers? What privileges?

---

## Dependencies

- **01-core-concepts.md**: Frame and Lens concepts
- **02-data-model.md**: User schema, frame tables
- **04-chronology-system.md**: Placements, hard anchors
- **06-environmental-layer.md**: Hard anchor data (astronomical, etc.)
- **08-bias-detection.md**: Frame-dependent bias evaluations
- **10-gamification.md**: Achievement system
- **11-frames-namespaces.md**: Frame and namespace governance details

---

## Summary

The community system is built on structural protection rather than centralized authority:

1. **Core data is non-interpretive**: Just "source says X" - verifiable, not political
2. **Anchor hierarchy**:
   - Hard anchors: Astronomical (eclipses, comets) - mathematically verifiable
   - Strong claims: Dendrochronology - countable rings, near-anchor for established sequences
   - Scientific claims: Ice cores, radiocarbon - cite the source, frames decide weight
3. **Interpretations live in frames**: Each frame governs itself
4. **Anyone can fork**: Capture becomes pointless when exit is free
5. **System moderation is narrow**: ToS and abuse only, not "truth"

This prevents Wikipedia-style capture while enabling diverse research communities to coexist. The data is only as good as the sources it represents - not as good as any single group's interpretation of it.
