INSERT INTO users (id, email, username, full_name, role)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'dev@zecelainfo.local',
  'dev-user',
  'Developer Local',
  'student'
)
ON CONFLICT (id) DO NOTHING;
