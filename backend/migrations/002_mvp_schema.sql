-- Migration: 002_mvp_schema.sql
-- HistoryBuff MVP Database Schema
--
-- Design principles:
-- - Frame-dependent dating via placements (no dates stored directly on factoids)
-- - Raw observations stored separately from interpretations
-- - Source linkage on all claims
-- - Soft deletes (nothing truly deleted)
-- - Full audit trail
-- - Vector embeddings for semantic search (384 dimensions for all-MiniLM-L6-v2)

-- ============================================
-- USERS
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Auth (links to Supabase auth.users)
    auth_id UUID UNIQUE,

    -- Profile
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,

    -- Preferences
    default_frame_id UUID, -- Set after reference_frames created

    -- Stats (cached)
    contribution_count INTEGER DEFAULT 0,
    verification_count INTEGER DEFAULT 0,
    reputation_score DECIMAL(10,2) DEFAULT 0,

    -- Roles
    is_admin BOOLEAN DEFAULT FALSE,
    is_verified_researcher BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_auth ON users(auth_id);
CREATE INDEX idx_users_reputation ON users(reputation_score DESC);

-- ============================================
-- REFERENCE FRAMES
-- ============================================

CREATE TABLE reference_frames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    description TEXT,

    -- Frame type: system (built-in), community, user
    frame_type VARCHAR(30) NOT NULL DEFAULT 'user',

    -- Configuration
    calendar_system VARCHAR(30) DEFAULT 'gregorian',
    epoch_offset_years INTEGER DEFAULT 0,

    -- Anchor trust settings
    trust_astronomical BOOLEAN DEFAULT TRUE,
    trust_dendro BOOLEAN DEFAULT TRUE,
    trust_radiometric BOOLEAN DEFAULT TRUE,
    trust_documentary BOOLEAN DEFAULT FALSE,
    trust_traditional BOOLEAN DEFAULT FALSE,

    -- Visibility
    is_public BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_frames_type ON reference_frames(frame_type);
CREATE INDEX idx_frames_public ON reference_frames(is_public);
CREATE INDEX idx_frames_default ON reference_frames(is_default) WHERE is_default = TRUE;

-- Add foreign key for users.default_frame_id
ALTER TABLE users ADD CONSTRAINT fk_users_default_frame
    FOREIGN KEY (default_frame_id) REFERENCES reference_frames(id);

-- ============================================
-- ACTORS (People, Institutions, Groups)
-- ============================================

CREATE TABLE actors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name_primary TEXT NOT NULL,
    name_aliases JSONB DEFAULT '[]',

    -- Classification
    actor_type VARCHAR(30) NOT NULL, -- person, family, institution, group
    actor_subtype VARCHAR(50),

    -- Raw temporal evidence (frame-independent)
    raw_temporal_evidence TEXT,

    -- Description
    description TEXT,

    -- Bias tracking (for authors)
    known_biases TEXT,
    political_position TEXT,

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Vector embedding (384 dims for all-MiniLM-L6-v2)
    embedding VECTOR(384)
);

CREATE INDEX idx_actors_type ON actors(actor_type);
CREATE INDEX idx_actors_name ON actors USING gin(to_tsvector('english', name_primary));
CREATE INDEX idx_actors_embedding ON actors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- LOCATIONS
-- ============================================

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name_modern TEXT,
    name_historical JSONB DEFAULT '[]',

    -- Classification
    location_type VARCHAR(30) NOT NULL, -- point, area, linear
    location_subtype VARCHAR(50),

    -- Coordinates
    coordinate_x DECIMAL(12,6), -- longitude
    coordinate_y DECIMAL(12,6), -- latitude
    coordinate_system VARCHAR(30) DEFAULT 'wgs84',
    uncertainty_radius_km DECIMAL(10,2),

    -- Description
    description TEXT,

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Vector embedding
    embedding VECTOR(384)
);

