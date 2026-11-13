-- Adauga "concursuri" ca valoare valida pentru curriculum_level, pentru noua
-- sectiune de top cu probleme de concurs (Concurs MateInfo UB) transformate
-- din grile care necesitau de fapt un calcul/algoritm.
ALTER TABLE problems
  DROP CONSTRAINT IF EXISTS problems_curriculum_level_check;

ALTER TABLE problems
  ADD CONSTRAINT problems_curriculum_level_check
  CHECK (curriculum_level = ANY (ARRAY['grade9'::text, 'grade10'::text, 'grade11'::text, 'bacalaureat'::text, 'oop'::text, 'concursuri'::text]));
