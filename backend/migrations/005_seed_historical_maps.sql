-- ============================================
-- SEED: Historical Map Overlays
-- ============================================
-- This migration seeds initial historical map overlays for testing.

-- CAWM Ancient World Base Map Tiles
-- Source: Consortium of Ancient World Mappers (University of Iowa)
-- License: CC BY 4.0
-- Coverage: Mediterranean, Near East, Ancient World
INSERT INTO historical_maps (
    id,
    name,
    description,
    raw_dating_evidence,
    creation_context,
    tile_url_template,
    region_covered,
    center_x,
    center_y,
    approximate_scale,
    bounds_sw_x,
    bounds_sw_y,
    bounds_ne_x,
    bounds_ne_y,
    min_zoom,
    max_zoom,
    is_georeferenced,
    georef_accuracy_km,
    transformation_type,
    current_location,
    projection_type,
    notable_features,
    processing_status
) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'Ancient World Physical Geography (CAWM)',
    'Base map tiles showing the physical geography of the ancient Mediterranean and Near East. Built from AWMC geophysical data by the Consortium of Ancient World Mappers at University of Iowa Libraries.',
    'Modern reconstruction based on ancient geographical sources',
    'Digital reconstruction by Ancient World Mapping Center (UNC Chapel Hill) and CAWM (University of Iowa)',
    'https://cawm.lib.uiowa.edu/tiles/{z}/{x}/{y}.png',
    'Mediterranean Basin, Near East, Ancient World',
    25.0,  -- center longitude (eastern Mediterranean)
    38.0,  -- center latitude
    'Continental',
    -15.0,  -- southwest longitude (Atlantic)
    20.0,   -- southwest latitude (Sahara)
    75.0,   -- northeast longitude (India)
    55.0,   -- northeast latitude (Northern Europe)
    2,      -- min zoom
    11,     -- max zoom
    TRUE,
    NULL,   -- accuracy not applicable for base reconstruction
    NULL,
    'Digital - University of Iowa Libraries',
    'Web Mercator (EPSG:3857)',
    'Reconstructed ancient coastlines, terrain, rivers based on historical geography scholarship. Particularly useful for Mediterranean and Near East mapping.',
    'georeferenced'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    tile_url_template = EXCLUDED.tile_url_template,
    updated_at = NOW();

-- Placeholder for future Ptolemy map (to be georeferenced via Allmaps)
-- This entry shows the structure for IIIF-based historical maps
INSERT INTO historical_maps (
    id,
    name,
    description,
    raw_dating_evidence,
    creation_context,
    tile_url_template,
    region_covered,
    center_x,
    center_y,
    approximate_scale,
    bounds_sw_x,
    bounds_sw_y,
    bounds_ne_x,
    bounds_ne_y,
    min_zoom,
    max_zoom,
    is_georeferenced,
    georef_accuracy_km,
    transformation_type,
    current_location,
    projection_type,
    notable_features,
    discrepancies_noted,
    processing_status
) VALUES (
    'a0000000-0000-0000-0000-000000000002'::uuid,
    'Ptolemy World Map (1482 Ulm Edition)',
    'World map based on Claudius Ptolemy''s Geography (c. 150 CE), from the 1482 Ulm edition. Shows the known world according to Greco-Roman geographical knowledge.',
    '1482 CE printed edition; based on 2nd century CE original',
    'Printed in Ulm, Germany, 1482. Based on Ptolemy''s Geographia written c. 150 CE in Alexandria.',
    NULL,  -- To be filled after Allmaps georeferencing
    'Mediterranean, Europe, Africa, Asia (known world c. 150 CE)',
    35.0,  -- approximate center
    35.0,
    'World (as known to ancients)',
    -20.0,
    -35.0,
    180.0,
    70.0,
    3,
    10,
    FALSE,  -- Not yet georeferenced
    50.0,   -- Expected accuracy ~50km given ancient cartography
    NULL,
    'David Rumsey Map Collection / Stanford Libraries',
    'Ptolemaic projection (modified conic)',
    'First use of latitude/longitude grid system. Shows Mediterranean, Indian Ocean as enclosed seas. Terra Incognita in south.',
    'Indian Ocean shown as enclosed sea. Africa extends too far east. No Americas. Caspian Sea orientation incorrect.',
    'pending'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();
