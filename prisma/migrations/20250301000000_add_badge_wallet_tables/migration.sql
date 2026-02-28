-- Migration: Add Badge Wallet and Skills Wallet tables (CR-01)

-- Create Visibility enum type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility') THEN
    CREATE TYPE visibility AS ENUM ('PUBLIC', 'HIDDEN');
  END IF;
END $$;

-- Add new columns to badges table (if they don't exist)
DO $$
BEGIN
  -- Add columns one by one with existence checks
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='badges' AND column_name='title') THEN
    ALTER TABLE badges ADD COLUMN title VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='badges' AND column_name='slug') THEN
    ALTER TABLE badges ADD COLUMN slug VARCHAR(100);
    CREATE UNIQUE INDEX idx_badges_slug ON badges(slug) WHERE slug IS NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='badges' AND column_name='expiry_date') THEN
    ALTER TABLE badges ADD COLUMN expiry_date TIMESTAMP;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='badges' AND column_name='credly_badge_id') THEN
    ALTER TABLE badges ADD COLUMN credly_badge_id VARCHAR(100) DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='badges' AND column_name='credly_host') THEN
    ALTER TABLE badges ADD COLUMN credly_host VARCHAR(255) DEFAULT 'https://www.credly.com';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='badges' AND column_name='iframe_width') THEN
    ALTER TABLE badges ADD COLUMN iframe_width INTEGER DEFAULT 150;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='badges' AND column_name='iframe_height') THEN
    ALTER TABLE badges ADD COLUMN iframe_height INTEGER DEFAULT 270;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='badges' AND column_name='verification_url') THEN
    ALTER TABLE badges ADD COLUMN verification_url VARCHAR(500);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='badges' AND column_name='featured') THEN
    ALTER TABLE badges ADD COLUMN featured BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='badges' AND column_name='visibility') THEN
    ALTER TABLE badges ADD COLUMN visibility visibility DEFAULT 'PUBLIC';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='badges' AND column_name='display_order') THEN
    ALTER TABLE badges ADD COLUMN display_order INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='badges' AND column_name='fallback_image_url') THEN
    ALTER TABLE badges ADD COLUMN fallback_image_url VARCHAR(500);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='badges' AND column_name='embed_code') THEN
    ALTER TABLE badges ADD COLUMN embed_code TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='badges' AND column_name='auto_sync_enabled') THEN
    ALTER TABLE badges ADD COLUMN auto_sync_enabled BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='badges' AND column_name='last_synced_at') THEN
    ALTER TABLE badges ADD COLUMN last_synced_at TIMESTAMP;
  END IF;
END $$;

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  visibility visibility DEFAULT 'PUBLIC',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create badge_skills junction table
CREATE TABLE IF NOT EXISTS badge_skills (
  badge_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  PRIMARY KEY (badge_id, skill_id),
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_badges_visibility ON badges(visibility);
CREATE INDEX IF NOT EXISTS idx_badges_display_order ON badges(display_order);
CREATE INDEX IF NOT EXISTS idx_badges_featured ON badges(featured);
CREATE INDEX IF NOT EXISTS idx_skills_visibility ON skills(visibility);
CREATE INDEX IF NOT EXISTS idx_skills_display_order ON skills(display_order);
CREATE INDEX IF NOT EXISTS idx_badge_skills_badge_id ON badge_skills(badge_id);
CREATE INDEX IF NOT EXISTS idx_badge_skills_skill_id ON badge_skills(skill_id);

-- Create OAuth tables for Credly integration
CREATE TABLE IF NOT EXISTS oauth_states (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);

CREATE TABLE IF NOT EXISTS credly_oauth_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  credly_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  credly_username VARCHAR(100),
  credly_profile_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credly_oauth_tokens_user_id ON credly_oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_credly_oauth_tokens_credly_user_id ON credly_oauth_tokens(credly_user_id);

-- Create trigger for updated_at on skills
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_skills_updated_at ON skills;
CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON skills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_credly_oauth_tokens_updated_at ON credly_oauth_tokens;
CREATE TRIGGER update_credly_oauth_tokens_updated_at
  BEFORE UPDATE ON credly_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
