-- =============================================================================
-- Emotional awareness domain: add 3 new skill-building tools (no therapy claims).
-- All tools map to domain_id = 'emotional_awareness'.
-- Language: build awareness skills, practice noticing feelings, grow emotional vocabulary.
-- =============================================================================

-- Order emotional_awareness tools: Emotion Wheel, Mood Check-in, then 3 new
UPDATE activities SET sort_order = 1 WHERE slug = 'emotion-wheel' AND domain_id = 'emotional_awareness';
UPDATE activities SET sort_order = 2, title = 'Mood Check-in' WHERE slug = 'emotion-identification-cbt' AND domain_id = 'emotional_awareness';

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
  'Emotion Match',
  'emotion_match_game',
  'Build awareness skills by matching faces and emotion words. Practice noticing feelings and grow your emotional vocabulary.',
  'other',
  ARRAY['3-5', '6-8', '9-12'],
  'Emotion recognition and labeling for emotional awareness.',
  'Play together and name feelings as you match. Keep it light.',
  3,
  3,
  true,
  'Tap the face that matches the emotion word. Do 3 rounds.',
  'emotional_awareness'
),
(
  'Where Do I Feel It?',
  'body_signals_map',
  'Practice noticing where feelings show up in your body. Build awareness skills by connecting feelings to body signals.',
  'other',
  ARRAY['6-8', '9-12', '13+'],
  'Body awareness and interoception for emotional literacy.',
  'Help your child point to where they feel things. No right or wrong.',
  2,
  4,
  true,
  'Tap 1 to 3 body areas where you feel the feeling.',
  'emotional_awareness'
),
(
  'How Big Is The Feeling?',
  'feeling_intensity_check',
  'Practice noticing how strong a feeling is. Learn to name feelings and notice their size—small, medium, or big.',
  'other',
  ARRAY['6-8', '9-12', '13+'],
  'Emotion intensity and vocabulary for self-awareness.',
  'Use the slider together. All sizes are okay.',
  2,
  5,
  true,
  'Pick a feeling, then move the slider from small to big.',
  'emotional_awareness'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  domain_id = EXCLUDED.domain_id,
  instructions = EXCLUDED.instructions,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
