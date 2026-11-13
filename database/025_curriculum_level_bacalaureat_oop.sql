-- Adds "bacalaureat" and "oop" as valid curriculum_level values, alongside the
-- existing grade9/grade10/grade11, so the new top-level sections (past-exam
-- archive by year, and a future OOP track) can be seeded like any other level.
ALTER TABLE problems
  DROP CONSTRAINT IF EXISTS problems_curriculum_level_check;

ALTER TABLE problems
  ADD CONSTRAINT problems_curriculum_level_check
  CHECK (curriculum_level = ANY (ARRAY['grade9'::text, 'grade10'::text, 'grade11'::text, 'bacalaureat'::text, 'oop'::text]));
