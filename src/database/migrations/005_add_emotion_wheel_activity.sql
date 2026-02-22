-- Add Emotion Wheel activity (CBT - Emotion Identification)
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
  instructions
) VALUES (
  'Emotion Wheel',
  'emotion-wheel',
  'Identify feelings using an interactive emotion wheel',
  'cbt',
  ARRAY['4-12'],
  'CBT - Emotion Identification',
  NULL,
  NULL,
  4,
  'Tap the feeling that matches how you feel'
)
ON CONFLICT (slug) DO NOTHING;
