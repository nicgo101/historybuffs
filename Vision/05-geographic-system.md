# Geographic System

## Overview

Geography in historical research presents unique challenges: places change names, coastlines shift, cities move, boundaries are contested, and our very model of the earth's surface is not universally agreed upon.

The geographic system is designed to be **model-agnostic** and **temporally aware**. It stores locations in multiple reference systems, preserves historical map data, and handles the fundamental uncertainty of "where was this?"

---

## Core Principles

### 1. Model Agnosticism
The system does not require users to accept any particular model of earth's geometry. By default, it uses flat plane geometry (simpler, matches historical maps, sidesteps controversy). Spherical calculations are available as an option. The system is transparent about which model is being used.

### 2. Temporal Awareness
Locations are not static points. Cities relocate. Rivers change course. Coastlines advance or retreat. Sea levels rise and fall. The system tracks location *over time*, preserving historical positions even when modern positions differ.

### 3. Multiple Reference Systems
A location can be expressed in:
- Modern coordinates (latitude/longitude or x/y)
- Historical map references ("3 days east of Alexandria")
- Relative positioning ("near the confluence of...")

All coexist. Discrepancies are data, not errors.

### 4. Historical Map Integration
Old maps are not "wrong" — they're records of how people understood geography at the time. The system georeferenced historical maps to modern coordinates where possible, preserving and displaying discrepancies.

### 5. Uncertainty Is Explicit
Most historical locations have uncertainty. "Athens" is precise. "The battlefield" may be unknown to within 50 kilometers. The system displays uncertainty visually and factors it into analyses.

---

## User Stories

### Explorer
- As an explorer, I want to see events on a map, so I can understand spatial patterns.
- As an explorer, I want to overlay historical maps, so I can see how geography was understood at the time.
- As an explorer, I want to see how locations changed over time, so I understand geographic drift.

### Researcher
- As a researcher, I want to enter locations with uncertainty ranges, so precision is honest.
- As a researcher, I want to link events to both modern and historical place names, so both are searchable.
- As a researcher, I want to note when a source's geography doesn't match modern understanding, so discrepancies are preserved.

### Alternative Researcher
- As an alternative researcher, I want to use flat plane geometry, so I can explore historical maps as they were drawn.
- As an alternative researcher, I want to compare distance calculations across models, so I can evaluate assumptions.
- As an alternative researcher, I want to see where coastlines and features don't match, so I can investigate changes.

### Map Creator
- As a map creator, I want to animate events over geography, so I can show historical movement.
- As a map creator, I want to style maps to match historical periods, so presentations feel authentic.
- As a map creator, I want to export map sequences as video, so I can use them in productions.

---

## Location Representation

### Core Location Record

```sql
CREATE TABLE locations (
    id UUID PRIMARY KEY,
    
    -- Identity
    name_modern TEXT,
    name_historical JSONB DEFAULT '[]',  
    -- [{name: "Byzantium", period_start: "-0667", period_end: "0330", source_id: "..."},
    --  {name: "Constantinople", period_start: "0330", period_end: "1453", source_id: "..."},
    --  {name: "Istanbul", period_start: "1453", period_end: null, source_id: "..."}]
    
    -- Classification
    location_type VARCHAR(30) NOT NULL,  -- point, area, linear
    location_subtype VARCHAR(50),
    
    -- Modern coordinates (WGS84 or flat reference)
    coordinate_x DECIMAL(12,6),  -- longitude or x
    coordinate_y DECIMAL(12,6),  -- latitude or y
    coordinate_system VARCHAR(30) DEFAULT 'wgs84',
    
    -- Uncertainty
    uncertainty_radius_km DECIMAL(10,2),
    uncertainty_notes TEXT,
    
    -- For areas
    boundary_geojson JSONB,
    
    -- Temporal changes
    location_changes JSONB DEFAULT '[]',
    -- [{period: "pre-1000 BCE", coordinates: {x, y}, description: "Original coastline position"}]
    
    -- Environment
    climate_notes TEXT,
    terrain_notes TEXT,
    elevation_m INTEGER
);
```

### Location Types