CREATE INDEX idx_locations_coords ON locations(coordinate_x, coordinate_y);
CREATE INDEX idx_locations_type ON locations(location_type);
CREATE INDEX idx_locations_name ON locations USING gin(to_tsvector('english', COALESCE(name_modern, '')));

-- ============================================
-- SOURCES
-- ============================================

CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    title TEXT NOT NULL,
    author_id UUID REFERENCES actors(id),

    -- Classification
    source_type VARCHAR(30) NOT NULL, -- primary, secondary, tertiary
    genre VARCHAR(50),

    -- Raw dating evidence (frame-independent)
    raw_dating_evidence TEXT,
    raw_period_covered TEXT,

    -- Characteristics
    author_stake VARCHAR(20), -- none, low, medium, high, extreme
    intended_audience VARCHAR(30),
    survival_path VARCHAR(30),

    -- Language
    original_language VARCHAR(50),
    translation_id UUID REFERENCES sources(id),
    edition_notes TEXT,

    -- Storage
    archive_location TEXT,
    digital_url TEXT,
    full_text_storage_ref TEXT,

    -- Processing status
    extraction_status VARCHAR(20) DEFAULT 'pending',
    extraction_model TEXT,

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Vector embedding
    embedding VECTOR(384)
);

CREATE INDEX idx_sources_type ON sources(source_type);
CREATE INDEX idx_sources_genre ON sources(genre);
CREATE INDEX idx_sources_author ON sources(author_id);
CREATE INDEX idx_sources_fts ON sources USING gin(to_tsvector('english', title));

-- ============================================
-- SOURCE CITATIONS (Citation Tree)
-- ============================================

CREATE TABLE source_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    citing_source_id UUID NOT NULL REFERENCES sources(id),
    cited_source_id UUID NOT NULL REFERENCES sources(id),

    citation_type VARCHAR(30) NOT NULL, -- direct_quote, paraphrase, refers_to, based_on

    -- Location in citing source
    page_reference TEXT,
    section_reference TEXT,
    quote_excerpt TEXT,

    -- Independence assessment
    independence_verified BOOLEAN DEFAULT FALSE,
    independence_score DECIMAL(3,2),
    independence_notes TEXT,

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_citation UNIQUE(citing_source_id, cited_source_id)
);

CREATE INDEX idx_citations_citing ON source_citations(citing_source_id);
CREATE INDEX idx_citations_cited ON source_citations(cited_source_id);

-- ============================================
-- FACTOIDS (Core Data - Frame Independent)
-- ============================================

CREATE TABLE factoids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Content (frame-independent core data)
    description TEXT NOT NULL,
    summary TEXT,
    factoid_type VARCHAR(50) NOT NULL, -- event, relationship, description, claim, observation

    -- Raw observation (what we actually see/know)
    raw_observation TEXT,
    raw_observation_type VARCHAR(30), -- inscription, physical_test, document_text, artifact, witness

    -- Epistemological layer
    layer VARCHAR(20) NOT NULL DEFAULT 'attested', -- documented, attested, traditional, theoretical, speculative

    -- Confidence (calculated, cached)
    community_confidence DECIMAL(3,2),
    core_confidence DECIMAL(3,2),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, sourced, verified, disputed, rejected

    -- Extraction (if AI-extracted)
    extraction_location TEXT,
    extraction_confidence DECIMAL(3,2),
    extraction_verified BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Vector embedding
    embedding VECTOR(384)
);

CREATE INDEX idx_factoids_layer ON factoids(layer);
CREATE INDEX idx_factoids_status ON factoids(status);
CREATE INDEX idx_factoids_type ON factoids(factoid_type);
CREATE INDEX idx_factoids_fts ON factoids USING gin(to_tsvector('english', description));
CREATE INDEX idx_factoids_embedding ON factoids USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- FACTOID PLACEMENTS (Frame-Dependent Dates)
-- ============================================

