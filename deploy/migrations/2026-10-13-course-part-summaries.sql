-- Corecturi de continut (descrierile modulelor practice), verificate pe titlurile video-urilor publicate.
-- Sigur la rulari repetate: fiecare UPDATE se aplica doar daca textul vechi este inca cel gresit.
-- Rollback: tabela course_parts_summary_backup_20261013 pastreaza valorile anterioare.
BEGIN;

CREATE TABLE IF NOT EXISTS course_parts_summary_backup_20261013 AS
SELECT p.id, p.short_summary, NOW() AS backed_up_at
FROM course_parts p JOIN courses c ON c.id = p.course_id
WHERE c.slug IN ('curs-admitere-ub-unstpb', 'curs-admitere-ubb', 'curs-admitere-uaic-tuiasi') AND p.order_index IN (4, 5);

UPDATE course_parts p SET short_summary = 'Rezolvarea subiectelor de admitere de la Universitatea din București: CTI 2013–2019, FMI 2022–2025 (vară și toamnă) și Concursul MateInfo UB 2021–2025.', updated_at = NOW()
FROM courses c WHERE c.id = p.course_id AND c.slug = 'curs-admitere-ub-unstpb' AND p.order_index = 4
  AND p.short_summary = 'Rezolvarea tuturor subiectelor de la admiterea UBB: 2021–2022.';

UPDATE course_parts p SET short_summary = 'Rezolvarea subiectelor de admitere UNSTPB 2021–2025, a examenelor și simulărilor de preadmitere 2021–2026, plus subiecte de antrenament.', updated_at = NOW()
FROM courses c WHERE c.id = p.course_id AND c.slug = 'curs-admitere-ub-unstpb' AND p.order_index = 5
  AND p.short_summary = 'Rezolvarea tuturor subiectelor de la admiterea UBB: 2023–2025.';

UPDATE course_parts p SET short_summary = 'Rezolvarea subiectelor de la admiterea UBB 2023–2025 (vară și toamnă) și a Concursului Mate-Info UBB 2023–2026.', updated_at = NOW()
FROM courses c WHERE c.id = p.course_id AND c.slug = 'curs-admitere-ubb' AND p.order_index = 5
  AND p.short_summary = 'Rezolvarea tuturor subiectelor de la admiterea UBB: 2023–2025.';

UPDATE course_parts p SET short_summary = 'Rezolvarea subiectelor de la admiterea UAIC din 2018, 2019, 2023 și 2024.', updated_at = NOW()
FROM courses c WHERE c.id = p.course_id AND c.slug = 'curs-admitere-uaic-tuiasi' AND p.order_index = 4
  AND p.short_summary = 'Rezolvarea tuturor subiectelor de la admiterea UAIC: 2021–2025.';

UPDATE course_parts p SET short_summary = 'Rezolvarea subiectelor de la admiterea TU Iași (Automatică și Calculatoare) 2021–2025 și 10 subiecte de antrenament.', updated_at = NOW()
FROM courses c WHERE c.id = p.course_id AND c.slug = 'curs-admitere-uaic-tuiasi' AND p.order_index = 5
  AND p.short_summary = 'Rezolvarea tuturor subiectelor de la admiterea TU Iasi';

COMMIT;
