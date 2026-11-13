CREATE TABLE IF NOT EXISTS grile_legacy_import_log (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  legacy_user_id INTEGER NOT NULL,
  legacy_email TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
