-- Migration: Add Expertise & Skill Tree Tables (CR-02)

-- Create new enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProficiencyLevel') THEN
    CREATE TYPE "ProficiencyLevel" AS ENUM ('FOUNDATION', 'INTERMEDIATE', 'ADVANCED', 'SPECIALIST');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MappingSource') THEN
    CREATE TYPE "MappingSource" AS ENUM ('MANUAL', 'SUGGESTED');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AssetType') THEN
    CREATE TYPE "AssetType" AS ENUM ('OUTLINE', 'SAMPLE', 'CASE_STUDY', 'LINK');
  END IF;
END $$;

-- Create expertise_nodes table
CREATE TABLE IF NOT EXISTS expertise_nodes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  parent_id TEXT REFERENCES expertise_nodes(id) ON DELETE CASCADE,
  domain VARCHAR(50),
  depth INTEGER DEFAULT 1,
  proficiency_level "ProficiencyLevel" DEFAULT 'FOUNDATION',
  visibility "Visibility" DEFAULT 'PUBLIC',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for expertise_nodes
CREATE INDEX IF NOT EXISTS idx_expertise_nodes_slug ON expertise_nodes(slug);
CREATE INDEX IF NOT EXISTS idx_expertise_nodes_parent ON expertise_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_expertise_nodes_visibility ON expertise_nodes(visibility);
CREATE INDEX IF NOT EXISTS idx_expertise_nodes_domain ON expertise_nodes(domain);
CREATE INDEX IF NOT EXISTS idx_expertise_nodes_display_order ON expertise_nodes(display_order);

-- Create badge_expertise_map junction table
CREATE TABLE IF NOT EXISTS badge_expertise_map (
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  expertise_node_id TEXT NOT NULL REFERENCES expertise_nodes(id) ON DELETE CASCADE,
  mapping_source "MappingSource" DEFAULT 'MANUAL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (badge_id, expertise_node_id)
);

-- Create indexes for badge_expertise_map
CREATE INDEX IF NOT EXISTS idx_badge_expertise_map_badge ON badge_expertise_map(badge_id);
CREATE INDEX IF NOT EXISTS idx_badge_expertise_map_node ON badge_expertise_map(expertise_node_id);

-- Create expertise_assets table
CREATE TABLE IF NOT EXISTS expertise_assets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  expertise_node_id TEXT NOT NULL REFERENCES expertise_nodes(id) ON DELETE CASCADE,
  asset_type "AssetType" NOT NULL,
  title VARCHAR(100) NOT NULL,
  url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for expertise_assets
CREATE INDEX IF NOT EXISTS idx_expertise_assets_node ON expertise_assets(expertise_node_id);

-- Create trigger for updated_at on expertise_nodes
CREATE OR REPLACE FUNCTION update_expertise_nodes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_expertise_nodes_updated_at ON expertise_nodes;
CREATE TRIGGER update_expertise_nodes_updated_at
  BEFORE UPDATE ON expertise_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_expertise_nodes_updated_at();
