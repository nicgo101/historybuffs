# Source Reader

## Overview

The Source Reader is an interactive companion for exploring historical texts. As you read (physically or digitally), the app brings the content to life - showing events on maps, actors entering the narrative, timelines progressing, and connections forming.

**Core insight**: Reading history is linear, but history itself is spatial and networked. The Source Reader bridges this gap.

---

## The Vision

Imagine reading a WW2 history book:
- Physical book in hand (or e-reader)
- App open beside you
- As you turn to Chapter 5: "The Battle of Stalingrad"
- The map zooms to Stalingrad
- German and Soviet unit positions appear
- Key generals' profiles surface
- Timeline highlights August 1942 - February 1943
- Related images: Luftwaffe planes, T-34 tanks, the frozen Volga
- Connections to earlier chapters light up

The book becomes a portal to an interactive historical experience.

---

## Use Cases

### 1. Reading Companion
- Follow along with any extracted book
- Scrub to current page/chapter
- See entities mentioned on this page
- Map shows relevant locations
- Timeline highlights current period

### 2. Book Playback
- "Play" the book like a video
- Events unfold chronologically as mentioned
- Actors enter/exit the narrative
- Journey routes draw themselves
- Pause, rewind, speed up

### 3. Page Examination
- Deep dive into a specific page
- See all extracted entities
- View original text with highlights
- Compare claims to external sources
- Flag extraction errors

### 4. Cross-Reference Mode
- Reading Herodotus on the Persian Wars?
- Overlay archaeological findings
- Show what Thucydides says about same events
- Highlight contradictions and corroborations

### 5. Standalone App Potential
- Works with any extracted book
- History enthusiasts use while reading physical books
- Students use for textbook study
- Researchers use for source analysis

---

## Features

### Page Navigation

```
┌─────────────────────────────────────────────────────────────┐
│ SOURCE: "Histories" by Herodotus                            │
│ EXTRACTION SET: Herodotus Complete (523 factoids)           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [◀◀] [◀]  Book II, Chapter 47  [▶] [▶▶]                   │
│                                                             │
│  Page: [====|================] 47 / 312                     │
│                                                             │
│  [▶ Play]  Speed: [0.5x] [1x] [2x]  [⟳ Loop Chapter]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Split View

```
┌──────────────────────┬──────────────────────────────────────┐
│                      │                                      │
│   SOURCE TEXT        │         VISUALIZATION                │
│                      │                                      │
│   Original or        │   [Map] [Timeline] [Graph] [Gallery] │
│   translation        │                                      │
│                      │   ┌────────────────────────────────┐ │
│   Entities           │   │                                │ │
│   highlighted:       │   │     Interactive map with       │ │
│                      │   │     locations from this        │ │
│   [Cambyses II]      │   │     page highlighted           │ │
│   [Memphis]          │   │                                │ │
│   [525 BCE]          │   │     ◉ Memphis                  │ │
│                      │   │     ◉ Pelusium                 │ │
│   "Cambyses then     │   │                                │ │
│   marched on         │   │     --- Campaign route         │ │
│   Memphis..."        │   │                                │ │
│                      │   └────────────────────────────────┘ │
│                      │                                      │
├──────────────────────┴──────────────────────────────────────┤
│ ON THIS PAGE:                                               │
│ Events: [Siege of Memphis] [Death of Psamtik III]           │
│ Actors: [Cambyses II] [Psamtik III] [Persian Army]          │
│ Places: [Memphis] [Pelusium] [Nile Delta]                   │
│ Dates mentioned: "525 BCE" (Default frame) / "522 BCE" (Revised) │
└─────────────────────────────────────────────────────────────┘
```

### Playback Mode

When "Play" is activated:
- Pages advance automatically (configurable speed)
- New entities animate onto map/timeline as mentioned
- Actors "enter" with profile cards
- Journey routes draw progressively
- Sound effects optional (page turn, etc.)
- Pause on significant events (configurable)

```
PLAYBACK CONTROLS:
[▶ Play] [⏸ Pause] [⏹ Stop] [⏮ Start] [⏭ End]

Speed: [0.25x] [0.5x] [1x] [2x] [5x]

Options:
☑ Pause on major events
☑ Show actor introductions
☑ Animate journey routes
☐ Auto-advance chapters
☑ Highlight new entities
```

### Entity Tracking Panel

Shows entities currently "active" in the narrative:

```
ACTIVE IN NARRATIVE (Book II, Ch. 47)
──────────────────────────────────────
ACTORS (on stage):
  ◉ Cambyses II [Persian King] - entered Ch. 45
  ◉ Psamtik III [Egyptian Pharaoh] - entered Ch. 46
  ○ Croesus [Lydian King] - exited Ch. 44

LOCATIONS (in focus):
  ◉ Memphis - current
  ◉ Egypt - region
  ○ Sardis - mentioned earlier

TIMELINE POSITION:
  |--[525 BCE]--------------|
  Persian Conquest of Egypt

