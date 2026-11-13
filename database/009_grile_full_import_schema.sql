ALTER TABLE grile_categories
  ADD COLUMN IF NOT EXISTS legacy_id INTEGER UNIQUE;

ALTER TABLE grile_sources
  ADD COLUMN IF NOT EXISTS legacy_id INTEGER,
  ADD COLUMN IF NOT EXISTS difficulty INTEGER,
  ADD COLUMN IF NOT EXISTS order_index INTEGER,
  ADD COLUMN IF NOT EXISTS exam_mode BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS premium BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sim_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE grile_chapters
  ADD COLUMN IF NOT EXISTS legacy_id INTEGER,
  ADD COLUMN IF NOT EXISTS difficulty INTEGER,
  ADD COLUMN IF NOT EXISTS order_index INTEGER,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_grile_sources_category_legacy
  ON grile_sources (category_id, legacy_id)
  WHERE legacy_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_grile_chapters_category_legacy
  ON grile_chapters (category_id, legacy_id)
  WHERE legacy_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS grile_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legacy_id INTEGER NOT NULL UNIQUE,
  category_id UUID NOT NULL REFERENCES grile_categories(id) ON DELETE CASCADE,
  source_id UUID REFERENCES grile_sources(id) ON DELETE SET NULL,
  chapter_id UUID REFERENCES grile_chapters(id) ON DELETE SET NULL,
  image_url TEXT,
  answer TEXT,
  hint TEXT,
  hint_ai TEXT,
  explanation TEXT,
  explanation_ai TEXT,
  ai_audit_ok BOOLEAN,
  ai_audit_issues JSONB,
  ai_updated_at TIMESTAMPTZ,
  transcript TEXT,
  transcript_updated_at TIMESTAMPTZ,
  video_url TEXT,
  difficulty INTEGER,
  order_index INTEGER,
  solution_image_url TEXT,
  variants_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grile_questions_category_id ON grile_questions(category_id);
CREATE INDEX IF NOT EXISTS idx_grile_questions_source_id ON grile_questions(source_id);
CREATE INDEX IF NOT EXISTS idx_grile_questions_chapter_id ON grile_questions(chapter_id);

CREATE TABLE IF NOT EXISTS grile_question_chapters (
  question_id UUID NOT NULL REFERENCES grile_questions(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES grile_chapters(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, chapter_id)
);
