-- Create work_relationships table for linking different types of works together
CREATE TABLE IF NOT EXISTS "work_relationships" (
  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "source_entity_type" text NOT NULL,
  "source_entity_id" integer NOT NULL,
  "target_entity_type" text NOT NULL,
  "target_entity_id" integer NOT NULL,
  "relationship_type" text DEFAULT 'related',
  "created_at" text DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS "work_rel_source_idx" ON "work_relationships" ("source_entity_type", "source_entity_id");
CREATE INDEX IF NOT EXISTS "work_rel_target_idx" ON "work_relationships" ("target_entity_type", "target_entity_id");

-- Create unique constraint to prevent duplicate relationships
CREATE UNIQUE INDEX IF NOT EXISTS "work_rel_unique_idx" ON "work_relationships" (
  "source_entity_type", 
  "source_entity_id", 
  "target_entity_type", 
  "target_entity_id"
);

