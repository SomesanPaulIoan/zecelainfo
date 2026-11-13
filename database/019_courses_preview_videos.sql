-- Video-uri de prezentare Vimeo pentru cele 4 cursuri principale de informatica
UPDATE courses
SET
  preview_video_vimeo_id = '1193217246',
  preview_video_url = 'https://player.vimeo.com/video/1193217246',
  updated_at = NOW()
WHERE slug = 'curs-admitere-ubb';

UPDATE courses
SET
  preview_video_vimeo_id = '1193217242',
  preview_video_url = 'https://player.vimeo.com/video/1193217242',
  updated_at = NOW()
WHERE slug = 'curs-admitere-ub-unstpb';

UPDATE courses
SET
  preview_video_vimeo_id = '1193217241',
  preview_video_url = 'https://player.vimeo.com/video/1193217241',
  updated_at = NOW()
WHERE slug = 'curs-admitere-uaic-tuiasi';

UPDATE courses
SET
  preview_video_vimeo_id = '1193217247',
  preview_video_url = 'https://player.vimeo.com/video/1193217247',
  updated_at = NOW()
WHERE slug = 'curs-bacalaureat-informatica-mi';
