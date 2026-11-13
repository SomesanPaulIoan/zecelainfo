-- OTP trial grile (inlocuieste verificarea prin Twilio; cod generat local + SMS prin SMSLink).
CREATE TABLE IF NOT EXISTS grile_trial_sms_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_e164 TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grile_trial_sms_otps_user_phone_created ON grile_trial_sms_otps(user_id, phone_e164, created_at DESC);
