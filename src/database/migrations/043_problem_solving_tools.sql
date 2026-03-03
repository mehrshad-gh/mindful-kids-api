-- =============================================================================
-- Problem solving domain: add 3 skill-building tools (no therapy/diagnosis language).
-- All tools map to domain_id = 'problem_solving'.
-- Language: practice solving problems, build thinking skills, learn what to do next.
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
  'Problem Ladder',
  'problem_ladder',
  'Practice solving problems by breaking them into small steps. Build thinking skills and learn what to do next when things go wrong.',
  'other',
  ARRAY['6-8', '9-12', '13+'],
  'Problem-solving and step-by-step thinking.',
  'Do this together when things are calm. Keep it simple and supportive.',
  3,
  1,
  true,
  'Pick what happened, then choose 2 things you could do, and pick one to try.',
  'problem_solving'
),
(
  'Fix It Plan',
  'fix_it_plan',
  'Learn how to repair mistakes and make things better. Practice solving problems by choosing what could help after something goes wrong.',
  'other',
  ARRAY['6-8', '9-12', '13+'],
  'Repair and making amends as skill-building.',
  'Use when your child is ready to think about fixing things. No blame.',
  2,
  2,
  true,
  'Think about whether someone got hurt or upset, then pick what could make it better.',
  'problem_solving'
),
(
  'Try Again',
  'try_again_tool',
  'Practice thinking about what to do differently next time. Build thinking skills so you can try again when things don''t go how you wanted.',
  'other',
  ARRAY['6-8', '9-12', '13+'],
  'Reflection and next-step planning.',
  'Keep it forward-looking and hopeful.',
  2,
  3,
  true,
  'Name what didn''t go how you wanted, then pick what you could try next time.',
  'problem_solving'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  domain_id = EXCLUDED.domain_id,
  instructions = EXCLUDED.instructions,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
