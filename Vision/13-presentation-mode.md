# Presentation Mode

## Overview

The data is valuable. But for many users — YouTubers, educators, documentary makers, writers — the value is in *presenting* that data compellingly. Presentation Mode provides tools to transform research into shareable visualizations, animations, and exports.

This creates a value exchange: creators get powerful tools; in return, they contribute deep research and bring attention to the platform.

### Relationship to Lenses and Frames

Presentation Mode builds on the **Lens** and **Frame** concepts:

```
LENS (What to show)          FRAME (Where in time)         PRESENTATION (How to show)
─────────────────            ─────────────────────         ──────────────────────────
Geographic scope     +       Anchor weights        →       Animated timeline
Temporal bounds              Epoch offset                  Map storytelling
Topic focus                  Placements                    Source tree reveal
Curated factoids                                          Video/interactive export
```

A presentation is essentially an **animated, exported lens** viewed through a specific **frame**:
- The lens defines WHAT factoids, actors, and events to include
- The frame determines WHERE those events sit chronologically
- The presentation tools determine HOW to visualize and export them

This means:
- Users can create a lens through research, then present it
- Changing the frame changes the dates shown in the presentation
- Frame comparison presentations show the same lens through different chronological interpretations

---

## Core Principles

### 1. Research-First, Presentation-Second
The tools work best when the underlying data is rich. This encourages creators to contribute research, not just extract visualizations.

### 2. Historically Grounded
Every visualization traces to sources. Generated images include context. The beauty serves accuracy, not the reverse.

### 3. Attribution Built In
Exports include attribution to sources and contributors. The community that built the data gets credit.

### 4. Accessible Complexity
Make sophisticated visualizations achievable without design expertise. Templates and automation for common patterns.

### 5. Multiple Export Formats
Video, interactive embeds, static images, slide decks — creators work in different media.

---

## User Stories

### YouTuber
- As a YouTuber, I want to create animated timelines, so my videos are visually engaging.
- As a YouTuber, I want to generate historically-accurate scene images, so I don't rely on generic stock footage.
- As a YouTuber, I want to export in video-friendly formats, so I can edit in my workflow.

### Educator
- As an educator, I want to create interactive timelines, so students can explore.
- As an educator, I want to build presentations quickly, so prep time is reduced.
- As an educator, I want to show source trees, so students learn critical thinking.

### Writer
- As a writer, I want to visualize character timelines, so I keep historical fiction accurate.
- As a writer, I want to see geographic context, so settings are authentic.
- As a writer, I want to export reference sheets, so I have quick access while writing.

### Documentary Maker
- As a documentary maker, I want high-resolution map animations, so footage looks professional.
- As a documentary maker, I want AI-generated scene images with historical accuracy, so I have visual material.
- As a documentary maker, I want to cite sources clearly, so the work is credible.

---

## Core Tools

### Timeline Animator

Create animated timelines from selected factoids or lenses.

```
TIMELINE ANIMATOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INPUT:
├── Source: Lens OR selected factoids OR search query
├── Date range (from lens bounds or custom)
├── Frame choice
│   ├── Mainstream (default)
│   ├── Astronomical-only
│   ├── Community frame (if member)
│   └── Custom/personal frame
│   NOTE: Frame determines WHERE events appear on timeline
└── Focus (geographic region, topic, actor)

CONFIGURATION:
├── Style
│   ├── Classic (horizontal line, events above/below)
│   ├── Vertical scroll
│   ├── Spiral (for long periods)
│   └── Custom
│
├── Animation
│   ├── Speed (years per second)
│   ├── Pause on major events
│   ├── Zoom to clusters
│   └── Highlight connections
│
├── Visual elements
│   ├── Event markers (dots, icons, images)
│   ├── Period bands (colored backgrounds)
│   ├── Connection lines
│   └── Labels and annotations
│
└── Audio (optional)
    ├── Narration points
    └── Background music sync points

OUTPUT:
├── Video (MP4, WebM)
├── Interactive embed (iframe)
├── Animated GIF
└── Frame sequence (PNG)
```

**Example output:**

```
[Video: 30 seconds]

0:00 - Title: "The Fall of Rome: A Timeline"
0:03 - Timeline appears, starting 200 CE
0:05 - Events begin appearing as time advances
0:08 - 235 CE: Crisis of the Third Century begins (zoom)
0:12 - Multiple events cluster, showing instability
0:18 - 284 CE: Diocletian restores order
0:22 - 395 CE: Empire splits (visual division)
0:26 - 476 CE: Western Empire falls (dramatic marker)
0:30 - End card with attribution
```

