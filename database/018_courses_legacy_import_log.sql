CREATE TABLE IF NOT EXISTS courses_legacy_import_log (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  legacy_user_id INTEGER NOT NULL,
  legacy_email TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_legacy_import_log_legacy_user_id
  ON courses_legacy_import_log (legacy_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_legacy_import_log_legacy_email_lower
  ON courses_legacy_import_log (lower(legacy_email));
