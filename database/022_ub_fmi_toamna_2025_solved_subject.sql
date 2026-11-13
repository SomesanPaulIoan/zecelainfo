-- Subiect rezolvat UB: Admitere FMI Informatica Toamna 2025
-- Curs: curs-admitere-ub-unstpb
-- Modul: Modul Practic – Rezolvari Subiecte UB

INSERT INTO course_videos (
  legacy_id,
  course_id,
  part_id,
  title,
  vimeo_id,
  vimeo_url,
  duration_seconds,
  sort_order,
  is_free_preview,
  is_published
)
SELECT
  572,
  c.id,
  cp.id,
  'Subiect Admitere UB - FMI - Informatica - Toamna 2025',
  '1200674731',
  'https://vimeo.com/1200674731',
  3351,
  13,
  false,
  true
FROM courses c
JOIN course_parts cp ON cp.course_id = c.id
WHERE c.slug = 'curs-admitere-ub-unstpb'
  AND cp.name = 'Modul Practic – Rezolvari Subiecte UB'
  AND NOT EXISTS (
    SELECT 1
    FROM course_videos cv
    WHERE cv.part_id = cp.id
      AND cv.vimeo_id = '1200674731'
  );
