-- Migration: 004_geographic_extensions.sql
-- Geographic System Extensions
--
-- Extends the base locations table with:
-- - Location interpretations (contested/uncertain positions)
-- - Historical maps with georeferencing
-- - Temporal location changes
-- - Journey routes from event chains
-- - Environment metadata

-- ============================================
-- EXTEND LOCATIONS TABLE
-- ============================================

-- Add missing columns to locations table
ALTER TABLE locations ADD COLUMN IF NOT EXISTS uncertainty_notes TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS boundary_geojson JSONB;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS location_changes JSONB DEFAULT '[]';
-- [{period: "pre-1000 BCE", coordinates: {x, y}, description: "Original position"}]

ALTER TABLE locations ADD COLUMN IF NOT EXISTS climate_notes TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS terrain_notes TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS elevation_m INTEGER;

-- ============================================
-- LOCATION INTERPRETATIONS
-- ============================================
-- Multiple theories for the same historical location
-- e.g., Troy could be Hisarlik (mainstream) or alternative sites

CREATE TABLE location_interpretations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,

    -- Interpretation details
    interpretation_name VARCHAR(200) NOT NULL,
    -- "Traditional identification", "Revised by Smith 2015", etc.

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
    confidence_level VARCHAR(20), -- certain, probable, possible, speculative
    is_mainstream BOOLEAN DEFAULT FALSE,
    is_contested BOOLEAN DEFAULT FALSE,

    -- Metadata
    proposed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_loc_interp_location ON location_interpretations(location_id);
CREATE INDEX idx_loc_interp_mainstream ON location_interpretations(is_mainstream) WHERE is_mainstream = TRUE;
CREATE INDEX idx_loc_interp_confidence ON location_interpretations(confidence_level);

-- ============================================
-- HISTORICAL MAPS
-- ============================================
-- Storage for historical maps with georeferencing data

CREATE TABLE historical_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name TEXT NOT NULL,
    description TEXT,
    author_id UUID REFERENCES actors(id),

    -- Raw dating evidence (frame-independent)
    raw_dating_evidence TEXT,
    creation_context TEXT,

    -- Content storage
    image_storage_ref TEXT,  -- Supabase storage reference for high-res
    thumbnail_storage_ref TEXT,
    tile_url_template TEXT,  -- For georeferenced tiles: {z}/{x}/{y}.png

    -- Geographic scope
    region_covered TEXT,
    center_x DECIMAL(12,6),  -- center longitude
    center_y DECIMAL(12,6),  -- center latitude
    approximate_scale TEXT,

    -- Bounds (for tile serving)
    bounds_sw_x DECIMAL(12,6),  -- southwest longitude
    bounds_sw_y DECIMAL(12,6),  -- southwest latitude
    bounds_ne_x DECIMAL(12,6),  -- northeast longitude
    bounds_ne_y DECIMAL(12,6),  -- northeast latitude
    min_zoom INTEGER DEFAULT 0,
    max_zoom INTEGER DEFAULT 18,

    -- Georeferencing status
    is_georeferenced BOOLEAN DEFAULT FALSE,
    georef_accuracy_km DECIMAL(10,2),
    transformation_type VARCHAR(30), -- affine, polynomial-2, thin-plate-spline

    -- Control points for georeferencing
    control_points JSONB DEFAULT '[]',
    -- [{historical_x, historical_y, modern_lat, modern_lon, confidence, location_name}]

    -- Source linkage
    source_id UUID REFERENCES sources(id),
    current_location TEXT,  -- where is original held (museum, archive)

    -- Analysis
    projection_type TEXT,  -- if identifiable
    notable_features TEXT,
    discrepancies_noted TEXT,  -- where it differs from modern geography

    -- Processing status
    processing_status VARCHAR(20) DEFAULT 'pending',
    -- pending, processing, georeferenced, failed

    -- Metadata
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_hist_maps_georef ON historical_maps(is_georeferenced);
CREATE INDEX idx_hist_maps_region ON historical_maps USING gin(to_tsvector('english', COALESCE(region_covered, '')));
CREATE INDEX idx_hist_maps_bounds ON historical_maps(bounds_sw_x, bounds_sw_y, bounds_ne_x, bounds_ne_y);

-- ============================================
-- MAP DISCREPANCIES
-- ============================================
-- Track where historical maps differ from modern geography

CREATE TABLE map_discrepancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    historical_map_id UUID NOT NULL REFERENCES historical_maps(id) ON DELETE CASCADE,

    -- Discrepancy details
    discrepancy_type VARCHAR(30) NOT NULL, -- distance, coastline, position, feature
    region TEXT,
    description TEXT NOT NULL,

    -- Measurements (optional)
    modern_value TEXT,
    historical_value TEXT,

    -- Possible explanations
    possible_reasons JSONB DEFAULT '[]',
    -- ["Sea level change", "Sedimentation", "Map inaccuracy"]

    -- Metadata
    reported_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_map_discrepancies_map ON map_discrepancies(historical_map_id);
CREATE INDEX idx_map_discrepancies_type ON map_discrepancies(discrepancy_type);

-- ============================================
-- EVENT CHAINS (Journey Extensions)
-- ============================================
-- Add journey-related fields to support geographic route rendering
-- This assumes an event_chains table exists or will be created