```
POINT
├── Settlement
│   ├── City
│   ├── Town
│   ├── Village
│   └── Encampment
├── Structure
│   ├── Temple
│   ├── Fortress
│   ├── Monument
│   └── Building
├── Site
│   ├── Archaeological site
│   ├── Battlefield
│   └── Event location
└── Geographic Feature
    ├── Mountain peak
    ├── River confluence
    ├── Spring/well
    └── Cave

AREA
├── Political
│   ├── Empire
│   ├── Kingdom
│   ├── Province
│   └── Territory
├── Geographic
│   ├── Region
│   ├── Island
│   ├── Peninsula
│   └── Plain/valley
└── Cultural
    ├── Ethnic homeland
    ├── Religious zone
    └── Trade network

LINEAR
├── Water
│   ├── River
│   ├── Canal
│   └── Coastline
├── Infrastructure
│   ├── Road
│   ├── Wall
│   └── Trade route
└── Boundary
    ├── Border
    ├── Treaty line
    └── Natural divide
```

### Historical Names

Names change. The system tracks name evolution:

```javascript
{
  location_id: "uuid-constantinople",
  name_modern: "Istanbul",
  name_historical: [
    {
      name: "Byzantium",
      period_start: "-0667",  // 667 BCE
      period_end: "0330",     // 330 CE
      source_id: "uuid-source-1",
      used_by: ["Greeks", "Romans"]
    },
    {
      name: "Nova Roma",
      period_start: "0330",
      period_end: "0337",
      source_id: "uuid-source-2",
      notes: "Brief official name"
    },
    {
      name: "Constantinople", 
      period_start: "0330",
      period_end: "1453",
      source_id: "uuid-source-3",
      used_by: ["Romans", "Byzantines", "Western Europeans"]
    },
    {
      name: "Konstantiniyye",
      period_start: "1453",
      period_end: "1930",
      source_id: "uuid-source-4",
      used_by: ["Ottomans"]
    },
    {
      name: "Istanbul",
      period_start: "1930",
      period_end: null,
      source_id: "uuid-source-5",
      notes: "Official Turkish name"
    }
  ]
}
```

Search works across all historical names. Display adapts to the period being viewed.

### Location Interpretations

Like factoid extensions, some locations have contested or uncertain positions. The same ancient city name might be identified with different modern sites by different researchers.

