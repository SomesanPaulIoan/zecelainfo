-- 007_problem_metadata_normalization.sql
-- Normalizes problem metadata for scalable authoring and analytics.

-- 1) SOURCES (normalized)
CREATE TABLE IF NOT EXISTS problem_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  short_name TEXT,
  source_type TEXT NOT NULL DEFAULT 'other'
    CHECK (source_type IN ('olympiad', 'contest', 'book', 'platform', 'internal', 'other')),
  url TEXT,
  year INTEGER,
  edition TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) TAXONOMY (class -> chapter -> subcategory)
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level TEXT NOT NULL CHECK (level IN ('grade9', 'grade10', 'grade11')),
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  UNIQUE(level, name)
);

CREATE TABLE IF NOT EXISTS subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  UNIQUE(chapter_id, name)
);

-- 3) EXTRA PROBLEM METADATA (editorial + grading)
ALTER TABLE problems
ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES problem_sources(id),
ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES chapters(id),
ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES subcategories(id),
ADD COLUMN IF NOT EXISTS editorial_status TEXT NOT NULL DEFAULT 'draft'
  CHECK (editorial_status IN ('draft', 'review', 'approved', 'published')),
ADD COLUMN IF NOT EXISTS checker_type TEXT NOT NULL DEFAULT 'exact'
  CHECK (checker_type IN ('exact', 'token', 'special_judge')),
ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER;

-- Keep old 'source' text for compatibility; map existing values to normalized source rows.
INSERT INTO problem_sources (name, source_type)
SELECT DISTINCT p.source, 'other'
FROM problems p
WHERE p.source IS NOT NULL AND btrim(p.source) <> ''
ON CONFLICT (name) DO NOTHING;

UPDATE problems p
SET source_id = ps.id
FROM problem_sources ps
WHERE p.source_id IS NULL
  AND p.source IS NOT NULL
  AND btrim(p.source) <> ''
  AND ps.name = p.source;

-- Ensure every problem has a source row (fallback: "Sursa interna").
INSERT INTO problem_sources (name, source_type, short_name)
VALUES ('Sursa interna', 'internal', 'internal')
ON CONFLICT (name) DO NOTHING;

UPDATE problems p
SET source_id = ps.id
FROM problem_sources ps
WHERE p.source_id IS NULL
  AND ps.name = 'Sursa interna';

-- 4) SEED CHAPTERS/SUBCATEGORIES
INSERT INTO chapters (level, name, order_index) VALUES
  ('grade9', 'Probleme de Baza in Informatica', 10),
  ('grade9', 'Probleme cu Algoritmi Elementari', 20),
  ('grade9', 'Probleme cu Tablouri Unidimensionale', 30),
  ('grade9', 'Probleme cu Tablouri Bidimensionale', 40),

  ('grade10', 'Subprograme', 10),
  ('grade10', 'Subprograme Recursive', 20),
  ('grade10', 'Divide et Impera', 30),
  ('grade10', 'Siruri de caractere', 40),
  ('grade10', 'Structuri de date Neomogene', 50),
  ('grade10', 'Structuri de date liniare', 60),
  ('grade10', 'Liste Alocate Dinamic', 70),

  ('grade11', 'Backtracking', 10),
  ('grade11', 'Metoda Greedy', 20),
  ('grade11', 'Programare Dinamica', 30),
  ('grade11', 'Teoria Grafurilor', 40),
  ('grade11', 'Structuri de date arborescente', 50)
ON CONFLICT (level, name) DO NOTHING;

