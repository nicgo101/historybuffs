-- Migration: 003_seed_data.sql
-- Seed data for HistoryBuff MVP
-- Run after schema migration

-- ============================================
-- REFERENCE FRAMES (MVP: Two frames)
-- ============================================

-- Default Academic Frame (mainstream scholarly consensus)
INSERT INTO reference_frames (
    name, slug, description, frame_type,
    trust_astronomical, trust_dendro, trust_radiometric, trust_documentary, trust_traditional,
    is_public, is_default
) VALUES (
    'Default Academic',
    'default',
    'Mainstream scholarly chronology based on conventional academic consensus. Trusts documentary and traditional sources along with scientific dating methods.',
    'system',
    TRUE, TRUE, TRUE, TRUE, TRUE,
    TRUE, TRUE
);

-- Evidence-Based Frame (scientific dating only)
INSERT INTO reference_frames (
    name, slug, description, frame_type,
    trust_astronomical, trust_dendro, trust_radiometric, trust_documentary, trust_traditional,
    is_public, is_default
) VALUES (
    'Evidence-Based',
    'evidence',
    'Conservative chronology that only trusts scientifically verifiable dating methods (astronomical calculations, dendrochronology, radiometric dating). Does not accept traditional or purely documentary dating.',
    'system',
    TRUE, TRUE, TRUE, FALSE, FALSE,
    TRUE, FALSE
);

-- ============================================
-- ACHIEVEMENTS
-- ============================================

-- Beginner achievements
INSERT INTO achievements (code, name, description, category, tier, requirement_type, requirement_config) VALUES
('first_factoid', 'First Step', 'Added your first factoid to the knowledge base', NULL, 'bronze', 'count', '{"entity_type": "factoid", "count": 1}'),
('first_source', 'Bibliophile', 'Added your first source document', NULL, 'bronze', 'count', '{"entity_type": "source", "count": 1}'),
('first_connection', 'Connector', 'Made your first connection between entities', NULL, 'bronze', 'count', '{"entity_type": "connection", "count": 1}');

-- Sourcerer achievements (source linking)
INSERT INTO achievements (code, name, description, category, tier, requirement_type, requirement_config) VALUES
('sourcerer_10', 'Novice Sourcerer', 'Linked 10 primary sources to factoids', 'sourcerer', 'bronze', 'count', '{"entity_type": "factoid_source", "count": 10}'),
('sourcerer_50', 'Sourcerer', 'Linked 50 primary sources to factoids', 'sourcerer', 'silver', 'count', '{"entity_type": "factoid_source", "count": 50}'),
('sourcerer_200', 'Master Sourcerer', 'Linked 200 primary sources to factoids', 'sourcerer', 'gold', 'count', '{"entity_type": "factoid_source", "count": 200}'),
('deep_root', 'Deep Root Finder', 'Found a root source cited by 20+ other sources', 'sourcerer', 'gold', 'special', '{"type": "citation_depth", "threshold": 20}'),
('root_exposer', 'Root Exposer', 'Revealed that a widely-cited fact traces to a single questionable source', 'sourcerer', 'special', 'special', '{"type": "critical_discovery"}');

-- Cartographer achievements (locations)
INSERT INTO achievements (code, name, description, category, tier, requirement_type, requirement_config) VALUES
('cartographer_10', 'Local Mapper', 'Documented 10 historical locations', 'cartographer', 'bronze', 'count', '{"entity_type": "location", "count": 10}'),
('cartographer_50', 'Cartographer', 'Documented 50 historical locations', 'cartographer', 'silver', 'count', '{"entity_type": "location", "count": 50}'),
('terra_incognita', 'Terra Incognita', 'First to document a location in a previously empty region', 'cartographer', 'special', 'special', '{"type": "first_in_region"}');

-- Chronologist achievements (dating and timelines)
INSERT INTO achievements (code, name, description, category, tier, requirement_type, requirement_config) VALUES
('chronologist_10', 'Time Keeper', 'Added date placements for 10 factoids', 'chronologist', 'bronze', 'count', '{"entity_type": "placement", "count": 10}'),
('chronologist_50', 'Chronologist', 'Added date placements for 50 factoids', 'chronologist', 'silver', 'count', '{"entity_type": "placement", "count": 50}'),
('gap_finder', 'Gap Finder', 'Identified a significant gap in the chronological record', 'chronologist', 'gold', 'special', '{"type": "gap_discovery"}'),
('anchor_discoverer', 'Anchor Discoverer', 'Linked a factoid to a verified astronomical or scientific anchor', 'chronologist', 'gold', 'special', '{"type": "anchor_link"}');

-- Connector achievements (relationships)
INSERT INTO achievements (code, name, description, category, tier, requirement_type, requirement_config) VALUES
('connector_10', 'Web Weaver', 'Created 10 connections between entities', 'connector', 'bronze', 'count', '{"entity_type": "connection", "count": 10}'),
('connector_50', 'Network Builder', 'Created 50 connections between entities', 'connector', 'silver', 'count', '{"entity_type": "connection", "count": 50}'),
('pattern_seer', 'Pattern Seer', 'Your connection revealed a larger historical pattern', 'connector', 'gold', 'special', '{"type": "pattern_discovery"}'),
('bridge_builder', 'Bridge Builder', 'Connected two previously unlinked clusters of knowledge', 'connector', 'special', 'special', '{"type": "cluster_bridge"}');

-- Verifier achievements (quality assurance)
INSERT INTO achievements (code, name, description, category, tier, requirement_type, requirement_config) VALUES
('verifier_10', 'Fact Checker', 'Verified 10 factoids from their sources', 'verifier', 'bronze', 'count', '{"entity_type": "verification", "count": 10}'),
('verifier_50', 'Truth Seeker', 'Verified 50 factoids from their sources', 'verifier', 'silver', 'count', '{"entity_type": "verification", "count": 50}'),
('myth_buster', 'Myth Buster', 'Identified and documented a commonly believed historical misconception', 'verifier', 'special', 'special', '{"type": "myth_bust"}');

-- Contribution milestones
INSERT INTO achievements (code, name, description, category, tier, requirement_type, requirement_config) VALUES
('contributor_100', 'Century Contributor', 'Made 100 contributions to the knowledge base', NULL, 'silver', 'count', '{"entity_type": "contribution", "count": 100}'),
('contributor_500', 'Prolific Contributor', 'Made 500 contributions to the knowledge base', NULL, 'gold', 'count', '{"entity_type": "contribution", "count": 500}'),
('contributor_1000', 'Legendary Contributor', 'Made 1000 contributions to the knowledge base', NULL, 'special', 'count', '{"entity_type": "contribution", "count": 1000}');

-- ============================================
-- CALENDAR SYSTEMS (for future use)
-- ============================================

CREATE TABLE IF NOT EXISTS calendar_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    epoch_julian_day DECIMAL(15,5),
    conversion_algorithm TEXT,
    used_by_cultures TEXT,
    period_of_use TEXT
);

INSERT INTO calendar_systems (name, description, used_by_cultures) VALUES
('gregorian', 'Modern Western calendar, adopted 1582 CE', 'Global standard'),
('julian', 'Roman calendar before Gregorian reform', 'Roman Empire, Orthodox churches'),
('byzantine', 'Eastern Roman calendar, year from creation (5509 BCE)', 'Byzantine Empire, Russia until 1700'),
('islamic', 'Hijri calendar, lunar-based from 622 CE', 'Islamic world'),
('hebrew', 'Jewish calendar, lunisolar from 3761 BCE', 'Jewish communities'),
('astronomical', 'Julian Day Number system for precise calculations', 'Astronomy, science');
