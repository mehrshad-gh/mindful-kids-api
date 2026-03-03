-- =============================================================================
-- Social connection domain: add 3 skill-building tools (no clinical claims).
-- All tools map to domain_id = 'social_connection'.
-- Language: practice connecting, build friendship skills, learn how to make it right.
-- =============================================================================

INSERT INTO activities (
  title,
  slug,
  description,
  activity_type,
  age_groups,
  psychology_basis,
  for_parents_notes,
  duration_minutes,
  sort_order,
  is_active,
  instructions,
  domain_id
) VALUES
(
  'Kind Words',
  'kind_words_builder',
  'Practice connecting by choosing kind words when you talk to someone. Build friendship skills and learn how words can help.',
  'other',
  ARRAY['3-5', '6-8', '9-12'],
  'Social communication and prosocial language.',
  'Do this when things are calm. Praise any attempt at kind words.',
  2,
  1,
  true,
  'Pick a situation, then choose a kind sentence you could say.',
  'social_connection'
),
(
  'Listening Game',
  'listening_game',
  'Practice listening with your eyes, ears, and body. Build friendship skills by showing others you care about what they say.',
  'other',
  ARRAY['3-5', '6-8', '9-12'],
  'Active listening and attunement as skills.',
  'Play together. Model the steps first.',
  2,
  2,
  true,
  'Look at the person, listen with your ears, keep your body calm.',
  'social_connection'
),
(
  'Make It Right',
  'repair_script',
  'Practice how to repair a relationship after a mistake. Learn how to make it right and build connection again.',
  'other',
  ARRAY['6-8', '9-12', '13+'],
  'Repair and reconnection as skill-building.',
  'Use when your child is ready. Keep it simple and hopeful.',
  3,
  3,
  true,
  'Pick what happened, choose a repair action, then pick a promise for next time.',
  'social_connection'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  domain_id = EXCLUDED.domain_id,
  instructions = EXCLUDED.instructions,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
