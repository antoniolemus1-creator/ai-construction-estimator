-- Delete all YouTube video analyses for testing/cleanup
-- WARNING: This will permanently delete all video analysis data

-- Delete all analyzed videos
DELETE FROM analyzed_videos;

-- Delete all custom training videos
DELETE FROM custom_training_videos;

-- Delete all AI learning questions
DELETE FROM ai_learning_questions;

-- Delete all knowledge graph nodes related to videos
DELETE FROM knowledge_graph_nodes WHERE source_type = 'video';

-- Delete all knowledge graph edges (they reference nodes)
DELETE FROM knowledge_graph_edges;

-- Reset any video watch progress
DELETE FROM video_watch_progress;

-- To delete only for a specific user, uncomment and modify:
-- DELETE FROM analyzed_videos WHERE user_id = 'YOUR_USER_ID';
-- DELETE FROM custom_training_videos WHERE user_id = 'YOUR_USER_ID';

-- To delete specific videos by ID:
-- DELETE FROM analyzed_videos WHERE video_id IN ('VIDEO_ID_1', 'VIDEO_ID_2');

-- To see what will be deleted first (dry run):
-- SELECT * FROM analyzed_videos;
-- SELECT * FROM custom_training_videos;
-- SELECT * FROM ai_learning_questions;