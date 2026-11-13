ALTER TABLE grile_sources
  ADD COLUMN IF NOT EXISTS default_variants_count INTEGER NOT NULL DEFAULT 4;
