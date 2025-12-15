# Environmental Layer

## Overview

Environmental data — weather, astronomical events, climate patterns, natural disasters — provides some of the hardest anchors available to historical research. Authors rarely lie about incidental weather. Eclipses can be calculated backward with precision. Climate patterns leave physical traces in ice cores and tree rings.

This layer captures environmental observations from sources and cross-references them against calculable or verifiable data, creating anchor points and spotting inconsistencies.

---

## Core Principles

### 1. Incidental Data Is Reliable
When a source mentions "heavy snow during the march" or "the sun darkened," they're usually reporting what they experienced. Environmental details are rarely the focus of propaganda or narrative shaping.

### 2. Astronomy Is Calculable
Solar eclipses, lunar eclipses, comets, planetary conjunctions — these can be calculated backward with high precision. An eclipse mentioned in a source either matches a calculable event or it doesn't.

### 3. Climate Leaves Traces
Tree rings, ice cores, lake sediments preserve climate signals. When multiple sources across regions describe the same unusual weather, and physical evidence confirms it, we have strong corroboration.

### 4. Disasters Create Clusters
Earthquakes, volcanic eruptions, plagues, famines leave traces across multiple independent sources. Clustering of disaster accounts can identify major events even when dating is uncertain.

### 5. Environment Enriches Context
For visualizations and AI generation, environmental context makes history vivid. Knowing it was "harsh winter, heavy snow, -30°C" during Napoleon's retreat isn't just data — it's essential context.

---

## User Stories

### Researcher
- As a researcher, I want to record weather mentioned in sources, so environmental data accumulates.
- As a researcher, I want to link astronomical events to calculated dates, so I can verify or challenge source dating.
- As a researcher, I want to flag climate anomalies, so patterns across sources emerge.

### Chronologist
- As a chronologist, I want to use eclipse mentions as hard anchors, so dating is grounded in calculable events.
- As a chronologist, I want to see where source descriptions don't match calculated astronomy, so I can investigate discrepancies.

### Pattern Hunter
- As a pattern hunter, I want to see disaster clusters across time and geography, so I can identify major events.
- As a pattern hunter, I want to correlate textual accounts with physical evidence (tree rings, ice cores), so I can verify or challenge narratives.

### Creator
- As a creator, I want environmental context for any period, so my visualizations are accurate.
- As a creator, I want to generate images that reflect actual weather conditions, so historical scenes feel authentic.

---

## Environmental Observation Types

### Weather

Short-term atmospheric conditions mentioned in sources.

```
OBSERVATION TYPES:
├── Precipitation
│   ├── Rain (intensity: light, moderate, heavy, torrential)
│   ├── Snow (accumulation if mentioned)
│   ├── Hail
│   └── Fog/mist
├── Temperature
│   ├── Extreme heat
│   ├── Extreme cold
│   ├── Frost
│   └── Mild/unusual warmth
├── Wind
│   ├── Storm/gale
│   ├── Calm (notable if unexpected)
│   └── Direction (if specified)
└── Other
    ├── Drought conditions
    ├── Flood conditions
    └── Unusual sky appearance
```

**Example extraction:**

Source: "The army marched through heavy snow, many horses died of cold"
```javascript
{
  observation_type: "weather",
  observation_subtype: "snow",
  description_original: "heavy snow, many horses died of cold",
  description_normalized: "Heavy snowfall with extreme cold causing animal deaths",
  intensity: "severe",
  location_id: "uuid-russia-campaign-route",

  // Raw temporal evidence (frame-independent)
  raw_claimed_date: "During the retreat from Moscow",  // What source says
  season: "late_autumn",

  // Actual date placement happens via factoid_placements
  // linked_factoid_id → placements give frame-specific dates

  impact_description: "Significant army losses"
}
```

### Astronomical

Celestial events, many of which are calculable.