### Map Storyteller

Animate movement and change across geography.

```
MAP STORYTELLER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INPUT:
├── Sequence of events with locations
├── Routes/paths (optional)
├── Boundaries over time (optional)
└── Focus region

CONFIGURATION:
├── Base map
│   ├── Modern (OpenStreetMap style)
│   ├── Terrain (topographic)
│   ├── Historical map overlay
│   ├── Minimal (borders only)
│   └── Custom style
│
├── Animation types
│   ├── Point sequence (events appear)
│   ├── Path animation (trace routes)
│   ├── Boundary morph (territories change)
│   ├── Heat map evolution
│   └── Combined
│
├── Time display
│   ├── Clock/date overlay
│   ├── Progress bar
│   └── Period labels
│
└── Annotations
    ├── Location labels
    ├── Event callouts
    └── Narration points

OUTPUT:
├── Video (MP4, WebM)
├── Interactive embed
└── Frame sequence
```

**Example: Alexander's Campaigns**

```
[Video: 45 seconds]

0:00 - Map of Eastern Mediterranean/Near East
0:03 - Pella highlighted: "334 BCE - Alexander departs"
0:06 - Path begins tracing across Hellespont
0:10 - Granicus marker: first battle
0:15 - Path continues south through Anatolia
0:20 - Issus marker: "333 BCE"
0:25 - Path to Egypt, Alexandria founded
0:30 - East to Gaugamela: "331 BCE - Decisive victory"
0:35 - Rapid expansion east to India
0:40 - Path ends at Babylon: "323 BCE"
0:45 - Empire boundary shown at maximum extent
```

### Source Tree Reveal

Dramatic visualization of citation tracking.

```
SOURCE TREE REVEAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INPUT:
├── Starting factoid or claim
└── Depth to trace

ANIMATION:
1. Claim appears at top ("The Library of Alexandria was 
   destroyed by Caesar's fire in 48 BCE")

2. "Let's trace the sources..."
   First layer appears: Modern textbooks (multiple)
   
3. "These books cite..."
   Second layer: 20th century histories
   
4. "Which reference..."
   Third layer: 19th century compilations
   
5. "Based on..."
   Fourth layer: Ancient sources (Plutarch, Cassius Dio)
   
6. "Who wrote centuries after the event..."
   Timeline note appears
   
7. "And even they disagree..."
   Contradictions highlighted
   
8. Final reveal: Root structure
   "47 sources trace to 3 ancient accounts,
    none from eyewitnesses"

OUTPUT:
├── Video
├── Interactive (click to expand)
└── Static diagram
```

### Family Tree Animator

Visualize genealogies with historical context.

```
FAMILY TREE ANIMATOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INPUT:
├── Family tree selection
├── Generation range
└── Historical events to overlay

MODES:
├── Expansion
│   Start with one person, expand outward generation by generation
│
├── Contraction  
│   Start with full tree, collapse to focus on one line
│
├── Timeline overlay
│   Tree on left, historical events on right, time synced
│
└── Geographic
    Show tree with migration paths on map

FEATURES:
├── Photo integration (fade in family photos)
├── Document popups (birth certificates, etc.)
├── Historical context callouts
└── Living person protection

OUTPUT:
├── Video
├── Interactive tree
└── Printable chart
```

### Comparison Mode

Side-by-side views for contrast.

```
COMPARISON MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPARISON TYPES:

Before/After
├── Two time periods
├── Slider or animation between states
└── Example: "Rome 100 CE vs Rome 500 CE"

Frame comparison
├── Same lens viewed through different frames
├── Synchronized playback showing how dates shift
├── Shows anchor weight differences affecting placement
├── Example: "Bronze Age Collapse: Mainstream vs Compressed"
│   Mainstream: 1200 BCE
│   Compressed: ~200 BCE
│   Highlights which anchors cause the difference

Geographic comparison
├── Same time, different regions
├── Side-by-side or overlay
└── Example: "Rome vs Han China in 200 CE"

Source comparison
├── Different accounts of same event
├── Highlight agreements/disagreements
└── Example: "Greek vs Persian accounts of Marathon"

OUTPUT:
├── Split-screen video
├── Interactive slider
└── Synced dual playback
```

