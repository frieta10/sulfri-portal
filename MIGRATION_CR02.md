# Migration Guide: CR-02 — Certificate-to-Training Expertise Linking + Visual Skill Tree

> This document outlines the database and API changes required to implement CR-02.

## Overview

CR-02 introduces two connected enhancements:
1. **Certificate/Badge-to-Training Expertise Hook** - Link imported Credly badges to training expertise areas
2. **Training Expertise Visualization as a Skill Tree** - Interactive skill tree showing expertise progression with evidence from badges

## Database Changes

### New Tables

#### 1. `expertise_nodes`
Stores the expertise areas in a hierarchical structure.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Unique identifier |
| `title` | VARCHAR(100) | Node title |
| `slug` | VARCHAR(100) (unique) | URL-friendly identifier |
| `description` | TEXT | Node description |
| `parent_id` | TEXT (FK) | Parent node for hierarchy |
| `domain` | VARCHAR(50) | Top-level domain category |
| `depth` | INTEGER | Hierarchy level (1-4) |
| `proficiency_level` | ENUM | Foundation/Intermediate/Advanced/Specialist |
| `visibility` | Visibility | PUBLIC or HIDDEN |
| `display_order` | INTEGER | Sort order |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update time |

**Indexes:**
- `idx_expertise_nodes_slug` on `slug`
- `idx_expertise_nodes_parent` on `parent_id`
- `idx_expertise_nodes_visibility` on `visibility`
- `idx_expertise_nodes_domain` on `domain`

#### 2. `expertise_edges` (Optional)
Defines relationships between nodes beyond parent-child.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Unique identifier |
| `from_node_id` | TEXT (FK) | Source node |
| `to_node_id` | TEXT (FK) | Target node |
| `edge_type` | ENUM | PARENT_CHILD or CROSS_LINK |

#### 3. `badge_expertise_map`
Junction table linking badges to expertise nodes.

| Column | Type | Description |
|--------|------|-------------|
| `badge_id` | TEXT (FK) | Reference to badges table |
| `expertise_node_id` | TEXT (FK) | Reference to expertise_nodes |
| `mapping_source` | ENUM | MANUAL or SUGGESTED |
| `created_at` | TIMESTAMP | Creation time |

**Primary Key:** (`badge_id`, `expertise_node_id`)

#### 4. `expertise_assets` (Optional)
Assets attached to expertise nodes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Unique identifier |
| `expertise_node_id` | TEXT (FK) | Reference to expertise_nodes |
| `asset_type` | ENUM | OUTLINE, SAMPLE, CASE_STUDY, LINK |
| `title` | VARCHAR(100) | Asset title |
| `url` | VARCHAR(500) | Asset URL |

### New Enums

```sql
-- Proficiency levels
CREATE TYPE ProficiencyLevel AS ENUM ('FOUNDATION', 'INTERMEDIATE', 'ADVANCED', 'SPECIALIST');

-- Edge types (if using expertise_edges)
CREATE TYPE EdgeType AS ENUM ('PARENT_CHILD', 'CROSS_LINK');

-- Mapping sources
CREATE TYPE MappingSource AS ENUM ('MANUAL', 'SUGGESTED');

-- Asset types
CREATE TYPE AssetType AS ENUM ('OUTLINE', 'SAMPLE', 'CASE_STUDY', 'LINK');
```

## API Changes

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expertise/tree` | Get complete expertise tree structure |
| GET | `/api/expertise/[slug]` | Get single expertise node details |
| GET | `/api/expertise/[slug]/badges` | Get badges linked to an expertise node |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/expertise` | List all expertise nodes |
| POST | `/api/admin/expertise` | Create new expertise node |
| PATCH | `/api/admin/expertise/[id]` | Update expertise node |
| DELETE | `/api/admin/expertise/[id]` | Delete expertise node |
| POST | `/api/admin/expertise/move` | Move node to new parent |
| GET | `/api/admin/badge-expertise-map` | List badge-expertise mappings |
| POST | `/api/admin/badge-expertise-map` | Create mapping |
| DELETE | `/api/admin/badge-expertise-map` | Remove mapping |

## Frontend Changes

### New Pages

| Route | Description |
|-------|-------------|
| `/expertise` | Public skill tree visualization |
| `/admin/expertise` | Admin expertise tree editor |
| `/admin/badge-mappings` | Badge-to-expertise mapping UI |

### Components Needed

1. **SkillTree** - Interactive tree visualization with zoom/pan
2. **SkillTreeNode** - Individual node with credibility indicators
3. **NodeDetailPanel** - Slide-over panel showing node details
4. **ExpertiseEditor** - Admin tree management interface
5. **BadgeMappingUI** - Interface for linking badges to expertise

## Implementation Phases

### Phase 1: Database & API (Week 1)
- [ ] Create database tables and enums
- [ ] Implement public API endpoints
- [ ] Implement admin API endpoints

### Phase 2: Admin Interface (Week 2)
- [ ] Build expertise node CRUD UI
- [ ] Build tree editor with drag-drop
- [ ] Build badge mapping interface

### Phase 3: Public Skill Tree (Week 3)
- [ ] Implement skill tree visualization
- [ ] Add zoom/pan/search functionality
- [ ] Build node detail panels
- [ ] Add list view fallback

### Phase 4: Integration (Week 4)
- [ ] Link badges to expertise nodes
- [ ] Show credibility indicators
- [ ] Testing and polish

## Migration Script

