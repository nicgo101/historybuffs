# Historical Maps Workflow

This document describes how to add historical map overlays to HistoryBuff using IIIF sources and the Allmaps georeferencing service.

## Overview

Historical maps can be displayed as overlays on the modern map, allowing users to compare ancient cartography with current geography. This is done through:

1. **IIIF (International Image Interoperability Framework)** - Standard for serving high-resolution images from libraries/museums
2. **Allmaps** - Service that georeferences IIIF maps and generates XYZ tiles
3. **MapLibre GL JS** - Renders the georeferenced tiles as overlays

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  IIIF Source (David Rumsey, LOC, etc.)                      │
│  └── High-resolution map image with manifest                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Allmaps Editor (allmaps.org)                               │
│  └── Add control points to align map to coordinates         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Allmaps Tile Server (allmaps.xyz)                          │
│  └── Generates XYZ tiles: https://allmaps.xyz/maps/{id}/... │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  HistoryBuff Database (historical_maps table)               │
│  └── Stores tile URL, bounds, metadata                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  MapLibre GL JS                                             │
│  └── Renders tiles as raster overlay on map                 │
└─────────────────────────────────────────────────────────────┘
```

## Step-by-Step Workflow

### 1. Find a IIIF Map Source

Good sources for historical maps with IIIF support:

| Source | URL | Coverage |
|--------|-----|----------|
| **David Rumsey** | davidrumsey.com | 143,000+ maps, 16th-21st century |
| **Library of Congress** | loc.gov/maps | 6 million items, world's largest |
| **Europeana** | europeana.eu | Medieval to modern European maps |
| **Gallica (BnF)** | gallica.bnf.fr | French historical maps |
| **British Library** | bl.uk | King's Topographical Collection |

### 2. Get the IIIF Manifest URL

For **David Rumsey**:
1. Navigate to the map page
2. Click the "Share" button
3. Copy the IIIF manifest link (ends in `/manifest.json` or similar)

Example: `https://www.davidrumsey.com/luna/servlet/iiif/m/RUMSEY~8~1~273927~90047232/manifest`

### 3. Georeference in Allmaps

1. Go to [Allmaps Editor](https://editor.allmaps.org/)
2. Paste the IIIF manifest URL
3. Add **control points** (minimum 3, recommended 6+):
   - Click a point on the historical map
   - Enter the corresponding modern coordinates (lat/lng)
   - Repeat for landmarks you can identify on both maps
4. Save the georeference annotation

**Tips for Control Points:**
- Use coastlines, river confluences, prominent capes
- Spread points across the map (not just center)
- Use recognizable ancient cities that still exist (Rome, Athens, Alexandria)

### 4. Get the XYZ Tile URL

After georeferencing:
1. Click "Results" in Allmaps Editor
2. Copy the tile URL, which looks like:
   ```
   https://allmaps.xyz/maps/715335f6fe028242/{z}/{x}/{y}.png
   ```

### 5. Add to HistoryBuff Database

Insert into the `historical_maps` table:

```sql
INSERT INTO historical_maps (
    name,
    description,
    raw_dating_evidence,
    tile_url_template,
    region_covered,
    center_x,
    center_y,
    bounds_sw_x, bounds_sw_y,
    bounds_ne_x, bounds_ne_y,
    min_zoom,
    max_zoom,
    is_georeferenced,
    georef_accuracy_km,
    current_location,
    projection_type,
    notable_features,
    discrepancies_noted,
    processing_status
) VALUES (
    'Ptolemy World Map (1482 Ulm Edition)',
    'World map based on Claudius Ptolemy''s Geography',
    '1482 CE printed edition; based on 2nd century CE original',
    'https://allmaps.xyz/maps/YOUR_MAP_ID/{z}/{x}/{y}.png',
    'Mediterranean, known ancient world',
    35.0, 35.0,
    -20.0, -35.0,
    180.0, 70.0,
    3, 10,
    TRUE,
    50.0,
    'David Rumsey Map Collection',
    'Ptolemaic projection',
    'First lat/long grid system, shows known world c. 150 CE',
    'Indian Ocean as enclosed sea, no Americas',
    'georeferenced'
);
```

## Available Base Layers

### CAWM Ancient World Tiles

Pre-rendered base layer for the ancient Mediterranean:

```
URL: https://cawm.lib.uiowa.edu/tiles/{z}/{x}/{y}.png
Coverage: Mediterranean, Near East
Zoom: 2-11
License: CC BY 4.0
```

This shows reconstructed ancient geography (coastlines, terrain) and is useful as a base layer for ancient world mapping.

## Database Schema

The `historical_maps` table stores:

| Field | Description |
|-------|-------------|
| `tile_url_template` | XYZ tile URL with `{z}/{x}/{y}` placeholders |
| `bounds_*` | Geographic bounds (SW/NE corners) |
| `min_zoom`, `max_zoom` | Valid zoom range |
| `is_georeferenced` | Whether ready to display |
| `georef_accuracy_km` | Estimated accuracy in km |
| `control_points` | JSON array of georeferencing points |
| `discrepancies_noted` | Where historical map differs from reality |

## Frontend Implementation

The `HistoryMap` component automatically renders overlays:

```tsx
<HistoryMap
  historicalOverlays={overlays}  // From useMapData hook
  // ...other props
/>
```

Overlays are rendered as raster layers above the base map tiles but below markers/clusters.

## Recommended Historical Maps

For **Ancient World / Mediterranean**:

1. **Ptolemy's Geography maps** (various editions 1477-1600)
2. **Peutinger Map** (medieval copy of Roman road map)
3. **Tabula Rogeriana** (Al-Idrisi, 1154)
4. **Abraham Ortelius** - Theatrum Orbis Terrarum (1570)

For **Biblical Geography**:

1. Heinrich Bunting maps (1581)
2. Nicolas Sanson biblical maps (17th century)
3. Various Holy Land maps from pilgrim accounts

## Resources

- [Allmaps Documentation](https://allmaps.org/)
- [IIIF Guides](https://iiif.io/guides/)
- [David Rumsey Collection](https://www.davidrumsey.com/)
- [AWMC GIS Data](https://awmc.unc.edu/gis-data/)
- [CAWM Tile Server](https://cawm.lib.uiowa.edu/)

## License Considerations

- Most historical maps from major libraries are public domain
- Allmaps service is free and open
- CAWM tiles: CC BY 4.0
- Always check specific map licensing before use
