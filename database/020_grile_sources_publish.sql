-- Draft/publish workflow for grile sources (admin-created sources start unpublished).

ALTER TABLE grile_sources
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE grile_sources
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Existing imported sources remain visible to students.
UPDATE grile_sources
SET is_published = TRUE,
    published_at = COALESCE(published_at, NOW())
WHERE published_at IS NULL OR is_published = FALSE;

CREATE INDEX IF NOT EXISTS idx_grile_sources_category_published
  ON grile_sources (category_id, is_published);
