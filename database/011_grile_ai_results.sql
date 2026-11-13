CREATE TABLE IF NOT EXISTS grile_question_ai_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL UNIQUE REFERENCES grile_questions(id) ON DELETE CASCADE,
  official_answer TEXT,
  official_answer_normalized TEXT NOT NULL DEFAULT '',
  model_suggested_answer TEXT,
  model_suggested_answer_normalized TEXT,
  correct_options JSONB NOT NULL DEFAULT '[]'::jsonb,
  extra_correct_options_suspected JSONB NOT NULL DEFAULT '[]'::jsonb,
  official_options_suspected_wrong JSONB NOT NULL DEFAULT '[]'::jsonb,
  agrees_with_official_answer BOOLEAN NOT NULL DEFAULT TRUE,
  needs_human_review BOOLEAN NOT NULL DEFAULT FALSE,
  ocr_confidence SMALLINT NOT NULL DEFAULT 0,
  confidence SMALLINT NOT NULL DEFAULT 0,
  review_reason TEXT,
  transcribed_question TEXT,
  transcribed_options JSONB NOT NULL DEFAULT '[]'::jsonb,
  hint TEXT,
  short_explanation TEXT,
  full_explanation TEXT,
  options_explanation JSONB NOT NULL DEFAULT '[]'::jsonb,
  trap TEXT,
  complexity TEXT,
  difficulty_estimate TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  student_visible JSONB NOT NULL DEFAULT '{}'::jsonb,
  admin_notes TEXT,
  content_format TEXT NOT NULL DEFAULT 'markdown_latex',
  model_used TEXT,
  prompt_version TEXT NOT NULL DEFAULT 'grile_ai_v1.0',
  raw_ai_response TEXT,
  error_message TEXT,
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'done', 'error')),
  generated_at TIMESTAMPTZ,
  reviewed_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
  admin_review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grile_ai_results_question ON grile_question_ai_results(question_id);
CREATE INDEX IF NOT EXISTS idx_grile_ai_results_needs_review ON grile_question_ai_results(needs_human_review);
CREATE INDEX IF NOT EXISTS idx_grile_ai_results_status ON grile_question_ai_results(processing_status);
CREATE INDEX IF NOT EXISTS idx_grile_ai_results_generated_at ON grile_question_ai_results(generated_at DESC);
