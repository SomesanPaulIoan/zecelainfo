-- Compilator ("Explorer") moved from "one fixed main source + auxiliary data
-- files" to a real multi-file model: files[] now holds every file (any name,
-- any extension) and Run always executes whichever file is currently open in
-- the editor, with its language inferred from the extension. The old
-- language/code columns have no place left in that model - files[] alone
-- carries everything now, and the first file is opened by default on load.
ALTER TABLE playground_projects
  DROP COLUMN IF EXISTS code,
  DROP COLUMN IF EXISTS language;
