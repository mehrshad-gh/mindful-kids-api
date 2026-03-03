-- =============================================================================
-- Resilience domain: add 3 skill-building tools (no clinical claims).
-- All tools map to domain_id = 'resilience'.
-- Language: practice trying again, build confidence, notice effort.
-- Avoid: exposure therapy terms, anxiety language, treatment/intervention.
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
  'Small Wins',
  'small_wins',
  'Practice noticing effort and small progress each day. Build confidence by naming what you tried.',
  'other',
  ARRAY['3-5', '6-8', '9-12'],
  'Strength-based reflection and growth mindset.',
  'Celebrate any effort. Keep it simple and positive.',
  2,
  1,
  true,
  'Pick what you tried today, then choose a win statement.',
  'resilience'
),
(
  'Try Again Plan',
  'try_again_plan',
  'Practice making a simple plan when something is hard. Build confidence by choosing a next step and encouragement.',
  'other',
  ARRAY['6-8', '9-12', '13+'],
  'Coping and persistence as skill-building.',
  'Do this when things are calm. Focus on one step at a time.',
  3,
  2,
  true,
  'Pick a challenge, choose a next step, then pick encouragement.',
  'resilience'
),
(
  'Brave Steps',
  'brave_steps',
  'Practice taking one small brave step safely. Build confidence by choosing a step and support that feel right.',
  'other',
  ARRAY['6-8', '9-12', '13+'],
  'Courage and self-efficacy as skill-building.',
  'Keep steps small and safe. Support their choice.',
  2,
  3,
  true,
  'Pick a safe brave step, then choose how you want support.',
  'resilience'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  domain_id = EXCLUDED.domain_id,
  instructions = EXCLUDED.instructions,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