```
OBSERVATION TYPES:
├── Solar Eclipse
│   ├── Total
│   ├── Partial
│   └── Annular
├── Lunar Eclipse
│   ├── Total
│   ├── Partial
│   └── Penumbral
├── Comets
│   ├── Known period (Halley's, etc.)
│   └── Unknown/one-time
├── Meteors
│   ├── Meteor shower
│   └── Fireball/bolide
├── Planetary
│   ├── Conjunction
│   ├── Opposition
│   └── Unusual brightness
└── Solar/Lunar
    ├── "Blood moon" (atmospheric)
    ├── Sun darkening (eclipse or volcanic?)
    └── Unusual colors
```

**Critical feature: Calculated verification**

For eclipses and known-period comets, we can calculate when they occurred. The calculated date is **frame-independent** - it becomes a hard anchor.

```javascript
{
  observation_type: "astronomical",
  observation_subtype: "solar_eclipse",
  description_original: "The sun was darkened during the battle",
  location_id: "uuid-battle-location",

  // Raw claim from source (frame-independent text)
  raw_claimed_date: "During the battle between Lydians and Medes",

  // Calculated date - FRAME-INDEPENDENT HARD ANCHOR
  calculated_date: "-0585-05-28",
  calculation_source: "NASA Eclipse Calculator",
  calculation_method: "Solar eclipse path calculation",
  calculation_candidates: [
    { date: "-0585-05-28", confidence: 0.95, notes: "Totality path crosses Lydia" }
  ],

  // This is a hard anchor - doesn't shift between frames
  is_hard_anchor: true,

  // The source's claimed context gets a factoid with placements
  // In Mainstream frame: Battle of Halys = May 28, 585 BCE
  // The eclipse LOCKS this date across all frames that trust astronomy
}
```

When calculated dates DON'T match the source's claimed timing:

```javascript
{
  observation_type: "astronomical",
  observation_subtype: "solar_eclipse",
  description_original: "Eclipse in the 5th year of King X",

  // Raw claim (frame-independent)
  raw_claimed_date: "5th year of King X",

  // Calculation results
  calculated_date: null,  // No single match
  calculation_candidates: [
    { date: "-0763-06-15", confidence: 0.4, notes: "Visible but 43 years earlier than king list suggests" },
    { date: "-0709-07-17", confidence: 0.3, notes: "Partial, barely visible from region" }
  ],

  is_hard_anchor: false,  // Ambiguous, can't serve as hard anchor yet

  // Flag for investigation - this is valuable data!
  discrepancy_notes: "No solar eclipse visible from Assyria matches king list chronology",
  possible_explanations: [
    "King list chronology error",
    "Location misidentified",
    "Not actually an eclipse (volcanic dimming?)",
    "Scribal error in reign year"
  ]

  // Different frames might adopt different candidates:
  // Mainstream: might adjust king list by 43 years to match -0763 eclipse
  // Alternative: might question whether this was an eclipse at all
}
```

### Geological

Earth events with physical traces.

```
OBSERVATION TYPES:
├── Seismic
│   ├── Earthquake
│   ├── Tsunami
│   └── Aftershocks
├── Volcanic
│   ├── Eruption
│   ├── Ash fall
│   ├── Lava flow
│   └── Volcanic winter
├── Mass Movement
│   ├── Landslide
│   ├── Avalanche
│   └── Sinkhole
└── Coastal
    ├── Sea level change
    ├── Coastal erosion
    └── Land subsidence
```

**Cross-reference with geological record:**

```javascript
{
  observation_type: "geological",
  observation_subtype: "volcanic",
  description_original: "A mysterious fog covered the land, crops failed, the sun was dim for 18 months",
  location_id: "uuid-mediterranean",

  // Raw claim from source (frame-independent)
  raw_claimed_date: "During the reign of Justinian",

  // Physical evidence provides HARD DATING (frame-independent)
  physical_evidence: [
    {
      type: "ice_core",
      source: "Greenland GISP2",
      finding: "Sulfate spike at 536 CE layer",
      correlation: "strong",
      provides_date: true  // This physically dates the event
    },
    {
      type: "tree_ring",
      source: "European dendrochronology",
      finding: "Minimal growth 536-545 CE",
      correlation: "strong",
      provides_date: true
    }
  ],

  // Physical dating makes this a hard anchor
  is_hard_anchor: true,
  calculated_date: "536-01-01",  // From physical evidence

  corroborating_source_ids: [
    "uuid-procopius",    // Byzantine
    "uuid-cassiodorus",  // Italian
    "uuid-irish-annals", // Irish
    "uuid-nan-shi"       // Chinese
  ],

  event_hypothesis: "Major volcanic eruption (possibly Ilopango, El Salvador)",
  confidence: 0.85
}
```

