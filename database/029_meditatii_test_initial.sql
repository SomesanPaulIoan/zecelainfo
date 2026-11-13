-- Test initial de plasament pentru elevii inscrisi la meditatii (formular
-- meditations_leads). 20 de grile cu imagine (variantele A-F sunt desenate
-- in poza), o singura varianta corecta, cronometrat la 2 ore, o singura
-- incercare per elev (impusa prin UNIQUE(user_id) pe placement_test_attempts).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS placement_test_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_index INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D', 'E', 'F')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS placement_test_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'finished')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 7200,
  correct_count INTEGER,
  grade NUMERIC(4, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS placement_test_attempt_answers (
  attempt_id UUID NOT NULL REFERENCES placement_test_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES placement_test_questions(id),
  selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('A', 'B', 'C', 'D', 'E', 'F')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_placement_test_questions_order ON placement_test_questions(order_index);
