-- Run this SQL in Supabase SQL Editor to populate test data
-- This inserts data for the CURRENT logged-in user

-- First, let's see what user_id to use (run this first to get your user_id)
-- SELECT id, email FROM auth.users;

-- Then replace 'YOUR_USER_ID_HERE' with your actual user ID from above query
-- Or use this dynamic version that inserts for ALL users:

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get first user (or you can specify a specific email)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  -- Insert analyzed videos
  INSERT INTO analyzed_videos (user_id, video_id, video_title, video_url, thumbnail_url, analysis_results, concepts_count, status)
  VALUES 
    (v_user_id, 'dQw4w9WgXcQ', 'Drywall Installation Basics', 'https://youtube.com/watch?v=dQw4w9WgXcQ', 
     'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
     '{"difficultyLevel": "beginner", "keyConcepts": [{"name": "Hanging drywall", "confidence": 0.95}, {"name": "Taping joints", "confidence": 0.90}], "materialsMentioned": ["Drywall sheets", "Joint compound", "Tape"], "techniquesDescribed": ["Hanging", "Taping", "Mudding"]}'::jsonb,
     2, 'completed'),
    (v_user_id, 'abc123xyz', 'Advanced Metal Framing Techniques', 'https://youtube.com/watch?v=abc123xyz',
     'https://img.youtube.com/vi/abc123xyz/maxresdefault.jpg',
     '{"difficultyLevel": "advanced", "keyConcepts": [{"name": "Metal stud layout", "confidence": 0.92}, {"name": "Load calculations", "confidence": 0.88}], "materialsMentioned": ["Metal studs", "Track", "Screws"], "techniquesDescribed": ["Layout", "Cutting", "Assembly"]}'::jsonb,
     2, 'completed')
  ON CONFLICT (user_id, video_id) DO NOTHING;
  
  -- Insert AI learning questions
  INSERT INTO ai_learning_questions (user_id, question_text, question_type, context, suggested_answer, confidence_score, status, source_type, source_id)
  VALUES
    (v_user_id, 'What is the standard spacing for drywall screws?', 'clarification', 'From video: Drywall Installation Basics', '12 inches on center', 0.75, 'pending', 'video', 'dQw4w9WgXcQ'),
    (v_user_id, 'Should metal studs be 16" or 24" on center for residential?', 'confirmation', 'From video: Advanced Metal Framing', '16 inches for residential', 0.80, 'pending', 'video', 'abc123xyz')
  ON CONFLICT DO NOTHING;
  
  -- Insert or update AI learning metrics
  INSERT INTO ai_learning_metrics (user_id, total_concepts_learned, concepts_confirmed, concepts_corrected, questions_answered, average_confidence)
  VALUES (v_user_id, 15, 12, 2, 8, 0.87)
  ON CONFLICT (user_id) DO UPDATE SET
    total_concepts_learned = 15,
    concepts_confirmed = 12,
    concepts_corrected = 2,
    questions_answered = 8,
    average_confidence = 0.87;
    
  RAISE NOTICE 'Test data inserted for user: %', v_user_id;
END $$;