Note: Ice cores and dendrochronology provide frame-independent hard anchors just like astronomical calculations. The 536 CE event is physically dated - this doesn't shift between chronological frameworks.

### Hydrological

Water-related events and conditions.

```
OBSERVATION TYPES:
├── Flooding
│   ├── River flood
│   ├── Flash flood
│   ├── Coastal flood
│   └── Dam/levee failure
├── Drought
│   ├── Agricultural drought
│   ├── Hydrological drought
│   └── Famine-inducing
├── River Changes
│   ├── Course change
│   ├── Unusual levels
│   └── Freezing
└── Other
    ├── Tidal anomalies
    ├── Lake level changes
    └── Spring failure
```

### Biological

Life-affecting events.

```
OBSERVATION TYPES:
├── Disease
│   ├── Plague/pandemic
│   ├── Epidemic
│   └── Animal disease
├── Agricultural
│   ├── Crop failure
│   ├── Locust swarm
│   ├── Blight/disease
│   └── Bumper harvest (notable)
├── Ecological
│   ├── Animal die-off
│   ├── Migration anomaly
│   └── Invasive species
└── Famine
    ├── Regional
    ├── Widespread
    └── With mortality estimates
```

### Climate Patterns

Multi-year or long-term patterns.

```
OBSERVATION TYPES:
├── Temperature Regime
│   ├── Extended cold period
│   ├── Extended warm period
│   └── Rapid change
├── Precipitation Regime
│   ├── Multi-year drought
│   ├── Extended wet period
│   └── Monsoon failure
└── Named Events
    ├── Little Ice Age
    ├── Medieval Warm Period
    ├── Roman Warm Period
    └── [Custom periods]
```

---

## Data Model

### environmental_observations table

Note: This table is defined in 02-data-model.md. Key design points:

- **Raw claimed date**: Frame-independent text of what the source claims ("in the 3rd year of King X")
- **Calculated date**: For astronomical events, the scientifically calculated date (frame-independent hard anchor)
- **Frame-dependent dating**: Actual temporal placement happens via `factoid_placements` for the linked factoid

```sql
CREATE TABLE environmental_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Link to factoid and source
    factoid_id UUID REFERENCES factoids(id),
    source_id UUID REFERENCES sources(id),

    -- Classification
    observation_type VARCHAR(30) NOT NULL,
    -- weather, astronomical, geological, hydrological, biological, climate_pattern
    observation_subtype VARCHAR(50),

    -- Description
    description_original TEXT,  -- exact text from source
    description_normalized TEXT,  -- standardized description

    -- Raw temporal evidence from source (frame-independent)
    raw_claimed_date TEXT,  -- What the source says: "in the 3rd year of King X"

    -- Characteristics
    intensity VARCHAR(20),  -- severe, moderate, mild
    duration_value INTEGER,
    duration_unit VARCHAR(20),  -- hours, days, months, years
    time_of_day VARCHAR(20),  -- For eclipses: morning, midday, evening
    season VARCHAR(20),  -- If date uncertain but season known

    -- Location
    location_id UUID REFERENCES locations(id),

    -- For astronomical events (calculable - HARD ANCHOR)
    calculated_date DATE,  -- Scientifically calculated date (frame-independent)
    calculation_method TEXT,  -- How it was calculated
    calculation_source TEXT,  -- "NASA Eclipse Calculator", "Skyfield library"
    calculation_candidates JSONB DEFAULT '[]',  -- [{date, confidence, notes}] for ambiguous cases
    is_hard_anchor BOOLEAN DEFAULT FALSE,  -- Can this serve as a frame-independent anchor?

    -- Physical evidence correlation
    physical_evidence JSONB DEFAULT '[]',
    -- [{type: "ice_core", source: "GISP2", finding: "sulfate spike", correlation: "strong"}]

    -- Cross-source corroboration
    corroborating_source_ids UUID[] DEFAULT '{}',

    -- Impact
    impact_description TEXT,
    mortality_estimate TEXT,
    area_affected_km2 DECIMAL,

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_env_type ON environmental_observations(observation_type);
CREATE INDEX idx_env_location ON environmental_observations(location_id);
CREATE INDEX idx_env_calculated ON environmental_observations(calculated_date);
CREATE INDEX idx_env_anchor ON environmental_observations(is_hard_anchor);
```

