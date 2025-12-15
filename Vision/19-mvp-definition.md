# MVP Definition

## Overview

This document defines the **Minimum Viable Product** — what must exist to prove the concept, attract early users, and validate the value proposition. Everything else waits.

**MVP Philosophy**: Build the smallest thing that demonstrates the core value proposition. Learn from real users. Iterate.

---

## Core Value Proposition

**"See the structure of historical knowledge — where it comes from, how confident we can be, and where it fails."**

The MVP must demonstrate:
1. Claims traced to sources (source trees visible)
2. Confidence that means something (not just vote counts)
3. Multi-frame chronology working (default frame + one alternative)
4. Pattern emergence (connections revealing structure)

If these four things work, we've proven the concept.

**MVP Framing**: MVP uses a simplified two-frame model (Default/Alternative) as proof of concept. Full multi-frame with anchor hierarchy comes in Phase 2.

---

## MVP Scope

### Included in MVP

```yaml
core_data:
  factoids:
    - Create, edit, view factoids
    - Dual dating (mainstream + evidence)
    - Link to sources
    - Basic confidence display
    
  sources:
    - Create, edit, view sources
    - Type classification (primary/secondary/tertiary)
    - Citation linking (A cites B)
    - Basic author info
    
  connections:
    - Link factoids to each other
    - Link factoids to sources
    - Basic relationship types
    
  actors:
    - Basic person/institution records
    - Link to factoids as participants
    
  locations:
    - Basic location records
    - Link to factoids

visualization:
  timeline:
    - Simple horizontal timeline
    - Plot factoids by date
    - Click for details
    - Zoom/pan
    - Toggle mainstream/evidence dates
    
  source_tree:
    - Visualize citation tree for a factoid
    - Show depth to root
    - Basic metrics (root count, concentration)

search:
  - Full-text search on factoids
  - Filter by date range
  - Filter by source type
  - Basic results display

user_system:
  - Registration/login (email)
  - User profile
  - Contribution tracking
  - Basic roles (viewer, contributor, admin)

contribution:
  - Submit factoids (goes to queue)
  - Admin approval workflow
  - Basic contribution history
```

### Explicitly NOT in MVP

```yaml
deferred_to_phase_2:
  - AI extraction pipeline
  - Semantic search
  - Custom reference frames (full multi-frame with anchor hierarchy)
  - Communities (beyond default)
  - Lenses (curated views)
  - Presentation mode
  - Image generation
  - API (external access)
  - Gamification/achievements
  - Community challenges
  - Environmental data layer
  - Family trees
  - Map visualization
  - Advanced confidence scoring (placement confidence, anchor chains)
  - Independence verification
  - Batch operations
  - Mobile optimization
  - OAuth login

rationale: |
  Each deferred feature is valuable but not essential to prove 
  the core value proposition. We can add them once we validate 
  that users want what we're building.
```

---

## MVP Features Detail

### Factoid Management

```yaml
create_factoid:
  fields:
    # Core Data (frame-independent)
    - description: text (required)
    - layer: select (documented/attested/traditional)

    # Placements (frame-dependent) - MVP has two frames: Default + Alternative
    - default_date_start: date (optional)
    - default_date_end: date (optional)
    - alternative_date_start: date (optional)
    - alternative_date_end: date (optional)
    - date_precision: select (exact/year/decade/century)
    
  workflow:
    - User fills form
    - Submits to pending queue
    - Admin reviews
    - Approve → published, Reject → notified

view_factoid:
  displays:
    - Description (Core Data)
    - Dates by frame (toggle between Default/Alternative)
    - Linked sources (list)
    - Confidence score (simple)
    - Source tree link
    - Connected factoids
    - Contributor attribution

edit_factoid:
  permissions: "Creator or admin"
  creates: "Edit history (audit trail)"
```

### Source Management