---

## Presentation Builder

### Workflow

```
PRESENTATION BUILDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: CREATE SCENES
├── Add timeline animation
├── Add map sequence
├── Add source tree reveal
├── Add comparison
├── Add static slides
├── Add AI-generated images
└── Add custom content

STEP 2: ARRANGE
├── Drag to reorder
├── Set transitions
├── Add chapter markers
└── Preview flow

STEP 3: NARRATION
├── Add text narration (for captions or TTS)
├── Record voiceover
├── Import audio file
└── Sync to scenes

STEP 4: STYLE
├── Choose theme (colors, fonts)
├── Add title/end cards
├── Configure attribution display
└── Add watermark (optional)

STEP 5: EXPORT
├── Video (MP4 1080p/4K)
├── Interactive web (embed code)
├── Slide deck (PowerPoint/Google Slides)
├── PDF handout
└── Raw assets (images, data)
```

### Templates

Pre-built presentation templates:

```yaml
templates:
  historical_overview:
    name: "Historical Overview"
    description: "Timeline + key events + context"
    scenes:
      - title_card
      - timeline_animation
      - key_event_deep_dives (3-5)
      - conclusion
      - sources
    duration: "5-10 minutes"
    
  biography:
    name: "Historical Figure Biography"
    description: "Life timeline with context"
    scenes:
      - title_card
      - birth_context
      - life_timeline
      - major_events
      - death_context
      - legacy
      - sources
    
  event_analysis:
    name: "Event Deep Dive"
    description: "Single event from multiple angles"
    scenes:
      - title_card
      - context_setup
      - event_timeline
      - source_tree_reveal
      - multiple_perspectives
      - aftermath
      - sources
      
  mystery_investigation:
    name: "Historical Mystery"
    description: "Present question, explore evidence"
    scenes:
      - hook_question
      - mainstream_narrative
      - anomalies_reveal
      - source_analysis
      - alternative_views
      - open_conclusion
      - sources
```

### Source Reader Integration

Create presentations directly from Source Reader sessions:

```
SOURCE READER → PRESENTATION WORKFLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCENARIO: Reading Herodotus, want to present Book II findings

1. IN SOURCE READER:
   - Read Book II (Egyptian history)
   - Bookmarked key passages
   - Added annotations
   - Flagged interesting claims

2. CREATE PRESENTATION:
   [Export to Presentation] button in Source Reader

3. AUTO-GENERATED:
   - Lens created from reading session
   - All bookmarked factoids included
   - Annotations become narration notes
   - Maps show locations mentioned
   - Timeline spans the chapter's events

4. CUSTOMIZE:
   - Add source tree reveals for disputed claims
   - Insert AI-generated images for key events
   - Choose frame (mainstream dates vs alternative)
   - Add your commentary

5. EXPORT:
   - Video for YouTube
   - Interactive embed for blog
   - Slides for classroom
```

**Book Playback as Presentation**

The Source Reader's "playback" feature can export directly:

```yaml
book_playback_export:
  source: "Source Reader playback session"
  input:
    book: "Herodotus - Histories"
    chapters: [1, 2, 3]
    playback_speed: "1x"

  auto_generates:
    - Map animation (locations as mentioned)
    - Timeline (events as they appear in narrative)
    - Actor introductions (as they enter the story)
    - Environmental context (weather, seasons)

  export_options:
    - Full playback video
    - Chapter segments
    - Highlight reel (major events only)
```

### Family Tree Integration

Create presentations from genealogical research:

```yaml
family_presentation_templates:
  ancestry_journey:
    name: "Ancestry Journey"
    description: "Migration story through generations"
    input: "Family tree with locations"
    scenes:
      - origin_location
      - migration_path_animation
      - settlement_history
      - historical_context_overlay
      - family_photos_timeline

  life_story:
    name: "Ancestor Life Story"
    description: "One person's life in historical context"
    input: "Single family_person with documents"
    scenes:
      - birth_context
      - life_events_timeline
      - historical_backdrop
      - documents_showcase
      - legacy
```

---

## AI-Generated Imagery

### Historically-Grounded Generation

Generate images with historical accuracy from the data:

