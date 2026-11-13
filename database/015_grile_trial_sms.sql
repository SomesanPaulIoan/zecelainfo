-- Un numar E.164 poate activa trial gratuit o singura data (oricare cont).
CREATE TABLE IF NOT EXISTS grile_trial_phone_claims (
  phone_e164 TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grile_trial_phone_claims_user ON grile_trial_phone_claims(user_id);

-- Limitare trimitere SMS (anti-spam): un user, o trimitere la 60s.
CREATE TABLE IF NOT EXISTS grile_trial_sms_send_log (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_sent_at TIMESTAMPTZ NOT NULL
);
