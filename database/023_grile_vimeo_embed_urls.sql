-- Normalize grile question Vimeo links to player embed format for iframe playback.
UPDATE grile_questions
SET video_url = 'https://player.vimeo.com/video/' || (regexp_match(video_url, '(\d+)'))[1]
WHERE video_url IS NOT NULL
  AND video_url ~ 'vimeo\.com'
  AND video_url NOT LIKE '%player.vimeo.com%';