CREATE TABLE factoid_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    factoid_id UUID NOT NULL REFERENCES factoids(id),
    frame_id UUID NOT NULL REFERENCES reference_frames(id),

    -- Temporal position in this frame
    date_start DATE,
    date_end DATE,
    date_precision VARCHAR(20), -- exact, year, decade, century, millennium

    -- Confidence in this specific placement
    placement_confidence DECIMAL(3,2),

    -- Reasoning
    reasoning TEXT,

    -- Who placed it
    placed_by UUID REFERENCES users(id),
    placed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Type: system (official), community (consensus), user (personal)
    placement_type VARCHAR(20) DEFAULT 'user',

    -- Metadata
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_placements_factoid ON factoid_placements(factoid_id);
CREATE INDEX idx_placements_frame ON factoid_placements(frame_id);
CREATE INDEX idx_placements_dates ON factoid_placements(date_start, date_end);
CREATE INDEX idx_placements_type ON factoid_placements(placement_type);
CREATE INDEX idx_placements_frame_date ON factoid_placements(frame_id, date_start, date_end);

-- Unique constraint for system/community placements per factoid per frame
CREATE UNIQUE INDEX idx_placements_system_unique
    ON factoid_placements(factoid_id, frame_id)
    WHERE placement_type IN ('system', 'community') AND deleted_at IS NULL;

-- ============================================
-- FACTOID-SOURCE LINKS
-- ============================================

CREATE TABLE factoid_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    factoid_id UUID NOT NULL REFERENCES factoids(id),
    source_id UUID NOT NULL REFERENCES sources(id),

    -- How this source relates to the factoid
    relationship VARCHAR(30) NOT NULL, -- supports, contradicts, mentions, primary_source

    -- Location in source
    page_reference TEXT,
    section_reference TEXT,
    relevant_excerpt TEXT,

    -- Author's attribution
    author_attribution VARCHAR(50), -- i_saw, priests_said, greeks_say, it_is_said, unattributed

    -- Confidence contribution
    confidence_weight DECIMAL(3,2) DEFAULT 1.00,

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,

    CONSTRAINT unique_factoid_source UNIQUE(factoid_id, source_id)
);

CREATE INDEX idx_factoid_sources_factoid ON factoid_sources(factoid_id);
CREATE INDEX idx_factoid_sources_source ON factoid_sources(source_id);

-- ============================================
-- CONNECTIONS (Entity Relationships)
-- ============================================

CREATE TABLE connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Endpoints (polymorphic)
    from_entity_type VARCHAR(30) NOT NULL, -- factoid, actor, artifact, location, source
    from_entity_id UUID NOT NULL,
    to_entity_type VARCHAR(30) NOT NULL,
    to_entity_id UUID NOT NULL,

    -- Relationship type
    connection_type VARCHAR(50) NOT NULL,
    -- temporal: preceded_by, followed_by, contemporary_with, during, caused
    -- spatial: located_at, traveled_to, near, part_of
    -- evidential: supports, contradicts, cites, corroborates
    -- creative: built, destroyed, wrote, owned

    -- Temporal delta (for relational time)
    delta_value INTEGER,
    delta_unit VARCHAR(20), -- days, years, generations, reigns
    delta_confidence VARCHAR(20),

    -- Evidence
    source_ids UUID[] DEFAULT '{}',
    confidence DECIMAL(3,2),
    notes TEXT,

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_connections_from ON connections(from_entity_type, from_entity_id);
CREATE INDEX idx_connections_to ON connections(to_entity_type, to_entity_id);
CREATE INDEX idx_connections_type ON connections(connection_type);

-- ============================================
-- ACTOR RELATIONSHIPS
-- ============================================

CREATE TABLE actor_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    from_actor_id UUID NOT NULL REFERENCES actors(id),
    to_actor_id UUID NOT NULL REFERENCES actors(id),

    relationship_type VARCHAR(50) NOT NULL,
    -- parent_of, child_of, spouse_of, sibling_of,
    -- ruled, served, employed_by, member_of,
    -- allied_with, opposed_to, influenced_by, succeeded

    -- Temporal bounds (frame-independent raw evidence)
    date_start DATE,
    date_end DATE,

    -- Evidence
    source_ids UUID[] DEFAULT '{}',
    confidence DECIMAL(3,2),
    notes TEXT,

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_actor_rel_from ON actor_relationships(from_actor_id);
CREATE INDEX idx_actor_rel_to ON actor_relationships(to_actor_id);
CREATE INDEX idx_actor_rel_type ON actor_relationships(relationship_type);

