-- Insert test data for AI Learning system
-- This will insert test data for ALL existing users

-- Insert analyzed videos for each user
INSERT INTO analyzed_videos (user_id, video_id, video_title, video_url, thumbnail_url, analysis_results, concepts_count, status)
SELECT 
  u.id as user_id,
  'dQw4w9WgXcQ' as video_id,
  'Drywall Installation Basics - Complete Guide' as video_title,
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ' as video_url,
  'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg' as thumbnail_url,
  jsonb_build_object(
    'difficultyLevel', 'beginner',
    'keyConcepts', jsonb_build_array(
      jsonb_build_object('name', 'Drywall hanging', 'confidence', 0.95),
      jsonb_build_object('name', 'Taping joints', 'confidence', 0.90),
      jsonb_build_object('name', 'Mudding techniques', 'confidence', 0.88)
    ),
    'materialsMentioned', jsonb_build_array('Drywall sheets', 'Joint compound', 'Tape', 'Screws'),
    'techniquesDescribed', jsonb_build_array('Hanging sheets', 'Taping', 'Mudding', 'Sanding')
  ) as analysis_results,
  4 as concepts_count,
  'completed' as status
FROM auth.users u
ON CONFLICT (user_id, video_id) DO NOTHING;