```sql
CREATE TABLE location_interpretations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(id),

    -- Interpretation details
    interpretation_name VARCHAR(200) NOT NULL,  -- "Traditional identification", "Revised by Smith 2015"

    -- Proposed coordinates
    coordinate_x DECIMAL(12,6),
    coordinate_y DECIMAL(12,6),
    uncertainty_radius_km DECIMAL(10,2),
    boundary_geojson JSONB,  -- for areas

    -- Evidence and reasoning
    reasoning TEXT,
    evidence_summary TEXT,
    source_ids UUID[] DEFAULT '{}',

    -- Confidence and status
    confidence_level VARCHAR(20),  -- certain, probable, possible, speculative
    is_mainstream BOOLEAN DEFAULT FALSE,
    is_contested BOOLEAN DEFAULT FALSE,

    -- Metadata
    proposed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Example: The location of Troy**

```javascript
{
  location_id: "uuid-troy",
  name_modern: "Troy",
  name_historical: [{name: "Ilion", period_start: "-1200", period_end: "0400"}],

  interpretations: [
    {
      interpretation_name: "Hisarlik (mainstream)",
      coordinate_x: 26.2389,
      coordinate_y: 39.9575,
      reasoning: "Schliemann excavation, matched Homeric descriptions",
      is_mainstream: true,
      confidence_level: "probable"
    },
    {
      interpretation_name: "Hereke Peninsula (alternative)",
      coordinate_x: 29.6,
      coordinate_y: 40.7,
      reasoning: "Based on alternative reading of ancient sailing distances",
      is_mainstream: false,
      confidence_level: "speculative"
    },
    {
      interpretation_name: "Unknown/Mythological",
      coordinate_x: null,
      coordinate_y: null,
      reasoning: "Position that Troy may be purely mythological",
      uncertainty_radius_km: null,
      confidence_level: "possible"
    }
  ]
}
```

Frames can adopt specific location interpretations, just as they adopt factoid extensions. A mainstream frame uses mainstream identifications; an alternative frame might use revised locations.

---

## Coordinate Systems

### Default: WGS84

The standard global coordinate system. Compatible with modern maps, GPS, most mapping tools.

```
Latitude: -90 to +90 (south to north)
Longitude: -180 to +180 (west to east)
```

### Alternative: Flat Plane Reference

For users who prefer flat earth geometry or want to work with historical maps as drawn:

```
X: arbitrary units, typically km from reference point
Y: arbitrary units, typically km from reference point
Reference point: user-defined (e.g., center of historical map)
```

The system can:
- Store coordinates in either system
- Convert between systems (with assumptions made explicit)
- Calculate distances using either geometry
- Display which system is active

### Historical Map Coordinates

Old maps often use different projections or no formal projection at all. When georeferencing:

```javascript
{
  historical_map_id: "uuid-ptolemy-map",
  control_points: [
    {
      historical_x: 234,  // pixel or map units
      historical_y: 567,
      modern_lat: 41.0082,
      modern_lon: 28.9784,
      confidence: 0.9,
      location_name: "Constantinople"
    },
    // ... more control points
  ],
  transformation: "polynomial-2",  // or "affine", "thin-plate-spline"
  residual_error_km: 45,  // average error after transformation
  notes: "Ptolemy's map stretched in the east-west direction"
}
```

---

## Spatial Model Philosophy

### The Controversy

Earth's shape is, for some users, an open question. The system doesn't take a position. It provides tools for both perspectives:

**Spherical Model (Default for most mapping)**
- Standard geographic calculations
- Great circle distances
- Latitude/longitude coordinates
- Compatible with existing tools and data

**Flat Plane Model (Alternative)**
- Euclidean geometry
- Straight-line distances
- X/Y coordinates
- Matches historical map appearance

### Implementation

```python
class DistanceCalculator:
    def __init__(self, model='spherical'):
        self.model = model
    
    def distance(self, point_a, point_b):
        if self.model == 'spherical':
            return self._haversine(point_a, point_b)
        elif self.model == 'flat':
            return self._euclidean(point_a, point_b)
    
    def _haversine(self, a, b):
        # Great circle distance on sphere
        # ... standard formula
        pass
    
    def _euclidean(self, a, b):
        # Straight line distance on plane
        return sqrt((b.x - a.x)**2 + (b.y - a.y)**2)
