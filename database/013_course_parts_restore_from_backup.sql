-- Restaureaza preturile din backup creat de 012_course_parts_1ron_testing.sql

UPDATE course_parts p
SET
  price = b.price,
  sale_price = b.sale_price,
  updated_at = NOW()
FROM course_parts_price_dev_backup b
WHERE p.id = b.part_id;
