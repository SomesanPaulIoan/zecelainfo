-- Teme de probleme (pe langa temele de grile deja existente): meditation_homework_assignments
-- suporta deja kind IN ('grile', 'problems'); aici adaugam tabela de iteme pentru tipul
-- 'problems', in oglinda cu meditation_homework_grile_items.
-- Nota: aceasta tabela este creata si idempotent la runtime de ensureMeditationsTables()
-- in backend/src/routes/meditations.ts — fisierul de fata e doar pentru istoricul schemei.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS meditation_homework_problems_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES meditation_homework_assignments(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assignment_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_meditation_hw_problems_assignment ON meditation_homework_problems_items(assignment_id);
