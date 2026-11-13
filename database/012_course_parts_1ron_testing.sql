-- Testare plati: salveaza preturile actuale si seteaza fiecare parte de curs la 1 RON.
-- Restore: ruleaza 013_course_parts_restore_from_backup.sql

CREATE TABLE IF NOT EXISTS course_parts_price_dev_backup (
  part_id UUID PRIMARY KEY,
  price NUMERIC(10, 2),
  sale_price NUMERIC(10, 2),
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO course_parts_price_dev_backup (part_id, price, sale_price)
SELECT id, COALESCE(price, 0), sale_price
FROM course_parts
ON CONFLICT (part_id) DO UPDATE SET
  price = EXCLUDED.price,
  sale_price = EXCLUDED.sale_price,
  saved_at = NOW();

UPDATE course_parts
SET
  price = 1.00,
  sale_price = NULL,
  updated_at = NOW();
