-- Preturi de test (<= 1 lei) sau vechi 1.00: revin la 150 lei (pret standard sedinta).
-- Ruleaza: psql "$DATABASE_URL" -f database/014_meditation_sessions_restore_150lei.sql
-- sau: cd backend && npm run fix-meditation-amounts

UPDATE meditation_member_sessions
SET amount_lei = 150
WHERE amount_lei::numeric <= 1;