```

### Transparency

When distances are calculated or displayed, the system shows:

```
Distance: Athens → Alexandria
├── Spherical model: 795 km
├── Flat plane model: 812 km
└── Historical source claim: "7 days sail" (~800 km typical)
```

Users see the comparison. They draw their own conclusions.

---

## Geographic Change Over Time

### Location Drift

Some locations move:
- Rivers change course
- Settlements relocate
- Coastlines shift
- Sea levels change

```javascript
{
  location_id: "uuid-nile-delta",
  location_changes: [
    {
      period: "pre-3000 BCE",
      description: "Delta further inland",
      boundary_geojson: { /* ... */ },
      sea_level_relative: "+5m",
      source_id: "uuid-geological-study"
    },
    {
      period: "3000 BCE - 500 BCE", 
      description: "Classical delta configuration",
      boundary_geojson: { /* ... */ },
      source_id: "uuid-herodotus"
    },
    {
      period: "500 BCE - 1800 CE",
      description: "Gradual sedimentation extends delta",
      boundary_geojson: { /* ... */ }
    },
    {
      period: "modern",
      description: "Current configuration post-Aswan Dam",
      boundary_geojson: { /* current */ }
    }
  ]
}
```

### Coastline Discrepancies

When historical maps show different coastlines:

```
┌─────────────────────────────────────────────────────┐
│ COASTLINE COMPARISON: Eastern Mediterranean        │
├─────────────────────────────────────────────────────┤
│                                                     │
│     ░░░░░                                           │
│   ░░░░░░░░░  ← Historical coastline (Ptolemy)      │
│  ░░░░░░░░░░░                                        │
│   ▓▓▓▓▓▓▓▓   ← Modern coastline                    │
│    ▓▓▓▓▓▓▓▓                                         │
│                                                     │
│ Discrepancy: Historical shows coast 40km further   │
│ Possible explanations:                              │
│ ├── Sea level change                               │
│ ├── Sedimentation                                  │
│ ├── Map inaccuracy                                 │
│ └── Different understanding of geography           │
│                                                     │
│ [View sources] [Explore explanations]              │
└─────────────────────────────────────────────────────┘
```

The system doesn't resolve the discrepancy — it displays it as data.

---

## Historical Map Integration

### Map Repository

Historical maps are stored and georeferenced:

```sql
CREATE TABLE historical_maps (
    id UUID PRIMARY KEY,

    -- Identity
    name TEXT NOT NULL,
    author_id UUID REFERENCES actors(id),

    -- Raw dating evidence (frame-independent)
    raw_dating_evidence TEXT,  -- "Inscribed 'Anno Domini 1482'" or "Watermark dates paper to 15th century"
    creation_context TEXT,     -- circumstances of creation if known

    -- Content
    image_storage_ref TEXT,  -- high-res image
    thumbnail_storage_ref TEXT,
    
    -- Geographic scope
    region_covered TEXT,
    center_lat DECIMAL(9,6),
    center_lon DECIMAL(9,6),
    approximate_scale TEXT,
    
    -- Georeferencing
    control_points JSONB,
    transformation_type VARCHAR(30),
    is_georeferenced BOOLEAN DEFAULT FALSE,
    georef_accuracy_km DECIMAL(10,2),
    
    -- Source
    source_id UUID REFERENCES sources(id),
    current_location TEXT,  -- where is original held
    
    -- Analysis
    projection_type TEXT,  -- if identifiable
    notable_features TEXT,
    discrepancies_noted TEXT
);
```

### Map Overlay System

Users can overlay historical maps on modern base maps:

```
┌─────────────────────────────────────────┐
│ MAP VIEW: Mediterranean 200 CE         │
├─────────────────────────────────────────┤
│                                         │
│  [Modern base: OpenStreetMap]           │
│  [Overlay: Ptolemy's Geography]         │
│  [Opacity: 50%]                         │
│                                         │
│  Historical features shown:             │
│  ├── Cities (triangles)                │
│  ├── Rivers (blue lines)               │
│  ├── Mountains (brown shading)         │
│  └── Coastlines (dashed where differs) │
│                                         │
│  [Toggle overlay] [Adjust opacity]     │
│  [Show discrepancies] [View map info]  │
│                                         │
└─────────────────────────────────────────┘
```

### Discrepancy Tracking

When historical maps don't match modern geography:

```javascript
{
  map_id: "uuid-peutinger-table",
  discrepancies: [
    {
      type: "distance",
      description: "Britain shown much closer to Gaul than actual",
      modern_distance_km: 33,  // Dover to Calais
      map_implied_distance_km: 15,
      possible_reasons: ["Schematic representation", "Symbolic distance"]
    },
    {
      type: "coastline",
      region: "Baltic Sea",
      description: "Baltic shown as small bay rather than large sea",
      possible_reasons: ["Unknown to Romans", "Beyond map scope"]
    },
    {
      type: "position",
      location: "Taprobane (Sri Lanka)",
      description: "Shown much larger than actual relative to India",
      possible_reasons: ["Exaggerated importance", "Conflated with other islands"]
    }
  ]
}
```

---

## Visualization

### Basic Map View

Events plotted on map with:
- Time slider to filter by period
- Clustering for dense regions
- Uncertainty circles where relevant
- Click for event details

### Movement Animation

Animate entities moving across geography:
- Armies on campaign
- Trade routes active over time
- Migration patterns
- Empire expansion/contraction

```javascript
{
  animation_type: "movement",
  entity: "Alexander's Campaign",
  waypoints: [
    { location_id: "uuid-pella", date: "-0334-05", label: "Departure" },
    { location_id: "uuid-granicus", date: "-0334-06", label: "First battle" },
    { location_id: "uuid-issus", date: "-0333-11", label: "Battle of Issus" },
    // ... etc
  ],
  trail_style: "fade",  // previous path fades
  speed: "1 year per 5 seconds"
}
```

### Journey Route Rendering (Chain Integration)

Event chains (see 04-chronology-system.md) can be marked as journeys for geographic rendering. This explicit marking helps both the extraction AI and the rendering system understand that a chain represents physical movement across space.

**Chain journey fields:**

```sql
-- Added to event_chains table
journey_route_type VARCHAR(30),  -- NULL, 'travel', 'campaign', 'migration', 'trade_route', 'pilgrimage'
journey_start_location_id UUID REFERENCES locations(id),
journey_end_location_id UUID REFERENCES locations(id),
journey_mode VARCHAR(30),  -- 'foot', 'horse', 'ship', 'mixed'
```

**How it works:**

1. **Extraction**: When AI extracts data from a source, journeys are explicitly identified:
   - "Ibn Battuta departed Tangier... arrived Damascus... traveled to Mecca"
   - Creates a chain with `journey_route_type: 'pilgrimage'`
   - Start: Tangier, End: Mecca, waypoints as chain links

2. **Rendering**: The map system queries chains with journey_route_type set:
   ```javascript
   {
     chain_id: "uuid-ibn-battuta-hajj",
     journey_route_type: "pilgrimage",
     journey_start: { location_id: "uuid-tangier", name: "Tangier" },
     journey_end: { location_id: "uuid-mecca", name: "Mecca" },
     waypoints: [
       { location_id: "uuid-tunis", sequence: 1 },
       { location_id: "uuid-alexandria", sequence: 2 },
       { location_id: "uuid-cairo", sequence: 3 },
       { location_id: "uuid-damascus", sequence: 4 },
       // ...
     ],
     total_duration: "16 months",
     mode: "mixed"
   }
   ```

3. **Display options**:
   - Draw route line connecting all locations
   - Animate traveler moving along route
   - Show duration between waypoints
   - Style by journey type (campaign = red arrows, pilgrimage = green path)

**Journey types and rendering styles:**

| Type | Style | Example |
|------|-------|---------|
| `travel` | Simple line with arrows | Personal journey |
| `campaign` | Bold red with direction markers | Military campaigns |
| `migration` | Gradient showing movement | Population movements |
| `trade_route` | Dashed with commodity icons | Merchant routes |
| `pilgrimage` | Dotted green path | Religious journeys |

This explicit journey marking makes it trivial to:
- Show all campaigns on a map
- Trace an explorer's entire journey
- Compare trade routes across periods
- Animate any journey as the Source Reader "plays" a book

### Heat Maps

Show density of events over geography:
- Where do claims concentrate?
- Where are the gaps?
- How does density change over time?

### Uncertainty Visualization

Display location uncertainty explicitly:

```
● Precise location (< 1 km uncertainty)
◐ Approximate location (1-10 km)
○ General area (10-100 km)
◌ Regional only (> 100 km)
```

Or with uncertainty circles/ellipses showing probable location area.

---

## Features

### MVP (Phase 1)

**Basic location entry**
- Name (modern + historical)
- Type and subtype
- Coordinates (WGS84)
- Uncertainty radius
- Simple notes

**Simple map view**
- Events on modern base map
- Click for details
- Basic zoom/pan

**Location search**
- By modern name
- By historical name
- By coordinates

### Phase 2

**Historical map overlay**
- Upload historical maps
- Basic georeferencing (manual control points)
- Opacity controls
- Side-by-side view

**Geographic change tracking**
- Location over time
- Coastline changes
- Name evolution timeline

**Advanced uncertainty**
- Uncertainty ellipses (not just circles)
- Probability surfaces for very uncertain locations

**Flat plane option**
- Alternative coordinate system
- Distance calculations in both models
- Transparent comparison

### Phase 3 (Dream)

**Automated georeferencing**
- AI-assisted control point matching
- Automatic feature recognition
- Error estimation

**3D terrain**
- Elevation data
- Line-of-sight calculations
- Watershed analysis

**Environmental integration**
- Climate layers by period
- Vegetation reconstruction
- Sea level changes over time

**Movement path inference**
- Given waypoints, suggest likely routes
- Consider terrain, roads, waterways
- Travel time estimation

---

## Distance and Travel

### Distance Calculations

```python
def calculate_distance(location_a, location_b, model='spherical'):
    if model == 'spherical':
        return haversine_distance(location_a, location_b)
    elif model == 'flat':
        return euclidean_distance(location_a, location_b)

def haversine_distance(a, b):
    # Standard great-circle distance
    R = 6371  # km
    # ... formula ...
    return distance_km

def euclidean_distance(a, b):
    # Flat plane distance
    return sqrt((b.x - a.x)**2 + (b.y - a.y)**2)
```

### Travel Time Estimation

For movement visualizations, estimate travel time:

```python
TRAVEL_SPEEDS = {
    'foot_march': 25,      # km/day, army on march
    'foot_fast': 40,       # km/day, forced march
    'horse_normal': 50,    # km/day
    'horse_relay': 150,    # km/day, changing horses (courier)
    'sail_coastal': 80,    # km/day, ancient sailing
    'sail_open': 120,      # km/day, favorable winds
    'river_downstream': 60, # km/day
    'river_upstream': 20,  # km/day
}

def estimate_travel_time(distance_km, mode, conditions='normal'):
    base_speed = TRAVEL_SPEEDS[mode]
    # Adjust for conditions: terrain, weather, load
    adjusted_speed = base_speed * condition_modifier(conditions)
    return distance_km / adjusted_speed
```

---

## Spatial Queries

### Find Events Near Location

```sql
-- Find events within 50km of Athens
SELECT f.*, l.name_modern, 
       calculate_distance(l.coordinate_x, l.coordinate_y, 23.7275, 37.9838) as distance_km
FROM factoids f
JOIN factoid_locations fl ON f.id = fl.factoid_id
JOIN locations l ON fl.location_id = l.id
WHERE calculate_distance(l.coordinate_x, l.coordinate_y, 23.7275, 37.9838) < 50
ORDER BY distance_km;
```

### Find Events in Region

```sql
-- Find events in "Ancient Egypt" region
SELECT f.*
FROM factoids f
JOIN factoid_locations fl ON f.id = fl.factoid_id
JOIN locations l ON fl.location_id = l.id
WHERE ST_Contains(
    (SELECT boundary_geojson FROM locations WHERE name_modern = 'Ancient Egypt'),
    ST_Point(l.coordinate_x, l.coordinate_y)
);
```

### Geographic Clustering

```sql
-- Find clusters of events (simplified)
SELECT 
    round(coordinate_x, 1) as grid_x,
    round(coordinate_y, 1) as grid_y,
    count(*) as event_count,
    array_agg(f.id) as event_ids
FROM factoids f
JOIN factoid_locations fl ON f.id = fl.factoid_id
JOIN locations l ON fl.location_id = l.id
GROUP BY grid_x, grid_y
HAVING count(*) > 5
ORDER BY event_count DESC;
```

---

## Data Import

### Modern Geographic Data

Import from:
- GeoNames (settlements, features)
- Natural Earth (coastlines, boundaries)
- OpenStreetMap (detailed features)

### Historical Geographic Data

Potential sources:
- Pleiades (ancient places) - pleiades.stoa.org
- Digital Atlas of the Roman Empire
- Pelagios network
- Historical gazettes

### Import Pipeline

```python
def import_location(source_record):
    # Check for existing match
    existing = find_matching_location(source_record)
    
    if existing:
        # Merge data, note discrepancies
        merge_location_data(existing, source_record)
    else:
        # Create new location
        create_location(source_record)
    
    # Always record provenance
    record_import_source(location_id, source_record.source)
```

---

## Lens Geographic Integration

Lenses (see 01-core-concepts.md) can include geographic bounds to filter what the user sees. This is optional - a lens studying ley lines globally wouldn't need bounds.

### Geographic Bounds in Lenses

```sql
-- From lenses table
geographic_bounds JSONB,  -- Optional bounding box or polygon
```

**Example lens configurations:**

```javascript
// Lens for a lesson on the 1683 Battle of Vienna
{
  lens_name: "Battle of Vienna 1683",
  frame_ids: ["uuid-mainstream-frame"],
  time_start: "1683-07-01",
  time_end: "1683-09-30",
  geographic_bounds: {
    type: "circle",
    center: { lat: 48.2082, lon: 16.3738 },  // Vienna
    radius_km: 200
  }
}

// Lens for global megalithic sites (no geographic restriction)
{
  lens_name: "Megalithic Mysteries",
  frame_ids: ["uuid-alternative-frame"],
  time_start: "-5000",
  time_end: "-1000",
  geographic_bounds: null  // Entire earth
}

// Lens for Mediterranean trade
{
  lens_name: "Phoenician Trade Network",
  frame_ids: ["uuid-mainstream-frame"],
  geographic_bounds: {
    type: "polygon",
    coordinates: [/* Mediterranean coastline polygon */]
  }
}
```

### How Lenses Affect Map Display

1. **View centering**: When a lens with bounds is activated, the map centers on those bounds
2. **Data filtering**: Only factoids within bounds are loaded (performance optimization)
3. **Context preservation**: Related events just outside bounds can be shown with reduced prominence
4. **No bounds = global**: Lenses without geographic_bounds show the entire map

### Location Interpretation Selection

Lenses inherit location interpretation preferences from their frames:
- Mainstream frame = mainstream location identifications
- Alternative frame = may use revised locations
- User can override per-lens if needed

This means the same lens showing "Troy" could display at Hisarlik (mainstream) or an alternative site, depending on the frame's location interpretation settings.

---

## Open Questions

- ~~**Coordinate precision**: How many decimal places to store?~~ **DECIDED**: 6 decimals (DECIMAL(12,6)) - ~0.1m precision retained for flexibility

- ~~**Base map**: What modern base map to use?~~ **DECIDED**: OpenStreetMap with desaturated "archival" styling

- **Projection for display**: What map projection for visualization? Mercator (familiar but distorted)? Equirectangular? Period-appropriate? *Currently using Web Mercator (EPSG:3857) via MapLibre default*

- **Sea level baseline**: When showing historical coastlines, what sea level datum to use?

- **Geocoding service**: For user-entered place names, what geocoding service? (Need to handle historical names too) *Consider Pleiades API for ancient places*

- ~~**Mapping library**~~: **DECIDED**: MapLibre GL JS - provides vector tiles, WebGL, overlay support, path to 3D

---

## Dependencies

- **01-core-concepts.md**: Location entity definition
- **02-data-model.md**: Schema for locations
- **04-chronology-system.md**: Temporal aspects of location changes
- **06-environmental-layer.md**: Climate and environmental data

---

## Technical Notes

### Spatial Extensions

If using PostGIS (recommended for Phase 2+):

```sql
CREATE EXTENSION postgis;

-- Add geometry column
ALTER TABLE locations ADD COLUMN geom geometry(Point, 4326);

-- Create spatial index
CREATE INDEX idx_locations_geom ON locations USING gist(geom);

-- Example spatial query
SELECT * FROM locations 
WHERE ST_DWithin(geom, ST_MakePoint(23.7275, 37.9838)::geography, 50000);
```

### Without PostGIS (MVP)

Simple distance calculation in SQL:

```sql
-- Approximate distance (flat earth, reasonable for small areas)
CREATE FUNCTION simple_distance(x1 DECIMAL, y1 DECIMAL, x2 DECIMAL, y2 DECIMAL) 
RETURNS DECIMAL AS $$
BEGIN
    RETURN 111.32 * SQRT(POWER(x2-x1, 2) + POWER((y2-y1) * COS(RADIANS(y1)), 2));
END;
$$ LANGUAGE plpgsql;
```

### Mapping Libraries

Frontend options:
- **Leaflet**: Lightweight, good for basic maps
- **MapLibre/Mapbox GL**: More powerful, vector tiles, 3D capable
- **OpenLayers**: Full-featured, complex
- **D3.js geo**: For custom visualizations

**Decision**: MapLibre GL JS selected for implementation. Provides vector tile support, WebGL rendering, historical map overlay capabilities, and a path to 3D terrain features.

---

## Implementation Status

### Completed (MVP Phase 1)

#### Frontend Components

**Map Component** (`frontend/src/components/map/history-map.tsx`)
- MapLibre GL JS integration with OpenStreetMap tiles
- Desaturated "archival" base map styling
- Factoid markers with layer-based coloring (documented/attested/inferred)
- Uncertainty circle visualization using GeoJSON polygons
- Journey route rendering with route-type styling
- Popup tooltips with factoid details
- Click handlers for factoid selection

**Map Page** (`frontend/src/app/map/page.tsx`)
- Full-screen map view with filter controls
- Layer filtering (documented, attested, inferred)
- Category filtering
- Journey route toggle
- Factoid detail panel (Sheet component)
- Legend with route type colors

**TypeScript Interfaces**:
```typescript
interface MapLocation {
  id: string
  name: string
  nameHistorical?: string
  coordinates: [number, number]  // [lng, lat]
  uncertaintyRadiusKm?: number
  locationType: 'point' | 'area' | 'linear'
  locationSubtype?: string
}

interface MapFactoid {
  id: string
  summary: string
  description?: string
  layer: 'documented' | 'attested' | 'inferred'
  confidence?: number
  location: MapLocation
  dateStart?: string
  dateEnd?: string
  category?: string
}

interface JourneyRoute {
  id: string
  name: string
  description?: string
  routeType: 'travel' | 'campaign' | 'migration' | 'trade_route' | 'pilgrimage'
  coordinates: [number, number][]
  color?: string
}

interface HistoricalMapOverlay {
  id: string
  name: string
  tileUrl: string
  bounds: [[number, number], [number, number]]
  minZoom?: number
  maxZoom?: number
  opacity?: number
}
```

#### Database Schema

**Base Migration** (`backend/migrations/002_mvp_schema.sql`)
- `locations` table with coordinates, uncertainty, type/subtype
- `factoid_locations` linking table
- Vector embeddings for semantic search
- RLS policies for public read, authenticated write

**Geographic Extensions** (`backend/migrations/004_geographic_extensions.sql`)
- Extended `locations` with boundary_geojson, location_changes, environment fields
- `location_interpretations` table for contested locations
- `historical_maps` table with georeferencing support
- `map_discrepancies` table for tracking historical/modern differences
- `journey_routes` table for route rendering
- `factoid_locations` many-to-many relationship
- `calculate_distance_km()` function supporting both spherical and flat models
- `find_locations_within_km()` spatial query function

#### Route Type Styling

| Type | Color | Style |
|------|-------|-------|
| `travel` | Gray (#6B7280) | Solid line |
| `campaign` | Red (#DC2626) | Solid line |
| `migration` | Purple (#7C3AED) | Solid line |
| `trade_route` | Amber (#D97706) | Solid line |
| `pilgrimage` | Green (#059669) | Dashed line |

#### Layer Colors (Confidence Visualization)

| Layer | Color | Meaning |
|-------|-------|---------|
| `documented` | Burgundy (#7c2d12) | Direct physical evidence |
| `attested` | Gold (#b45309) | Written sources |
| `inferred` | Gray (#6b7280) | Scholarly inference |

### Pending (Phase 2+)

- [ ] Historical map upload and georeferencing tool
- [ ] Community georectification workflow (GCP placement UI)
- [ ] Tile generation pipeline for georeferenced maps
- [ ] Time slider for temporal filtering
- [ ] Uncertainty ellipses (non-circular)
- [ ] Flat plane coordinate system toggle
- [ ] Distance comparison display (spherical vs flat)
- [ ] Animation system for journey playback
- [ ] PostGIS integration for production spatial queries
- [ ] Map clustering for dense marker regions

### Answered Questions

- **Base map**: OpenStreetMap with desaturated styling for archival aesthetic
- **Mapping library**: MapLibre GL JS (not Leaflet) - better overlay support
- **Coordinate precision**: 6 decimal places (DECIMAL(12,6)) retained per original spec

---

## Summary

The geographic system treats space the same way the chronology system treats time: as a dimension with uncertainty, change, and multiple valid perspectives. By supporting multiple coordinate systems, tracking locations over time, integrating historical maps, and being transparent about the geometric model in use, the system allows users to explore spatial history without forcing them into a single framework.

Where something was is, like when it happened, often more of a question than an answer.
