-- Guard privileged role changes and audit grants at the database level.
-- To grant a privileged role manually, use SET LOCAL zecelainfo.allow_role_grant = 'on' in a transaction.

BEGIN;

CREATE TABLE IF NOT EXISTS users_role_audit (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT,
  old_role TEXT,
  new_role TEXT NOT NULL,
  db_user TEXT NOT NULL DEFAULT current_user,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION users_guard_privileged_role() RETURNS trigger AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM 'student'
     AND (TG_OP = 'INSERT' OR NEW.role IS DISTINCT FROM OLD.role)
     AND COALESCE(current_setting('zecelainfo.allow_role_grant', true), '') <> 'on' THEN
    RAISE EXCEPTION 'Rolul "%" nu poate fi acordat din aplicatie (user %)', NEW.role, NEW.id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION users_log_role_change() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS DISTINCT FROM 'student' THEN
      INSERT INTO users_role_audit (user_id, email, old_role, new_role) VALUES (NEW.id, NEW.email, NULL, NEW.role);
    END IF;
  ELSIF NEW.role IS DISTINCT FROM OLD.role THEN
    INSERT INTO users_role_audit (user_id, email, old_role, new_role) VALUES (NEW.id, NEW.email, OLD.role, NEW.role);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_guard_privileged_role ON users;
CREATE TRIGGER users_guard_privileged_role
  BEFORE INSERT OR UPDATE OF role ON users
  FOR EACH ROW EXECUTE FUNCTION users_guard_privileged_role();

DROP TRIGGER IF EXISTS users_log_role_change ON users;
CREATE TRIGGER users_log_role_change
  AFTER INSERT OR UPDATE OF role ON users
  FOR EACH ROW EXECUTE FUNCTION users_log_role_change();

COMMIT;