-- For MVP, we create a simple journey_routes table that can link to factoids
CREATE TABLE journey_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name TEXT NOT NULL,
    description TEXT,

    -- Route type determines rendering style
    route_type VARCHAR(30) NOT NULL,
    -- travel, campaign, migration, trade_route, pilgrimage

    -- Mode of travel
    travel_mode VARCHAR(30), -- foot, horse, ship, mixed

    -- Start/end locations
    start_location_id UUID REFERENCES locations(id),
    end_location_id UUID REFERENCES locations(id),

    -- Waypoints as ordered array of location IDs with sequence
    waypoints JSONB DEFAULT '[]',
    -- [{location_id: "uuid", sequence: 1, arrival_note: "stayed 3 days"}]

    -- Full route coordinates for rendering (GeoJSON LineString)
    route_geojson JSONB,

    -- Temporal bounds (raw evidence)
    raw_temporal_evidence TEXT,
    total_duration TEXT,  -- "16 months", "3 years"

    -- Visual customization
    color VARCHAR(20),
    line_style VARCHAR(20) DEFAULT 'solid', -- solid, dashed, dotted

    -- Linkage
    source_ids UUID[] DEFAULT '{}',
    related_factoid_ids UUID[] DEFAULT '{}',

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_journey_routes_type ON journey_routes(route_type);
CREATE INDEX idx_journey_routes_start ON journey_routes(start_location_id);
CREATE INDEX idx_journey_routes_end ON journey_routes(end_location_id);

-- ============================================
-- FACTOID-LOCATION LINKS
-- ============================================
-- Many-to-many relationship between factoids and locations

CREATE TABLE factoid_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    factoid_id UUID NOT NULL REFERENCES factoids(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,

    -- Relationship type
    relationship VARCHAR(30) NOT NULL DEFAULT 'occurred_at',
    -- occurred_at, mentioned, originated_from, destination, affects

    -- Which interpretation to use (optional)
    interpretation_id UUID REFERENCES location_interpretations(id),

    -- Override uncertainty for this specific factoid
    uncertainty_radius_km_override DECIMAL(10,2),

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_factoid_location UNIQUE(factoid_id, location_id, relationship)
);

CREATE INDEX idx_factoid_locations_factoid ON factoid_locations(factoid_id);
CREATE INDEX idx_factoid_locations_location ON factoid_locations(location_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE location_interpretations ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_discrepancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE factoid_locations ENABLE ROW LEVEL SECURITY;

-- Public read for all geographic data
CREATE POLICY "Public read location_interpretations" ON location_interpretations
    FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Public read historical_maps" ON historical_maps
    FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Public read map_discrepancies" ON map_discrepancies
    FOR SELECT USING (true);
CREATE POLICY "Public read journey_routes" ON journey_routes
    FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Public read factoid_locations" ON factoid_locations
    FOR SELECT USING (true);

-- Authenticated users can create content
CREATE POLICY "Authenticated create location_interpretations" ON location_interpretations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated create historical_maps" ON historical_maps
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated create map_discrepancies" ON map_discrepancies
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated create journey_routes" ON journey_routes
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated create factoid_locations" ON factoid_locations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own contributions
CREATE POLICY "Owner update location_interpretations" ON location_interpretations
    FOR UPDATE USING (proposed_by IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Owner update historical_maps" ON historical_maps
    FOR UPDATE USING (uploaded_by IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Owner update journey_routes" ON journey_routes
    FOR UPDATE USING (created_by IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_location_interpretations_updated_at
    BEFORE UPDATE ON location_interpretations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_historical_maps_updated_at
    BEFORE UPDATE ON historical_maps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_journey_routes_updated_at
    BEFORE UPDATE ON journey_routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Simple distance calculation (flat earth approximation for small distances)
-- For MVP - can be replaced with PostGIS for production
CREATE OR REPLACE FUNCTION calculate_distance_km(
    x1 DECIMAL, y1 DECIMAL,
    x2 DECIMAL, y2 DECIMAL,
    model VARCHAR DEFAULT 'spherical'
) RETURNS DECIMAL AS $$
DECLARE
    R DECIMAL := 6371; -- Earth radius in km
    lat1_rad DECIMAL;
    lat2_rad DECIMAL;
    delta_lat DECIMAL;
    delta_lon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    IF model = 'flat' THEN
        -- Flat plane Euclidean distance (assumes coordinates are in km)
        RETURN SQRT(POWER(x2 - x1, 2) + POWER(y2 - y1, 2));
    ELSE
        -- Haversine formula for spherical model
        lat1_rad := RADIANS(y1);
        lat2_rad := RADIANS(y2);
        delta_lat := RADIANS(y2 - y1);
        delta_lon := RADIANS(x2 - x1);

        a := SIN(delta_lat/2) * SIN(delta_lat/2) +
             COS(lat1_rad) * COS(lat2_rad) *
             SIN(delta_lon/2) * SIN(delta_lon/2);
        c := 2 * ATAN2(SQRT(a), SQRT(1-a));

        RETURN R * c;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find locations within radius
CREATE OR REPLACE FUNCTION find_locations_within_km(
    center_x DECIMAL,
    center_y DECIMAL,
    radius_km DECIMAL,
    model VARCHAR DEFAULT 'spherical'
) RETURNS TABLE(
    location_id UUID,
    name_modern TEXT,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.name_modern,
        calculate_distance_km(center_x, center_y, l.coordinate_x, l.coordinate_y, model) as dist
    FROM locations l
    WHERE l.deleted_at IS NULL
      AND l.coordinate_x IS NOT NULL
      AND l.coordinate_y IS NOT NULL
      AND calculate_distance_km(center_x, center_y, l.coordinate_x, l.coordinate_y, model) <= radius_km
    ORDER BY dist;
END;
$$ LANGUAGE plpgsql STABLE;