```python
def generate_historical_image(factoid_id, style_options):
    """
    Generate an image grounded in historical data.
    """
    # Gather context
    factoid = get_factoid(factoid_id)
    location = get_location_context(factoid)
    time_period = get_time_period(factoid)
    environmental = get_environmental_context(factoid)
    artifacts = get_related_artifacts(factoid)
    
    # Build prompt
    prompt = build_prompt(
        event=factoid.description,
        location=location,
        period=time_period,
        weather=environmental.get('weather'),
        clothing=get_period_clothing(time_period, location),
        architecture=get_period_architecture(time_period, location),
        artifacts=artifacts,
        style=style_options.style,
        composition=style_options.composition
    )
    
    # Generate
    image = image_model.generate(prompt)
    
    # Return with metadata
    return {
        'image': image,
        'prompt_used': prompt,
        'sources_referenced': get_source_ids(factoid),
        'frame_used': style_options.frame.name,  # Which frame's dating
        'date_in_frame': get_placement(factoid, style_options.frame),
        'accuracy_notes': generate_accuracy_notes(prompt),
        'confidence': calculate_visual_confidence(factoid)
    }
```

### Example Generation

```
REQUEST: Generate image for "Napoleon's retreat from Moscow, November 1812"

CONTEXT ASSEMBLED:
├── Event: French army retreating from Moscow
├── Date: November 1812
├── Location: Road between Moscow and Smolensk
├── Weather: 
│   ├── Source: "extreme cold, heavy snow"
│   ├── Temperature: -20°C to -30°C (from accounts)
│   └── Conditions: Blizzard conditions reported
├── Army state:
│   ├── Starving (supply lines cut)
│   ├── Inadequate winter clothing
│   ├── Horses dying
│   └── Equipment abandoned
├── Period details:
│   ├── Uniforms: French Imperial (tattered)
│   ├── Weapons: Muskets, abandoned cannons
│   └── Transport: Horse-drawn, breaking down

GENERATED PROMPT:
"Historical painting style. French soldiers in tattered blue 
uniforms retreating through deep snow, blizzard conditions, 
November 1812. Extreme cold evident - men huddled, frost on 
faces, inadequate clothing. Dead horses in background, 
abandoned cannons half-buried in snow. Exhausted, starving 
soldiers supporting each other. Color palette: whites, grays, 
dark blues. Mood: desperation, survival. Style: Romantic era 
historical painting, similar to Meissonier."

ACCURACY NOTES:
├── ✓ Weather matches source accounts
├── ✓ Uniform details period-appropriate
├── ✓ Equipment abandonment documented
├── ⚠ Exact route location approximated
└── ⚠ Individual faces fictional
```

### Style Options

```yaml
styles:
  historical_painting:
    description: "Classical historical painting style"
    characteristics: "Oil painting aesthetic, dramatic lighting"
    good_for: "Major events, battles, ceremonies"
    
  period_illustration:
    description: "Illustration style of the depicted era"
    characteristics: "Matches artistic conventions of the time"
    good_for: "Authentic period feel"
    
  documentary:
    description: "Realistic, photographic quality"
    characteristics: "As if photographed, neutral perspective"
    good_for: "Educational content, objectivity"
    
  diagram:
    description: "Technical, informational"
    characteristics: "Clear, labeled, explanatory"
    good_for: "Battles, structures, processes"
    
  stylized:
    description: "Modern stylized interpretation"
    characteristics: "Clean lines, selective detail"
    good_for: "Thumbnails, social media, modern feel"
```

---

## Export Formats

### Video Export

```yaml
video_options:
  resolution:
    - 1080p (1920x1080) - Standard HD
    - 4K (3840x2160) - Premium
    - Vertical (1080x1920) - Social media
    
  format:
    - MP4 (H.264) - Universal compatibility
    - WebM (VP9) - Web optimized
    - ProRes - Professional editing
    
  frame_rate:
    - 24fps - Cinematic
    - 30fps - Standard
    - 60fps - Smooth animations
    
  audio:
    - Included (with narration)
    - Music only
    - Silent (for editor voiceover)
```

### Interactive Embed

```html
<!-- Embed code for interactive timeline -->
<iframe 
  src="https://platform.com/embed/timeline/abc123"
  width="800" 
  height="450"
  frameborder="0"
  allowfullscreen>
</iframe>

<!-- With customization -->
<iframe 
  src="https://platform.com/embed/timeline/abc123?
    theme=dark&
    controls=minimal&
    autoplay=false&
    start=1066"
  ...>
</iframe>
```

### Static Exports

