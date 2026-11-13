-- Bac exam auto-grading schema (interactive subjects, distinct from PDF-based bac_subjects)
-- Run after 001_initial_schema.sql

CREATE TABLE IF NOT EXISTS bac_exam_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  session_label TEXT,
  year SMALLINT,
  variant_label TEXT,
  profile_id SMALLINT NOT NULL DEFAULT 1,
  duration_minutes SMALLINT NOT NULL DEFAULT 180,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  -- Configurable scoring (defaults match standard Bac Informatica)
  points_subject_i NUMERIC(6,2) NOT NULL DEFAULT 20,
  points_subject_ii NUMERIC(6,2) NOT NULL DEFAULT 40,
  points_subject_iii NUMERIC(6,2) NOT NULL DEFAULT 30,
  points_oficiu NUMERIC(6,2) NOT NULL DEFAULT 10,
  grade_divisor NUMERIC(6,2) NOT NULL DEFAULT 10,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bac_exam_subjects_active ON bac_exam_subjects(is_active, year DESC);

CREATE TABLE IF NOT EXISTS bac_exam_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES bac_exam_subjects(id) ON DELETE CASCADE,
  internal_code TEXT NOT NULL,
  title TEXT,
  section TEXT NOT NULL CHECK (section IN ('I', 'II', 'III')),
  exercise_type TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  max_points NUMERIC(6,2) NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  grading_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  default_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (subject_id, internal_code)
);

CREATE INDEX IF NOT EXISTS idx_bac_exam_exercises_subject ON bac_exam_exercises(subject_id, sort_order);

CREATE TABLE IF NOT EXISTS bac_exam_exercise_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID NOT NULL REFERENCES bac_exam_exercises(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bac_exam_exercise_images_exercise ON bac_exam_exercise_images(exercise_id, sort_order);

CREATE TABLE IF NOT EXISTS bac_exam_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID NOT NULL REFERENCES bac_exam_exercises(id) ON DELETE CASCADE,
  label TEXT,
  input_data TEXT NOT NULL DEFAULT '',
  expected_output TEXT NOT NULL DEFAULT '',
  time_limit_ms INTEGER NOT NULL DEFAULT 2000,
  memory_limit_mb INTEGER NOT NULL DEFAULT 128,
  output_type TEXT NOT NULL DEFAULT 'stdout' CHECK (output_type IN ('stdout', 'file', 'both')),
  input_source TEXT NOT NULL DEFAULT 'stdin' CHECK (input_source IN ('stdin', 'file')),
  input_filename TEXT,
  output_filename TEXT,
  points NUMERIC(6,2) NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bac_exam_tests_exercise ON bac_exam_tests(exercise_id, sort_order);

CREATE TABLE IF NOT EXISTS bac_exam_grading_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID NOT NULL REFERENCES bac_exam_exercises(id) ON DELETE CASCADE,
  rule_key TEXT NOT NULL,
  rule_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  points NUMERIC(6,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (exercise_id, rule_key)
);

CREATE TABLE IF NOT EXISTS bac_exam_openai_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID REFERENCES bac_exam_exercises(id) ON DELETE CASCADE,
  prompt_key TEXT NOT NULL,
  system_prompt TEXT NOT NULL DEFAULT '',
  user_prompt_template TEXT NOT NULL DEFAULT '',
  model TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bac_exam_openai_prompts_exercise ON bac_exam_openai_prompts(exercise_id, prompt_key);

CREATE TABLE IF NOT EXISTS bac_exam_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES bac_exam_subjects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  total_points NUMERIC(6,2),
  final_grade NUMERIC(4,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bac_exam_submissions_user ON bac_exam_submissions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bac_exam_submissions_subject ON bac_exam_submissions(subject_id, status);

CREATE TABLE IF NOT EXISTS bac_exam_submission_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES bac_exam_submissions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES bac_exam_exercises(id) ON DELETE CASCADE,
  answer JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id, exercise_id)
);

CREATE TABLE IF NOT EXISTS bac_exam_submission_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES bac_exam_submissions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES bac_exam_exercises(id) ON DELETE CASCADE,
  awarded_points NUMERIC(6,2) NOT NULL DEFAULT 0,
  max_points NUMERIC(6,2) NOT NULL DEFAULT 0,
  breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  feedback TEXT,
  test_results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id, exercise_id)
);

CREATE TABLE IF NOT EXISTS bac_exam_code_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES bac_exam_submissions(id) ON DELETE SET NULL,
  exercise_id UUID REFERENCES bac_exam_exercises(id) ON DELETE SET NULL,
  test_id UUID REFERENCES bac_exam_tests(id) ON DELETE SET NULL,
  language TEXT NOT NULL DEFAULT 'cpp',
  code_hash TEXT,
  verdict TEXT NOT NULL,
  stdout TEXT,
  stderr TEXT,
  time_ms INTEGER,
  memory_kb INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bac_exam_code_runs_submission ON bac_exam_code_runs(submission_id, created_at DESC);

CREATE TABLE IF NOT EXISTS bac_exam_ai_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES bac_exam_submissions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES bac_exam_exercises(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES bac_exam_openai_prompts(id) ON DELETE SET NULL,
  prompt_snapshot TEXT NOT NULL,
  model TEXT NOT NULL,
  raw_response TEXT,
  parsed_result JSONB,
  awarded_points NUMERIC(6,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bac_exam_ai_evaluations_submission ON bac_exam_ai_evaluations(submission_id);

CREATE TABLE IF NOT EXISTS bac_exam_manual_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES bac_exam_submissions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES bac_exam_exercises(id) ON DELETE CASCADE,
  reviewer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  previous_points NUMERIC(6,2) NOT NULL DEFAULT 0,
  new_points NUMERIC(6,2) NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bac_exam_manual_overrides_submission ON bac_exam_manual_overrides(submission_id);
