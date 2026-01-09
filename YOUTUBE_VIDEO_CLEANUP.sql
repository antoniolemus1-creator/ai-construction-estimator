-- Cleanup and management queries for YouTube video analysis

-- Delete all analyzed YouTube videos
DELETE FROM analyzed_videos;

-- Delete all AI learning questions
DELETE FROM ai_learning_questions;

-- Delete all AI learning metrics
DELETE FROM ai_learning_metrics;

-- Delete all knowledge graph nodes
DELETE FROM knowledge_graph_nodes;

-- Delete all knowledge graph edges
DELETE FROM knowledge_graph_edges;

-- Reset sequences if needed
-- (No sequences to reset as we use gen_random_uuid())

-- View current data counts
SELECT 
  (SELECT COUNT(*) FROM analyzed_videos) as analyzed_videos_count,
  (SELECT COUNT(*) FROM ai_learning_questions) as questions_count,
  (SELECT COUNT(*) FROM ai_learning_metrics) as metrics_count,
  (SELECT COUNT(*) FROM knowledge_graph_nodes) as nodes_count,
  (SELECT COUNT(*) FROM knowledge_graph_edges) as edges_count;