```yaml
create_source:
  fields:
    - title: text (required)
    - author: text or link to actor
    - source_type: select (primary/secondary/tertiary)
    - date_composed: date (optional)
    - notes: text
    
view_source:
  displays:
    - Title and author
    - Type badge
    - Date
    - Factoids that cite this source
    - Sources this source cites
    - Sources that cite this source

citation_linking:
  interface: "From source detail page, add citation to another source"
  fields:
    - cited_source: search/select
    - citation_type: select (direct_quote/reference/based_on)
    - notes: text
```

### Timeline View

```yaml
timeline_features:
  display:
    - Horizontal timeline
    - Events as dots/markers
    - Hover for preview
    - Click for detail panel
    
  interaction:
    - Zoom with scroll/pinch
    - Pan with drag
    - Date range selector
    
  filtering:
    - Date range
    - Search text
    - Source type filter
    
  frame_toggle:
    - Button to switch Default/Alternative frame
    - Visual indicator of current frame
    - Events shift when toggled (placements move)
    
  visual_design:
    - Clean, minimal
    - Clear date labels
    - Cluster dense areas
    - Responsive to screen size
```

### Source Tree Visualization

```yaml
source_tree_features:
  display:
    - Tree layout (top-down or radial)
    - Nodes = sources
    - Edges = citations
    - Color by source type
    
  metrics_shown:
    - Root count
    - Max depth
    - Concentration (% through single source)
    
  interaction:
    - Click node for source details
    - Expand/collapse branches
    - Zoom for large trees
```

### Search

```yaml
search_features:
  query:
    - Full-text search box
    - Search factoid descriptions
    - Search source titles
    
  filters:
    - Date range (start/end)
    - Source type
    - Layer (documented/attested/traditional)
    
  results:
    - List view
    - Snippet preview
    - Sort by date or relevance
    - Pagination
```

### User System

```yaml
registration:
  method: "Email + password"
  fields:
    - Email (required)
    - Username (required, unique)
    - Password (required)
  verification: "Email confirmation"

login:
  methods:
    - Email + password
    - "Forgot password" flow

profile:
  displays:
    - Username
    - Join date
    - Contribution count
    - Recent contributions
  editable:
    - Display name
    - Bio (short)
    
roles:
  viewer: "Can browse, cannot contribute"
  contributor: "Can submit to queue"
  admin: "Can approve, edit, delete"
```

### Admin Functions

```yaml
contribution_queue:
  displays:
    - Pending factoids
    - Submitter info
    - Submission date
    
  actions:
    - Approve (publishes)
    - Reject (with reason)
    - Edit before approve
    
user_management:
  - View all users
  - Change roles
  - Suspend users

data_management:
  - Edit any factoid
  - Delete factoids (soft delete)
  - Merge duplicates
```

---

## Technical MVP Scope

### Database (Supabase)

```yaml
tables_needed:
  - factoids
  - sources
  - source_citations
  - factoid_sources
  - actors
  - locations
  - connections
  - users
  - contributions (audit log)

indexes:
  - Full-text search on factoids
  - Date range queries
  - User lookups

rls_policies:
  - Public read for published content
  - Authenticated write
  - Admin override
```

### API

```yaml
endpoints_needed:
  # Factoids
  - GET /api/factoids
  - GET /api/factoids/:id
  - POST /api/factoids
  - PATCH /api/factoids/:id
  - GET /api/factoids/:id/sources
  
  # Sources
  - GET /api/sources
  - GET /api/sources/:id
  - POST /api/sources
  - GET /api/sources/:id/tree
  
  # Search
  - GET /api/search
  
  # Auth
  - POST /api/auth/register
  - POST /api/auth/login
  - GET /api/auth/me
  
  # Admin
  - GET /api/admin/queue
  - POST /api/admin/approve/:id
  - POST /api/admin/reject/:id
```

### Frontend Pages

```yaml
public_pages:
  - / (home/landing)
  - /explore (browse factoids)
  - /timeline (timeline view)
  - /factoid/:id (factoid detail)
  - /source/:id (source detail)
  - /search (search page)
  - /about
  
auth_pages:
  - /login
  - /register
  - /forgot-password
  
user_pages:
  - /profile (own profile)
  - /user/:username (public profile)
  - /contribute (contribution form)
  - /my-contributions
  
admin_pages:
  - /admin/queue
  - /admin/users
```

