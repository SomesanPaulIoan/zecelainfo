CREATE TABLE IF NOT EXISTS grile_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grile_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES grile_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, name)
);

CREATE TABLE IF NOT EXISTS grile_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES grile_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, name)
);

CREATE INDEX IF NOT EXISTS idx_grile_sources_category_id ON grile_sources(category_id);
CREATE INDEX IF NOT EXISTS idx_grile_chapters_category_id ON grile_chapters(category_id);

INSERT INTO grile_categories (slug, name)
VALUES
  ('admitere-ubb', 'Admitere UBB'),
  ('admitere-unstpb', 'Admitere UNSTPB'),
  ('admitere-ub', 'Admitere UB'),
  ('admitere-tu-iasi', 'Admitere TU Iasi'),
  ('admitere-atm', 'Admitere ATM'),
  ('bacalaureat', 'Bacalaureat')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO grile_sources (category_id, name)
SELECT c.id, 'Examen Admitere Vara 2021'
FROM grile_categories c
WHERE c.slug = 'admitere-ubb'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO grile_chapters (category_id, name)
SELECT c.id, v.name
FROM grile_categories c
CROSS JOIN (VALUES ('Divizibilitate'), ('Cifrele unui Numar')) AS v(name)
WHERE c.slug = 'admitere-ubb'
ON CONFLICT (category_id, name) DO NOTHING;
