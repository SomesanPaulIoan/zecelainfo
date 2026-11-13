-- Saved sessions for the free-form online compiler ("Compilator") zone.
-- Running code there never touches this table (anonymous visitors can run
-- code without an account) - only saving a session as a named project
-- requires auth, hence the NOT NULL user_id FK.
CREATE TABLE IF NOT EXISTS playground_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('cpp', 'c', 'pascal', 'python')),
  code TEXT NOT NULL DEFAULT '',
  files JSONB NOT NULL DEFAULT '[]',
  stdin TEXT NOT NULL DEFAULT '',
  input_source TEXT NOT NULL DEFAULT 'stdin' CHECK (input_source IN ('stdin', 'file')),
  input_filename TEXT,
  output_target TEXT NOT NULL DEFAULT 'stdout' CHECK (output_target IN ('stdout', 'file')),
  output_filename TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playground_projects_user_id ON playground_projects (user_id, updated_at DESC);