**Frame-Independent vs Frame-Dependent:**

| Field | Frame Status | Notes |
|-------|--------------|-------|
| `raw_claimed_date` | Independent | What source literally says |
| `calculated_date` | Independent | Scientific calculation (astronomy, etc.) |
| `is_hard_anchor` | Independent | Calculable events are always hard anchors |
| Actual temporal position | Dependent | Via `factoid_placements` for linked factoid |

Astronomical hard anchors are special: their calculated dates don't shift between frames. An eclipse occurred on a specific date regardless of which chronological framework you use. The *source's claim* about when it happened may vary by frame, but the *actual event* is fixed.

### natural_disasters table

For major events with multiple source attestations. Note: Dating follows the same pattern - raw evidence is frame-independent, temporal placement via linked factoid.

```sql
CREATE TABLE natural_disasters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name TEXT,  -- "536 CE Volcanic Winter", "Antioch Earthquake 526 CE"
    disaster_type VARCHAR(30) NOT NULL,

    -- Raw temporal evidence (frame-independent)
    raw_date_evidence TEXT,  -- "Multiple sources place this in the reign of Justinian"
    duration_description TEXT,  -- "lasted 18 months", "several years of crop failures"

    -- For physically datable disasters (ice cores, dendro, etc.)
    physical_date_start DATE,  -- From physical evidence, frame-independent
    physical_date_end DATE,
    physical_dating_method TEXT,  -- "ice core sulfate spike", "dendrochronology"
    physical_dating_confidence DECIMAL(3,2),

    -- Scope
    locations_affected UUID[] DEFAULT '{}',
    area_affected_description TEXT,

    -- Impact
    estimated_deaths TEXT,
    economic_impact TEXT,
    historical_significance TEXT,

    -- Evidence
    observation_ids UUID[] DEFAULT '{}',  -- Link to individual observations
    physical_evidence JSONB DEFAULT '[]',
    -- [{type, source, finding, correlation}]

    -- Analysis
    proposed_cause TEXT,
    confidence DECIMAL(3,2),

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_disasters_type ON natural_disasters(disaster_type);
CREATE INDEX idx_disasters_physical_date ON natural_disasters(physical_date_start);
```

Like astronomical hard anchors, physically-dated disasters (via ice cores, dendrochronology) provide frame-independent dating. The 536 CE volcanic winter is dated by tree rings and ice cores - this doesn't shift between frames.

---

## Astronomical Calculation Integration

### Eclipse Verification Workflow

```
1. USER ENTERS OBSERVATION
   "Eclipse during battle of X, Year 5 of King Y"
   Location: Approximate region
   Date: Claimed date from source

2. SYSTEM QUERIES ECLIPSE DATABASE
   Search: All eclipses visible from region
   Window: Claimed date ± 100 years (configurable)
   
3. RESULTS DISPLAYED
   ├── Exact match found → Strong anchor candidate
   ├── Near match (within 5 years) → Possible with dating adjustment
   ├── Multiple candidates → User selects or flags uncertainty
   └── No match → Flag discrepancy for investigation

4. USER CONFIRMS OR INVESTIGATES
   If match: Link observation to calculated eclipse, create anchor
   If no match: Document discrepancy, propose explanations
```