---

## Initial Data

### Seed Data Strategy

```yaml
approach: "Hand-curated initial dataset to demonstrate value"

content:
  - 100-200 factoids
  - 50-100 sources
  - Clear citation chains demonstrating source trees
  - Mix of time periods
  - Mix of confidence levels
  
focus_area: "Choose ONE area to go deep rather than broad"

suggestions:
  option_a:
    name: "Fall of Rome"
    period: "200-500 CE"
    appeal: "Familiar, lots of sources, clear narrative structure"
    
  option_b:
    name: "Bronze Age Collapse"
    period: "1200-1100 BCE"
    appeal: "Mystery, alternative theories welcome, less documented"
    
  option_c:
    name: "Local/Regional History"
    period: "Variable"
    appeal: "Differentiated, passionate community, available sources"

rationale: |
  Depth in one area > breadth across many.
  Shows what's possible when fully developed.
  Easier to demonstrate source trees and patterns.
```

### Example Seed: Bronze Age Collapse

```yaml
factoids:
  - "Multiple Mediterranean civilizations collapsed ~1200-1150 BCE"
  - "Hittite Empire fell ~1178 BCE"
  - "Ugarit destroyed ~1185 BCE"
  - "Egyptian records mention 'Sea Peoples' attacks"
  - "Mycenaean palatial centers destroyed or abandoned"
  # ... etc.

sources:
  - "Medinet Habu inscriptions (primary)"
  - "Ugarit tablets (primary)"
  - "Eric Cline, '1177 BC' (secondary)"
  - "Robert Drews, 'The End of the Bronze Age' (secondary)"
  # ... etc.

value_demonstration:
  - Source tree shows modern theories trace to limited primary evidence
  - Dating uncertainties visible (mainstream vs. evidence)
  - Multiple competing explanations coexist
  - Pattern: cluster of destruction events across region
```

---

## Success Criteria

### Launch Criteria (Can We Ship?)

```yaml
functional:
  - [ ] User can register and log in
  - [ ] User can browse factoids
  - [ ] User can view timeline
  - [ ] User can view source tree
  - [ ] User can search
  - [ ] User can submit contribution
  - [ ] Admin can approve/reject
  - [ ] Seed data is loaded
  
quality:
  - [ ] Page load < 3 seconds
  - [ ] No critical bugs
  - [ ] Mobile usable (not optimized, but functional)
  - [ ] Basic accessibility (keyboard nav, alt text)
  
content:
  - [ ] 100+ factoids
  - [ ] 50+ sources
  - [ ] Visible source trees
  - [ ] Demonstrated dual dating
```

### Validation Criteria (Did We Prove It?)

```yaml
week_1:
  - "100 users registered"
  - "50 users return day 2"
  - "Positive qualitative feedback"
  - "No critical bugs reported"

month_1:
  - "500 users registered"
  - "20% weekly active rate"
  - "First external contributions submitted"
  - "Press/social mention"

month_3:
  - "1000 users"
  - "100+ user-contributed factoids approved"
  - "10 power users identified"
  - "Clear signal on which features to prioritize"
```

---

## Development Timeline

### Estimated Schedule

```yaml
week_1_2:
  focus: "Database and auth"
  deliverables:
    - Database schema deployed
    - Supabase auth configured
    - Basic API structure
    
week_3_4:
  focus: "Core CRUD"
  deliverables:
    - Factoid management
    - Source management
    - Citation linking
    - Admin queue
    
week_5_6:
  focus: "Visualization"
  deliverables:
    - Timeline view
    - Source tree view
    - Search functionality
    
week_7_8:
  focus: "Polish and data"
  deliverables:
    - UI polish
    - Seed data loaded
    - Bug fixes
    - Documentation
    
week_9:
  focus: "Soft launch"
  deliverables:
    - Invite early users
    - Monitor and fix
    - Gather feedback
    
week_10:
  focus: "Public launch"
  deliverables:
    - Announce
    - Handle feedback
    - Plan Phase 2
```

### Milestones