-- ============================================
-- CONTRIBUTIONS (Audit Log)
-- ============================================

CREATE TABLE contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id),

    -- What was contributed
    entity_type VARCHAR(30) NOT NULL, -- factoid, source, actor, location, connection
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- create, update, verify, challenge, delete

    -- Details
    changes JSONB,
    notes TEXT,

    -- Gamification
    contribution_type VARCHAR(50),
    points_earned INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contributions_user ON contributions(user_id);
CREATE INDEX idx_contributions_entity ON contributions(entity_type, entity_id);
CREATE INDEX idx_contributions_time ON contributions(created_at DESC);

-- ============================================
-- ACHIEVEMENTS (Gamification)
-- ============================================

CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Definition
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,

    -- Category
    category VARCHAR(30), -- sourcerer, cartographer, chronologist, connector, verifier
    tier VARCHAR(20), -- bronze, silver, gold, special

    -- Requirements
    requirement_type VARCHAR(30), -- count, threshold, special
    requirement_config JSONB,

    -- Stats
    times_granted INTEGER DEFAULT 0
);

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id),
    achievement_id UUID NOT NULL REFERENCES achievements(id),

    -- Context
    earned_for_entity_type VARCHAR(30),
    earned_for_entity_id UUID,
    notes TEXT,

    earned_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_achievement UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE factoids ENABLE ROW LEVEL SECURITY;
ALTER TABLE factoid_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE factoid_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE actor_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Public read for main content tables
CREATE POLICY "Public read factoids" ON factoids FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Public read sources" ON sources FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Public read actors" ON actors FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Public read locations" ON locations FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Public read placements" ON factoid_placements FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Public read factoid_sources" ON factoid_sources FOR SELECT USING (true);
CREATE POLICY "Public read source_citations" ON source_citations FOR SELECT USING (true);
CREATE POLICY "Public read connections" ON connections FOR SELECT USING (true);
CREATE POLICY "Public read actor_relationships" ON actor_relationships FOR SELECT USING (true);
CREATE POLICY "Public read frames" ON reference_frames FOR SELECT USING (deleted_at IS NULL AND (is_public = TRUE OR frame_type = 'system'));
CREATE POLICY "Public read achievements" ON achievements FOR SELECT USING (true);

-- Users can read their own data
CREATE POLICY "Users read own profile" ON users FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "Users read own contributions" ON contributions FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);
CREATE POLICY "Users read own achievements" ON user_achievements FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Authenticated users can create content
CREATE POLICY "Authenticated create factoids" ON factoids FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated create sources" ON sources FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated create actors" ON actors FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated create locations" ON locations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated create placements" ON factoid_placements FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated create factoid_sources" ON factoid_sources FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated create source_citations" ON source_citations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated create connections" ON connections FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated create actor_relationships" ON actor_relationships FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own contributions
CREATE POLICY "Owner update factoids" ON factoids FOR UPDATE
    USING (created_by IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Owner update sources" ON sources FOR UPDATE
    USING (created_by IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Owner update actors" ON actors FOR UPDATE
    USING (created_by IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Owner update locations" ON locations FOR UPDATE
    USING (created_by IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Users can update their own profile
CREATE POLICY "Users update own profile" ON users FOR UPDATE
    USING (auth.uid() = auth_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_id, username, display_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_frames_updated_at BEFORE UPDATE ON reference_frames
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_actors_updated_at BEFORE UPDATE ON actors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_factoids_updated_at BEFORE UPDATE ON factoids
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_placements_updated_at BEFORE UPDATE ON factoid_placements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
