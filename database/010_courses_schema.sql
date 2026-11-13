CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legacy_id INTEGER NOT NULL UNIQUE,
  category_id INTEGER,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  h1 TEXT,
  author_name TEXT,
  image_url TEXT,
  preview_video_vimeo_id TEXT,
  preview_video_url TEXT,
  resources_url TEXT,
  hook TEXT,
  target_audience TEXT,
  content_summary TEXT,
  requirements TEXT,
  outcomes TEXT,
  bonuses TEXT,
  content_html TEXT,
  price NUMERIC(10, 2),
  sale_price NUMERIC(10, 2),
  currency TEXT NOT NULL DEFAULT 'RON',
  parts_count INTEGER DEFAULT 0,
  hours_total INTEGER,
  level TEXT,
  format TEXT,
  language TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_is_published_order ON courses(is_published, order_index, updated_at DESC);

CREATE TABLE IF NOT EXISTS course_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legacy_id INTEGER NOT NULL UNIQUE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  short_summary TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  hours INTEGER,
  price NUMERIC(10, 2),
  sale_price NUMERIC(10, 2),
  currency TEXT NOT NULL DEFAULT 'RON',
  is_extension BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  visible_from TIMESTAMPTZ,
  visible_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, order_index),
  UNIQUE (course_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_course_parts_course_pub_order ON course_parts(course_id, is_published, order_index);

CREATE TABLE IF NOT EXISTS course_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legacy_id INTEGER NOT NULL UNIQUE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES course_parts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  vimeo_id TEXT NOT NULL,
  vimeo_url TEXT,
  duration_seconds INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_free_preview BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (part_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_course_videos_course ON course_videos(course_id);
CREATE INDEX IF NOT EXISTS idx_course_videos_part ON course_videos(part_id);