```yaml
static_exports:
  images:
    - PNG (high quality, transparency)
    - JPEG (smaller, photos)
    - SVG (vector, scalable)
    
  documents:
    - PDF (print-ready)
    - PowerPoint (.pptx)
    - Google Slides (direct export)
    
  data:
    - JSON (raw data)
    - CSV (spreadsheet)
    - GeoJSON (geographic)
```

---

## Attribution System

### Automatic Attribution

Every export includes:

```
ATTRIBUTION BLOCK (configurable placement)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Data sources:
├── Herodotus, Histories (primary)
├── Thucydides, Peloponnesian War (primary)
├── [12 additional sources]

Contributors:
├── @HistoryBuff42 (47 factoids used)
├── @AncientResearcher (23 factoids used)
├── [8 additional contributors]

Platform: [Platform Name]
Generated: 2024-03-15
License: CC BY-SA 4.0

Verify sources: [link to source tree]
```

### Attribution Levels

```yaml
attribution_levels:
  minimal:
    display: "Created with [Platform]"
    location: Small watermark or end card
    
  standard:
    display: "Data from [Platform]. Key sources: [top 3]"
    location: End card, description text
    
  full:
    display: Complete attribution with all sources/contributors
    location: Dedicated credits section
    
  academic:
    display: Formal citation format
    location: Exportable bibliography
```

---

## Creator Profiles

### Profile Features

```
CREATOR PROFILE: @HistoryExplained
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Channel: History Explained (YouTube, 500K subscribers)
Website: historyexplained.com

CONTRIBUTIONS:
├── Factoids added: 234
├── Sources linked: 89
├── Verifications: 156
└── Research areas: Roman Empire, Medieval Europe

PRESENTATIONS CREATED:
├── "Fall of Rome" timeline (featured)
├── "Medieval Trade Routes" map animation
├── "Crusades Source Analysis"
└── [12 more]

PRESENTATION STATS:
├── Total views (embeds): 125,000
├── Exports: 340
└── Cited by: 23 other creators

[View presentations] [Follow] [Collaborate]
```

### Creator Incentives

```yaml
creator_benefits:
  free_tier:
    - Basic tools
    - 720p export
    - Attribution required
    
  creator_tier:
    - All tools
    - 1080p/4K export
    - Optional attribution
    - AI generation credits
    - Priority rendering
    - Analytics
    
  partner_tier:
    - Everything in creator
    - White-label option
    - API access
    - Custom branding
    - Dedicated support
```

---

## Features

### MVP (Phase 1)

**Basic timeline export**
- Select factoids
- Simple animation
- Video export (1080p)

**Simple map view**
- Static map with events
- Basic zoom/pan
- Image export

**Attribution**
- Automatic attribution in exports
- Source links

### Phase 2

**Full timeline animator**
- Multiple styles
- Customizable animation
- Interactive export

**Map storyteller**
- Path animation
- Historical map overlays
- Boundary changes

**Source tree visualization**
- Interactive tree
- Animated reveal
- Export options

**Presentation builder**
- Scene sequencing
- Templates
- Multiple export formats

### Phase 3 (Dream)

**AI image generation**
- Context-aware generation
- Multiple styles
- Accuracy scoring

**Advanced customization**
- Custom themes
- White-label
- API for automation

**Collaboration**
- Shared presentations
- Team workspaces
- Version control

---

## Open Questions

- **Copyright**: Can users monetize exports? What license applies?

- **AI generation limits**: How many AI generations per tier? Cost implications?

- **Rendering infrastructure**: Where to render videos? Cost at scale?

- **Quality control**: Should generated content be reviewed before export?

- **Branding**: When can users remove platform attribution?

---

## Dependencies

- **02-data-model.md**: Core Data to visualize
- **03-source-system.md**: Source trees for citation visualization
- **04-chronology-system.md**: Timeline data, anchor chains
- **05-geographic-system.md**: Map data, journey routes
- **11-frames-namespaces.md**: Lens system (what to show), Frame system (where in time)
- **12-family-trees.md**: Family tree visualization, life event timelines
- **14-ai-generation.md**: Image generation details
- **21-source-reader.md**: Reading session to presentation workflow

---

## Summary

Presentation Mode transforms research into impact. By providing powerful tools for visualization and export, we serve creators who can amplify the platform's reach while contributing research depth. The tools are designed to maintain the project's commitment to accuracy and attribution — beauty serves truth, not the reverse.

Research becomes story. Story reaches millions. The cycle continues.