```sql
-- Create enums
CREATE TYPE ProficiencyLevel AS ENUM ('FOUNDATION', 'INTERMEDIATE', 'ADVANCED', 'SPECIALIST');
CREATE TYPE EdgeType AS ENUM ('PARENT_CHILD', 'CROSS_LINK');
CREATE TYPE MappingSource AS ENUM ('MANUAL', 'SUGGESTED');
CREATE TYPE AssetType AS ENUM ('OUTLINE', 'SAMPLE', 'CASE_STUDY', 'LINK');

-- Create expertise_nodes table
CREATE TABLE expertise_nodes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  parent_id TEXT REFERENCES expertise_nodes(id) ON DELETE CASCADE,
  domain VARCHAR(50),
  depth INTEGER DEFAULT 1,
  proficiency_level ProficiencyLevel DEFAULT 'FOUNDATION',
  visibility "Visibility" DEFAULT 'PUBLIC',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_expertise_nodes_slug ON expertise_nodes(slug);
CREATE INDEX idx_expertise_nodes_parent ON expertise_nodes(parent_id);
CREATE INDEX idx_expertise_nodes_visibility ON expertise_nodes(visibility);
CREATE INDEX idx_expertise_nodes_domain ON expertise_nodes(domain);

-- Create expertise_edges table (optional)
CREATE TABLE expertise_edges (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id TEXT NOT NULL REFERENCES expertise_nodes(id) ON DELETE CASCADE,
  to_node_id TEXT NOT NULL REFERENCES expertise_nodes(id) ON DELETE CASCADE,
  edge_type EdgeType DEFAULT 'PARENT_CHILD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create badge_expertise_map junction table
CREATE TABLE badge_expertise_map (
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  expertise_node_id TEXT NOT NULL REFERENCES expertise_nodes(id) ON DELETE CASCADE,
  mapping_source MappingSource DEFAULT 'MANUAL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (badge_id, expertise_node_id)
);

CREATE INDEX idx_badge_expertise_map_badge ON badge_expertise_map(badge_id);
CREATE INDEX idx_badge_expertise_map_node ON badge_expertise_map(expertise_node_id);

-- Create expertise_assets table (optional)
CREATE TABLE expertise_assets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  expertise_node_id TEXT NOT NULL REFERENCES expertise_nodes(id) ON DELETE CASCADE,
  asset_type AssetType NOT NULL,
  title VARCHAR(100) NOT NULL,
  url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expertise_assets_node ON expertise_assets(expertise_node_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_expertise_nodes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_expertise_nodes_updated_at
  BEFORE UPDATE ON expertise_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_expertise_nodes_updated_at();
```

## Prisma Schema Additions

```prisma
model ExpertiseNode {
  id               String           @id @default(cuid())
  title            String
  slug             String           @unique
  description      String?
  parentId         String?          @map("parent_id")
  domain           String?
  depth            Int              @default(1)
  proficiencyLevel ProficiencyLevel @default(FOUNDATION) @map("proficiency_level")
  visibility       Visibility       @default(PUBLIC)
  displayOrder     Int              @default(0) @map("display_order")
  createdAt        DateTime         @default(now()) @map("created_at")
  updatedAt        DateTime         @updatedAt @map("updated_at")
  
  // Self-referential relationship
  parent           ExpertiseNode?   @relation("NodeHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children         ExpertiseNode[]  @relation("NodeHierarchy")
  
  // Badge mappings
  badgeMappings    BadgeExpertiseMap[]
  
  // Assets
  assets           ExpertiseAsset[]
  
  @@index([slug])
  @@index([parentId])
  @@index([visibility])
  @@index([domain])
  @@map("expertise_nodes")
}

model BadgeExpertiseMap {
  badgeId         String         @map("badge_id")
  expertiseNodeId String         @map("expertise_node_id")
  mappingSource   MappingSource  @default(MANUAL) @map("mapping_source")
  createdAt       DateTime       @default(now()) @map("created_at")
  
  badge           Badge          @relation(fields: [badgeId], references: [id], onDelete: Cascade)
  expertiseNode   ExpertiseNode  @relation(fields: [expertiseNodeId], references: [id], onDelete: Cascade)
  
  @@id([badgeId, expertiseNodeId])
  @@index([badgeId])
  @@index([expertiseNodeId])
  @@map("badge_expertise_map")
}

model ExpertiseAsset {
  id              String         @id @default(cuid())
  expertiseNodeId String         @map("expertise_node_id")
  assetType       AssetType      @map("asset_type")
  title           String
  url             String
  createdAt       DateTime       @default(now()) @map("created_at")
  
  expertiseNode   ExpertiseNode  @relation(fields: [expertiseNodeId], references: [id], onDelete: Cascade)
  
  @@index([expertiseNodeId])
  @@map("expertise_assets")
}

enum ProficiencyLevel {
  FOUNDATION
  INTERMEDIATE
  ADVANCED
  SPECIALIST
}

enum MappingSource {
  MANUAL
  SUGGESTED
}

enum AssetType {
  OUTLINE
  SAMPLE
  CASE_STUDY
  LINK
}

// Add relation to existing Badge model
model Badge {
  // ... existing fields ...
  
  // New relation
  expertiseMappings BadgeExpertiseMap[]
}
```

## Testing Checklist

- [ ] Admin can create expertise nodes
- [ ] Admin can build hierarchical tree structure
- [ ] Admin can link badges to expertise nodes
- [ ] Public skill tree displays correctly
- [ ] Node detail panel shows supporting badges
- [ ] Tree view toggles to list view
- [ ] Search and filter work correctly
- [ ] Mobile responsive design works

## Notes

- Keep tree depth configurable (default max 4 levels)
- Use adjacency list pattern (parent_id) for simplicity
- Cache tree JSON server-side for performance
- Lazy-load badge embeds in detail panels only