-- grade9 subcategories
INSERT INTO subcategories (chapter_id, name, order_index)
SELECT c.id, x.name, x.order_index
FROM chapters c
JOIN (
  VALUES
    ('Probleme de Baza in Informatica', 'Operatori si Expresii', 10),
    ('Probleme de Baza in Informatica', 'Structuri de Decizie', 20),
    ('Probleme de Baza in Informatica', 'Structuri repetitive', 30),

    ('Probleme cu Algoritmi Elementari', 'Sume, produse, numarari', 10),
    ('Probleme cu Algoritmi Elementari', 'Maxime si minime', 20),
    ('Probleme cu Algoritmi Elementari', 'Cifrele unui numar', 30),
    ('Probleme cu Algoritmi Elementari', 'Divizibilitate', 40),
    ('Probleme cu Algoritmi Elementari', 'Generarea unor siruri', 50),
    ('Probleme cu Algoritmi Elementari', 'Baze de numeratie', 60),

    ('Probleme cu Tablouri Unidimensionale', 'Parcurgerea vectorilor', 10),
    ('Probleme cu Tablouri Unidimensionale', 'Stergeri si inserari de elemente in vectori', 20),
    ('Probleme cu Tablouri Unidimensionale', 'Verificarea unor proprietati', 30),
    ('Probleme cu Tablouri Unidimensionale', 'Sortarea vectorilor', 40),
    ('Probleme cu Tablouri Unidimensionale', 'Interclasare', 50),
    ('Probleme cu Tablouri Unidimensionale', 'Cautare binara', 60),
    ('Probleme cu Tablouri Unidimensionale', 'Probleme cu secvente', 70),
    ('Probleme cu Tablouri Unidimensionale', 'Vectori caracteristici / de frecventa', 80),

    ('Probleme cu Tablouri Bidimensionale', 'Parcurgerea matricelor oarecare', 10),
    ('Probleme cu Tablouri Bidimensionale', 'Parcurgerea matricelor patratice', 20),
    ('Probleme cu Tablouri Bidimensionale', 'Generari de matrice', 30)
) AS x(chapter_name, name, order_index)
  ON c.name = x.chapter_name
 AND c.level = 'grade9'
ON CONFLICT (chapter_id, name) DO NOTHING;

-- grade10 subcategories
INSERT INTO subcategories (chapter_id, name, order_index)
SELECT c.id, x.name, x.order_index
FROM chapters c
JOIN (
  VALUES
    ('Subprograme', 'Subprograme care returneaza valori', 10),
    ('Subprograme', 'Subprograme care intorc valori prin parametri', 20),
    ('Subprograme', 'Subprograme care prelucreaza tablouri unidimensionale', 30),
    ('Subprograme', 'Subprograme care prelucreaza tablouri bidimensionale', 40),
    ('Subprograme', 'Subprograme cu siruri de caractere', 50),

    ('Subprograme Recursive', 'Subprograme recursive', 10),
    ('Subprograme Recursive', 'Probleme diverse', 20),

    ('Divide et Impera', 'Probleme diverse', 10),
    ('Divide et Impera', 'Algoritmi de sortare', 20),

    ('Siruri de caractere', 'Prelucrari elementare pe siruri de caractere', 10),
    ('Siruri de caractere', 'Functii predefinite cu siruri de caractere', 20),
    ('Siruri de caractere', 'Probleme diverse', 30),

    ('Structuri de date Neomogene', 'Probleme diverse', 10),
    ('Structuri de date Neomogene', 'Exercitii cu structuri', 20),

    ('Structuri de date liniare', 'Stiva', 10),
    ('Structuri de date liniare', 'Coada', 20),

    ('Liste Alocate Dinamic', 'Operatii cu liste simplu inlantuite', 10),
    ('Liste Alocate Dinamic', 'Operatii cu liste dublu inlantuite', 20)
) AS x(chapter_name, name, order_index)
  ON c.name = x.chapter_name
 AND c.level = 'grade10'
ON CONFLICT (chapter_id, name) DO NOTHING;

-- grade11 subcategories
INSERT INTO subcategories (chapter_id, name, order_index)
SELECT c.id, x.name, x.order_index
FROM chapters c
JOIN (
  VALUES
    ('Backtracking', 'Elemente de Combinatorica', 10),
    ('Backtracking', 'Probleme Diverse', 20),
    ('Backtracking', 'Backtracking in Plan', 30),

    ('Metoda Greedy', 'Probleme diverse', 10),

    ('Programare Dinamica', 'Probleme de numarare', 10),
    ('Programare Dinamica', 'Probleme Diverse', 20),

    ('Teoria Grafurilor', 'Probleme elementare cu grafuri neorientate', 10),
    ('Teoria Grafurilor', 'Parcurgerea grafurilor neorientate', 20),
    ('Teoria Grafurilor', 'Probleme diverse cu grafuri orientate', 30),
    ('Teoria Grafurilor', 'Grafuri cu costuri', 40),
    ('Teoria Grafurilor', 'Arbori cu radacina', 50),

    ('Structuri de date arborescente', 'Arbori binari', 10),
    ('Structuri de date arborescente', 'Structuri de date', 20),
    ('Structuri de date arborescente', 'Arbori de intervale', 30)
) AS x(chapter_name, name, order_index)
  ON c.name = x.chapter_name
 AND c.level = 'grade11'