```yaml
milestone_1: "Database and auth working"
milestone_2: "Can create and view factoids"
milestone_3: "Timeline visualization working"
milestone_4: "Source trees visible"
milestone_5: "Search functional"
milestone_6: "Seed data loaded"
milestone_7: "Soft launch"
milestone_8: "Public launch"
```

---

## Post-MVP Prioritization

### Phase 2 Candidates (Ordered by Expected Impact)

```yaml
high_priority:
  1_map_view:
    reason: "Users expect geographic visualization"
    complexity: "Medium"
    
  2_basic_api:
    reason: "Enable integrations, power users"
    complexity: "Low"
    
  3_semantic_search:
    reason: "Much better search experience"
    complexity: "Medium"
    
  4_custom_frames:
    reason: "Core differentiator"
    complexity: "Medium"

medium_priority:
  5_ai_extraction_basic:
    reason: "Scale content creation"
    complexity: "High"

  6_independence_verification:
    reason: "Core to confidence model"
    complexity: "Medium"

  7_achievements_basic:
    reason: "Engagement and retention"
    complexity: "Low"

  8_communities_and_lenses:
    reason: "Community organization and curated views"
    complexity: "Medium"

lower_priority:
  9_presentation_mode:
  10_image_generation:
  11_family_trees:
  12_environmental_data:
```

---

## Risks

### MVP-Specific Risks

```yaml
scope_creep:
  risk: "Adding features delays launch"
  mitigation: "Strict scope enforcement; everything goes to Phase 2 list"
  
empty_database:
  risk: "Users arrive to sparse content"
  mitigation: "Invest in quality seed data before launch"
  
poor_ux:
  risk: "Concept good but execution clunky"
  mitigation: "Usability testing with 5 users before launch"
  
no_users:
  risk: "Launch and nobody comes"
  mitigation: "Build community pre-launch; identify launch channels"
  
wrong_features:
  risk: "Built what we wanted, not what users want"
  mitigation: "Talk to potential users NOW; validate assumptions"
```

---

## Open Questions to Resolve Before Building

```yaml
must_resolve:
  - "What is the seed data topic? (Choose one)"
  - "Who are the first 10 users we'll invite for soft launch?"
  - "What's the launch marketing channel?"
  
should_resolve:
  - "Branding/name finalized?"
  - "Domain secured?"
  - "Design direction agreed?"
  
can_defer:
  - "Exact pricing tiers"
  - "Long-term roadmap details"
  - "Federation architecture"
```

---

## Dependencies

- **02-data-model.md**: Core Data vs Frame Data informs MVP schema design
- **04-chronology-system.md**: Frame toggle derives from chronology model
- **11-frames-namespaces.md**: MVP implements simplified two-frame version
- **15-confidence-system.md**: Basic confidence in MVP, full anchor hierarchy in Phase 2

---

## Summary

The MVP is about **proving the concept**, not building the full vision. We build:

- Factoids as Core Data with frame-dependent placements
- Sources with citation trees
- Timeline visualization with frame toggle (Default/Alternative)
- Source tree visualization with root metrics
- Basic search
- Simple contribution workflow

We deliberately exclude full multi-frame, lenses, communities, and anchor hierarchy until we've validated that users want this.

**Build small. Learn fast. Iterate.**

---

## Checklist

```
MVP READINESS CHECKLIST

Planning:
[ ] Seed data topic chosen
[ ] Initial users identified
[ ] Launch channel planned
[ ] Name and domain secured

Development:
[ ] Database schema implemented
[ ] Auth working
[ ] CRUD for factoids/sources
[ ] Timeline view
[ ] Source tree view
[ ] Search
[ ] Admin queue

Content:
[ ] 100+ factoids entered
[ ] 50+ sources linked
[ ] Citation trees populated
[ ] Quality reviewed

Polish:
[ ] Usability testing done
[ ] Critical bugs fixed
[ ] Performance acceptable
[ ] Mobile functional

Launch:
[ ] Soft launch to test users
[ ] Feedback incorporated
[ ] Public launch
[ ] Monitoring in place
```