### Eclipse Data Sources

- NASA Eclipse Database (historical calculations)
- Five Millennium Canon of Solar Eclipses
- Historical eclipse calculation tools

```python
def find_eclipses(region, date_center, window_years=100):
    """
    Query eclipse database for matches.
    Returns list of eclipses visible from region within window.
    """
    eclipses = []
    
    for eclipse in eclipse_database.query(
        date_start=date_center - years(window_years),
        date_end=date_center + years(window_years)
    ):
        if eclipse.visible_from(region):
            eclipses.append({
                'date': eclipse.date,
                'type': eclipse.type,  # total, partial, annular
                'magnitude': eclipse.magnitude,
                'time_of_day': eclipse.local_time(region),
                'duration': eclipse.duration,
                'path': eclipse.totality_path if eclipse.type == 'total' else None
            })
    
    return eclipses
```

### Comet Verification

For comets with known periods (Halley's = ~76 years):

```python
KNOWN_COMETS = {
    'halleys': {
        'period_years': 75.3,
        'known_appearances': [
            {'date': '1986-02-09', 'confirmed': True},
            {'date': '1910-04-20', 'confirmed': True},
            # ... back through history
            {'date': '-0239', 'confirmed': True},  # Possibly in Chinese records
        ]
    }
}

def verify_comet_sighting(description, claimed_date):
    """
    Check if a comet sighting matches known periodic comets.
    """
    for comet_name, comet_data in KNOWN_COMETS.items():
        for appearance in comet_data['known_appearances']:
            if abs(claimed_date - appearance['date']) < years(2):
                return {
                    'match': True,
                    'comet': comet_name,
                    'calculated_date': appearance['date'],
                    'offset_years': claimed_date - appearance['date']
                }
    return {'match': False, 'possible_comets': suggest_matches(description)}
```

---

## Climate Pattern Analysis

### Multi-Source Climate Signals

When multiple sources describe similar conditions:

```javascript
{
  pattern_name: "530s CE Climate Anomaly",
  date_range: "535-545 CE",
  
  textual_sources: [
    {
      source: "Procopius - History of the Wars",
      region: "Byzantine Empire",
      description: "The sun gave forth its light without brightness... for the whole year"
    },
    {
      source: "Cassiodorus - Letters",
      region: "Italy", 
      description: "The sun... appears of a bluish color... winter without storms, spring without mildness, summer without heat"
    },
    {
      source: "Annals of Ulster",
      region: "Ireland",
      description: "A failure of bread in the year 536"
    },
    {
      source: "Nan Shi (Southern History)",
      region: "China",
      description: "Yellow dust rained down like snow"
    }
  ],
  
  physical_evidence: [
    {
      type: "ice_core",
      location: "Greenland",
      finding: "Sulfate spike indicating volcanic aerosols"
    },
    {
      type: "tree_ring",
      location: "Multiple Northern Hemisphere sites",
      finding: "Near-zero growth 536-545, coldest decade in 2000 years"
    }
  ],
  
  synthesis: "Strong evidence for major volcanic event(s) causing global cooling",
  confidence: 0.90
}
```

### Pattern Detection

System identifies potential climate events by clustering observations:

```python
def detect_climate_patterns(observations, time_window_years=5, min_sources=3):
    """
    Find clusters of climate observations that might indicate major events.
    """
    clusters = []
    
    # Group observations by time window
    for window_start in range(min_date, max_date, time_window_years):
        window_obs = [o for o in observations 
                      if window_start <= o.date < window_start + time_window_years]
        
        # Check for geographic spread (independence indicator)
        regions = set(o.location.region for o in window_obs)
        
        if len(window_obs) >= min_sources and len(regions) >= 2:
            clusters.append({
                'date_range': (window_start, window_start + time_window_years),
                'observation_count': len(window_obs),
                'region_count': len(regions),
                'observation_types': categorize(window_obs),
                'possible_event': infer_event_type(window_obs)
            })
    
    return clusters
```

---

## Visualization Context

### Weather for Historical Scenes

When generating visualizations or AI images:

```python
def get_environmental_context(location_id, date, radius_days=30):
    """
    Gather environmental context for image generation.
    """
    observations = query_observations(
        location=location_id,
        date_start=date - days(radius_days),
        date_end=date + days(radius_days)
    )
    
    context = {
        'weather': extract_weather(observations),
        'season': estimate_season(location_id, date),
        'astronomical': get_astronomical_conditions(location_id, date),
        'climate_period': get_climate_period(date),  # e.g., "Little Ice Age"
        'recent_disasters': get_recent_disasters(location_id, date)
    }
    
    return context

# Example output:
{
  'weather': {
    'temperature': 'extreme_cold',
    'precipitation': 'heavy_snow',
    'source_quotes': ["the ground frozen hard", "many died of cold"]
  },
  'season': 'late_autumn',
  'astronomical': {
    'moon_phase': 'waning_gibbous',
    'notable_events': None
  },
  'climate_period': 'Little Ice Age (active)',
  'recent_disasters': ['1812 unusually early and harsh winter']
}
```

This context feeds into image generation prompts:

```
Generate: Napoleon's army retreating from Moscow
Environmental context:
- Late November 1812
- Extreme cold (-20°C to -30°C)
- Heavy snow, frozen ground
- Soldiers inadequately clothed
- Horses dying, equipment abandoned
- Little Ice Age climate: harsher winters than modern

Style: Historical painting, bleak atmosphere...
```

---

## Features

### MVP (Phase 1)

**Basic observation entry**
- Type and subtype selection
- Description (original and normalized)
- Date and location linking
- Intensity rating

**Simple listing and filtering**
- Filter by type, date range, location
- Basic search

### Phase 2

**Astronomical verification**
- Eclipse lookup against calculated database
- Match/no-match flagging
- Anchor creation for verified events

**Climate pattern clustering**
- Automatic detection of observation clusters
- Cross-source correlation display
- Physical evidence linking

**Disaster event synthesis**
- Combine multiple observations into events
- Impact assessment
- Geographic spread visualization

### Phase 3 (Dream)

**Real-time calculation integration**
- API to astronomical calculation services
- Automatic verification suggestions
- "Possible eclipse matches" for any date claim

**Physical evidence database**
- Ice core data integration
- Dendrochronology sequences
- Link textual to physical evidence

**Climate reconstruction**
- Period-by-period climate estimates
- Regional climate modeling
- Confidence-weighted synthesis

**Environmental storytelling**
- Automatic environmental context for any event
- Weather/climate aware visualizations
- "What was the weather like?" queries

---

## Example: Using Environmental Data

### Verifying a Battle Date

Source claims: "Battle of X occurred during an eclipse in Year 5 of King Y"

```
STEP 1: Extract observation
- Type: astronomical / solar_eclipse
- Location: Battle site region
- Claimed date: Based on king list chronology → 720 BCE

STEP 2: Query eclipses
- Search eclipses visible from region
- Window: 820 BCE to 620 BCE

STEP 3: Results
- Eclipse found: 721 BCE, March 8, total, visible from region
- Offset from claimed: 1 year

STEP 4: Analysis
- Near match suggests king list has minor error
- OR year counting convention differs
- Eclipse provides hard anchor ± 1 year

STEP 5: Record
- Create environmental observation with calculated match
- Create anchor with high confidence
- Note 1-year offset for chronology investigation
```

### Detecting Hidden Disasters

Pattern detection finds:
- 7 sources from 540s CE mention crop failures
- 4 sources mention "dim sun" or "strange fog"
- 3 sources mention cold summers
- Geographic spread: Italy, Ireland, Byzantine, China

System flags: "Possible major climate event 535-545 CE"

Researcher investigates:
- Links to ice core sulfate data
- Links to dendrochronology cold signal
- Creates natural_disaster record
- All individual observations linked to event

Result: Previously unconnected observations now form coherent picture of global catastrophe.

---

## Environmental Events in Chains

Environmental observations naturally integrate with event chains (see 04-chronology-system.md). An eclipse during a battle, a storm that delayed a march, a famine that triggered migration - these become links in chains.

### Environmental Links

```javascript
// Campaign chain with environmental events
{
  chain_id: "uuid-napoleon-russia-campaign",
  chain_type: "campaign",
  name: "Napoleon's Russian Campaign",

  links: [
    { factoid: "Crossing of Niemen", sequence: 1 },
    { factoid: "Battle of Smolensk", sequence: 2 },
    { factoid: "Battle of Borodino", sequence: 3 },
    { factoid: "Entry into Moscow", sequence: 4 },
    { factoid: "Fire of Moscow", sequence: 5 },
    {
      factoid: "First heavy snowfall",  // Environmental event
      sequence: 6,
      environmental_observation_id: "uuid-snow-observation",
      link_type: "environmental_trigger"
    },
    { factoid: "Beginning of retreat", sequence: 7 },
    {
      factoid: "Extreme cold spell",  // Environmental event
      sequence: 8,
      environmental_observation_id: "uuid-cold-observation",
      delta_value: 5,
      delta_unit: "days",
      impact: "Mass casualties among troops and horses"
    },
    { factoid: "Crossing of Berezina", sequence: 9 }
  ]
}
```

### Astronomical Anchors in Chains

When an eclipse or other calculable event appears in a chain, it can anchor the entire chain:

```javascript
{
  chain_id: "uuid-battle-halys-chain",
  chain_type: "military",

  links: [
    { factoid: "Lydian-Median war begins", sequence: 1 },
    { factoid: "Multiple campaigns", sequence: 2 },
    {
      factoid: "Eclipse during battle",
      sequence: 3,
      environmental_observation_id: "uuid-halys-eclipse",
      is_anchor_point: true,
      anchor_date: "-0585-05-28",  // Calculated, frame-independent
      anchor_confidence: 0.95
    },
    { factoid: "Peace treaty signed", sequence: 4, delta_value: 1, delta_unit: "days" }
  ],

  // This chain is now anchored - the eclipse fixes the entire sequence
  is_anchored: true,
  anchor_propagation: "Eclipse at link 3 dates all events in chain"
}
```

The eclipse becomes a natural anchor point, dating not just itself but the entire chain through the temporal relationships.

---

## Source Reader Integration

Environmental data enriches the Source Reader experience (see 21-source-reader.md). As users read historical texts, environmental context appears alongside the narrative.

### Weather Extraction from Books

When extracting data from historical sources, environmental observations are captured systematically:

```javascript
// Extraction from Herodotus
{
  extraction_set_id: "uuid-herodotus-histories",
  structural_ref: "Book VII, Chapter 188",

  environmental_extractions: [
    {
      description_original: "A great storm arose from the east, what the locals call Hellespontias",
      observation_type: "weather",
      observation_subtype: "storm",
      intensity: "severe",
      raw_claimed_date: "During Xerxes' invasion, before Artemisium",
      location_hint: "Coast of Magnesia",
      impact: "Persian fleet losses - 400 ships wrecked"
    }
  ]
}
```

### Environmental Display in Source Reader

As the user reads or "plays" a book:

```
┌─────────────────────────────────────────────────────────────┐
│ READING: Herodotus - Histories                              │
│ Book VII, Chapter 188                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ "A great storm arose from the east..."                      │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ENVIRONMENTAL EVENT DETECTED                            │ │
│ │                                                         │ │
│ │ Type: Storm (Hellespontias wind)                       │ │
│ │ Intensity: Severe                                       │ │
│ │ Location: Coast of Magnesia                            │ │
│ │ Impact: 400 Persian ships lost                         │ │
│ │                                                         │ │
│ │ [Show on Map] [Add to Timeline] [View Related]         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ CHAIN CONTEXT: Xerxes' Invasion → Storm → Battle of        │
│ Artemisium (3 days later)                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Playback Weather Visualization

During book playback, environmental events can trigger visual changes:

- **Weather mentions**: Map shows weather icons, atmosphere changes
- **Astronomical events**: Eclipse animation, comet visualization
- **Disasters**: Impact visualization, affected areas highlighted
- **Climate context**: Season indicators, "Little Ice Age" badge for relevant periods

```javascript
// Playback environmental triggers
{
  playback_triggers: [
    {
      structural_ref: "Book VII, Ch. 188",
      trigger_type: "weather",
      visualization: "storm_animation",
      map_effect: "show_wind_direction",
      atmosphere: "darken_sky"
    },
    {
      structural_ref: "Book I, Ch. 74",
      trigger_type: "astronomical",
      visualization: "eclipse_animation",
      map_effect: "totality_path_overlay",
      pause_playback: true,  // Significant event
      annotation: "This eclipse can be calculated to May 28, 585 BCE"
    }
  ]
}
```

### Environmental Context Panel

The Source Reader can show an environmental context panel:

```
ENVIRONMENTAL CONTEXT (Book VII, Ch. 188)
─────────────────────────────────────────
Season: Late summer (August-September)
Climate period: Classical Warm Period
Recent weather: Storm described
Astronomical: No notable events

WEATHER IN THIS SECTION:
├── Storm from east (Hellespontias)
│   └── Impact: Fleet losses
└── Duration: 3 days mentioned

RELATED OBSERVATIONS:
├── Same storm mentioned in Book VIII
└── Archaeological: Shipwreck deposits on Magnesian coast
```

This transforms environmental mentions from incidental details into rich, interactive data that enhances historical understanding.

---

## Open Questions

- **Eclipse database source**: Which calculation tool/database to integrate? NASA's is comprehensive but requires processing.

- **Physical evidence integration**: How to handle ice core / tree ring data? Separate database? External API?

- **Confidence calibration**: How much do we trust weather mentions? An eclipse is verifiable, but "heavy snow" is not.

- **Modern climate data**: Include modern meteorological data for comparison? (Useful for understanding what "harsh winter" meant in different periods)

---

## Dependencies

- **01-core-concepts.md**: Observation as factoid subtype
- **02-data-model.md**: Schema for observations
- **04-chronology-system.md**: Anchors from astronomical events, chain integration
- **05-geographic-system.md**: Location linking for observations
- **21-source-reader.md**: Environmental extraction during book reading

---

## Technical Notes

### External Data Sources

Potential integrations:
- **NASA Eclipse Database**: Historical eclipse calculations
- **NOAA Paleoclimatology**: Ice cores, tree rings
- **USGS Earthquake Catalog**: Historical seismic data
- **Smithsonian Volcanism Program**: Historical eruptions

### Astronomical Calculations

Libraries for astronomical calculations:
- **Python**: `astropy`, `ephem`, `skyfield`
- **JavaScript**: `astronomy-engine`

Example eclipse calculation:
```python
from skyfield import api
from skyfield import eclipselib

ts = api.load.timescale()
eph = api.load('de421.bsp')

# Find solar eclipses in date range
t0 = ts.utc(-600, 1, 1)
t1 = ts.utc(-500, 1, 1)

times, types = eclipselib.solar_eclipses(eph, t0, t1)
```

### Performance

- Eclipse calculations can be precomputed and cached
- Clustering algorithms should run async, results cached
- Physical evidence data can be large — consider separate service

---

## Summary

The environmental layer transforms incidental mentions into hard data. By systematically capturing weather, astronomy, and disaster observations, cross-referencing with calculable events and physical evidence, and detecting patterns across sources, we build a foundation of anchors and context that strengthens the entire chronological framework.

The sun darkened. The crops failed. The earth shook. These weren't just metaphors — they were data points waiting to be connected.