ON CONFLICT (chapter_id, name) DO NOTHING;

-- 5) BACKFILL chapter/subcategory for existing rows (safe fallback).
-- Existing data is sparse, so we classify only known current slugs.
WITH level_map AS (
  SELECT
    p.id AS problem_id,
    CASE
      WHEN p.slug = 'suma-doua-numere' THEN 'grade9'
      WHEN p.slug = 'maxim-din-vector' THEN 'grade9'
      WHEN p.slug = 'interogari-cautare-binara' THEN 'grade9'
      WHEN p.slug = 'subsecventa-crescatoare-maxima' THEN 'grade11'
      ELSE 'grade10'
    END AS lvl
  FROM problems p
),
chapter_map AS (
  SELECT
    l.problem_id,
    CASE
      WHEN p.slug = 'suma-doua-numere' THEN 'Probleme de Baza in Informatica'
      WHEN p.slug = 'maxim-din-vector' THEN 'Probleme cu Tablouri Unidimensionale'
      WHEN p.slug = 'interogari-cautare-binara' THEN 'Probleme cu Tablouri Unidimensionale'
      WHEN p.slug = 'subsecventa-crescatoare-maxima' THEN 'Programare Dinamica'
      ELSE 'Subprograme'
    END AS chapter_name,
    l.lvl
  FROM level_map l
  JOIN problems p ON p.id = l.problem_id
),
subcategory_map AS (
  SELECT
    c.problem_id,
    CASE
      WHEN p.slug = 'suma-doua-numere' THEN 'Operatori si Expresii'
      WHEN p.slug = 'maxim-din-vector' THEN 'Parcurgerea vectorilor'
      WHEN p.slug = 'interogari-cautare-binara' THEN 'Cautare binara'
      WHEN p.slug = 'subsecventa-crescatoare-maxima' THEN 'Probleme Diverse'
      ELSE 'Subprograme care returneaza valori'
    END AS subcategory_name,
    c.chapter_name,
    c.lvl
  FROM chapter_map c
  JOIN problems p ON p.id = c.problem_id
),
resolved AS (
  SELECT
    s.problem_id,
    ch.id AS chapter_id,
    sc.id AS subcategory_id
  FROM subcategory_map s
  JOIN chapters ch
    ON ch.level = s.lvl
   AND ch.name = s.chapter_name
  JOIN subcategories sc
    ON sc.chapter_id = ch.id
   AND sc.name = s.subcategory_name
)
UPDATE problems p
SET chapter_id = r.chapter_id,
    subcategory_id = r.subcategory_id
FROM resolved r
WHERE p.id = r.problem_id
  AND (p.chapter_id IS NULL OR p.subcategory_id IS NULL);

-- 6) TEST CASE GROUPS / SUBTASKS
CREATE TABLE IF NOT EXISTS test_case_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  UNIQUE(problem_id, name)
);

ALTER TABLE test_cases
ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'hidden'
  CHECK (visibility IN ('sample', 'hidden')),
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES test_case_groups(id),
ADD COLUMN IF NOT EXISTS time_limit_override_ms INTEGER,
ADD COLUMN IF NOT EXISTS memory_limit_override_mb INTEGER;

-- Align existing sample flag with new visibility.
UPDATE test_cases
SET visibility = CASE WHEN is_sample THEN 'sample' ELSE 'hidden' END
WHERE visibility IS DISTINCT FROM CASE WHEN is_sample THEN 'sample' ELSE 'hidden' END;

-- 7) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_problems_source_id ON problems(source_id);
CREATE INDEX IF NOT EXISTS idx_problems_chapter_id ON problems(chapter_id);
CREATE INDEX IF NOT EXISTS idx_problems_subcategory_id ON problems(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_chapters_level_order ON chapters(level, order_index);
CREATE INDEX IF NOT EXISTS idx_subcategories_chapter_order ON subcategories(chapter_id, order_index);
CREATE INDEX IF NOT EXISTS idx_test_cases_group_id ON test_cases(group_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_visibility ON test_cases(visibility);