CONNECTIONS FORMING:
  → Cambyses II --conquers--> Egypt
  → Psamtik III --defeated_by--> Cambyses II
```

### Media Gallery

For extracted/linked media relevant to current page:

```
RELATED MEDIA (Book II, Ch. 47)
──────────────────────────────────────
[Image: Ruins of Memphis today]
[Image: Persian Immortals relief]
[Map: Cambyses' campaign route]
[Image: Psamtik III cartouche]

LINKED ARTIFACTS:
[Artifact: Statue of Psamtik III - British Museum]
[Artifact: Persian period stele - Cairo Museum]
```

### Annotation Tools

Users can add their own notes:

```
MY ANNOTATIONS (Book II, Ch. 47)
──────────────────────────────────────
📝 "Compare this to Manetho's account"
📍 Flagged: Date seems inconsistent with Ch. 32
🔗 Linked to: Archaeological report on Memphis siege layer
❓ Question: Did Cambyses really kill the Apis bull?
```

---

## Reading Sessions

Track reading progress and enable bookmarks:

```
READING SESSION: "Herodotus Deep Dive"
──────────────────────────────────────
Started: Dec 10, 2024
Current position: Book II, Chapter 47
Progress: 47/312 pages (15%)
Time spent: 4h 23m

Bookmarks:
  📖 Book I, Ch. 1 - "The Phoenician account"
  📖 Book II, Ch. 35 - "Egyptian customs reversed"

Notes: 12
Flags: 3
Questions: 5
```

---

## Integration with Core System

### Extraction Set Connection
- Source Reader displays data from extraction sets
- Each page maps to extracted factoids
- User corrections feed back to extraction quality

### Frame Support
- Toggle between reference frames while reading
- "Show Default frame dates" vs "Show Revised Chronology dates"
- Visualize how events shift between frames (placements move)
- Frame selector in navigation bar
- Visual indicator shows current frame
- Core Data (what the source says) remains constant across frames

### Lens Creation
- Reading session can become a lens
- "Everything I read in Chapters 1-10"
- Geographic/temporal bounds auto-set from content
- Share curated reading paths with communities

### Community Integration
- Share reading sessions with community members
- Collaborative annotation within communities
- Community-maintained extraction sets

### External Overlay
- While reading Herodotus, overlay:
  - Archaeological findings
  - Other ancient sources
  - Modern scholarly consensus
- See corroboration/contradiction in real-time

---

## Standalone App Potential

The Source Reader could work as an independent app:

**Target users:**
- History enthusiasts reading physical books
- Students studying historical texts
- Book clubs exploring history together
- Teachers preparing lessons

**Key features for standalone:**
- QR codes in compatible books link to extraction sets
- Manual page entry for any book
- Community-shared extraction sets
- Offline mode for reading without internet

**Monetization potential:**
- Free with limited extraction sets
- Premium for unlimited access
- Publisher partnerships for "enhanced editions"
- Educational institution licenses

---

## Technical Considerations

### Page-to-Content Mapping
- Extraction tracks structural references (Book, Chapter, Section, Paragraph)
- May need page number mapping for physical editions
- Different editions have different pagination

### Media Storage
- Images, maps, related artifacts
- CDN delivery for responsive loading
- User-uploaded vs. system-provided

### Offline Support
- Cache extraction set for offline reading
- Sync annotations when online
- Progressive web app capabilities

### Real-time Sync
- Multiple users reading together (book club mode)
- Shared annotations
- Live cursor showing where others are

---

## Open Questions

- **Edition mapping**: How to handle different editions/translations having different page numbers?

- **Physical book integration**: QR codes? ISBN lookup? Manual chapter selection?

- **Playback pacing**: How to determine "reading speed" for auto-play? Words per minute? Events per minute?

- **Media licensing**: How to handle images/media for historical content? Public domain focus?

- **Collaborative reading**: Real-time sync for book clubs? Shared annotations?

---

## MVP Scope

**Phase 1 (with MVP):**
- Basic page navigation for extraction sets
- Split view (text + map)
- Entity highlighting
- Simple playback

**Phase 2:**
- Full playback controls
- Reading sessions and bookmarks
- User annotations
- Media gallery

**Phase 3:**
- Standalone app
- Offline mode
- Collaborative features
- Publisher integrations

---

## Dependencies

- **03-source-system.md**: Extraction sets and source structure
- **07-extraction-pipeline.md**: How content gets extracted
- **05-geographic-system.md**: Map visualization
- **04-chronology-system.md**: Timeline visualization
- **11-frames-namespaces.md**: Frame toggle and lens creation
- **13-presentation-mode.md**: Playback visualization integration

---

## Summary

The Source Reader transforms passive reading into active exploration. By synchronizing a historical text with maps, timelines, and entity tracking, readers experience history spatially and temporally - not just linearly.

Whether used as an integrated feature or a standalone app, it makes historical texts accessible, engaging, and alive.

*Read the book. See the history unfold.*
