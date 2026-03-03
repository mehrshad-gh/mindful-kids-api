-- =============================================================================
-- Self-regulation domain: add 3 new skill-building tools (no therapy claims).
-- =============================================================================

-- Activity type may need 'other' for non-CBT/DBT/CPRT tools (schema allows: cprt, cbt, dbt, act, other)
-- Ensure we have 'other' in the check if not already (some schemas may have been extended)
-- Insert 3 new activities with domain_id = 'self_regulation'

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
  'Grounding 5-4-3-2-1',
  'grounding_54321',
  'Build calm skills by noticing 5 things you see, 4 you feel, 3 you hear, 2 you smell, and 1 you like. Practice slowing down and connecting with the present moment.',
  'other',
  ARRAY['6-8', '9-12', '13+'],
  'Grounding and present-moment awareness for self-regulation.',
  'Do this together when your child is overwhelmed. Keep it light and playful.',
  3,
  10,
  true,
  E'1. Name 5 things you can see.\n2. Name 4 things you can feel (feet on floor, shirt on skin).\n3. Name 3 things you can hear.\n4. Name 2 things you can smell.\n5. Name 1 thing you like.',
  'self_regulation'
),
(
  'Calm Body Reset',
  'calm_body_reset',
  'Learn to reset your body with a 30-second movement break: jump, stretch, and shake your arms. Build calm skills by moving and releasing tension.',
  'other',
  ARRAY['3-5', '6-8', '9-12'],
  'Movement and body-based regulation.',
  'Use when your child is wound up or needs a quick reset. Keep it fun.',
  1,
  11,
  true,
  E'1. Jump in place 5 times.\n2. Stretch your arms up high, then touch your toes.\n3. Shake your arms and hands like a wobbly jelly.',
  'self_regulation'
),
(
  'Pause & Choose',
  'pause_and_choose',
  'Practice slowing down: stop, take one breath, then choose what to do next. Build skills to respond instead of react when things go wrong.',
  'other',
  ARRAY['6-8', '9-12', '13+'],
  'Pause and response choice for self-regulation.',
  'Practice when calm so the steps feel familiar in tough moments.',
  2,
  12,
  true,
  E'1. What happened? (Notice without judging.)\n2. Take one slow breath.\n3. What could you choose to do next?',
  'self_regulation'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  domain_id = EXCLUDED.domain_id,
  instructions = EXCLUDED.instructions,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
