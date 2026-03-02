-- =============================================================================
-- Phase 7: seed 5 daily tips (reflective listening, emotion naming, calm-down, positive reinforcement, child-directed play)
-- =============================================================================

INSERT INTO daily_tips (title, content, psychology_basis, is_active)
SELECT 'Reflective listening', E'Repeat back what your child said in your own words—without adding advice or questions. Example: they say "I don''t want to go to school." You say "You really don''t want to go today." Often that alone helps them feel heard and calmer.', 'CPRT - Reflective listening', true
WHERE NOT EXISTS (SELECT 1 FROM daily_tips WHERE title = 'Reflective listening');

INSERT INTO daily_tips (title, content, psychology_basis, is_active)
SELECT 'Emotion naming', E'When you notice a big feeling, name it simply: "You look frustrated" or "That made you really happy." Don''t rush to fix it—naming the emotion helps the brain regulate and shows your child you see them.', 'CBT - Emotion identification and labeling', true
WHERE NOT EXISTS (SELECT 1 FROM daily_tips WHERE title = 'Emotion naming');

INSERT INTO daily_tips (title, content, psychology_basis, is_active)
SELECT 'Calm-down coaching', E'Create a short, repeatable routine for when things get big: e.g. "Let''s do three breaths together, then we''ll figure it out." Practice when they''re already calm so the routine is familiar in moments of stress.', 'DBT-informed distress tolerance & routines', true
WHERE NOT EXISTS (SELECT 1 FROM daily_tips WHERE title = 'Calm-down coaching');

INSERT INTO daily_tips (title, content, psychology_basis, is_active)
SELECT 'Positive reinforcement', E'Notice and name the behaviour you want more of. Instead of only correcting, say what they did well: "You used your words when you were upset" or "You sat still for the whole story." Be specific and timely.', 'Behavioural psychology - Positive reinforcement', true
WHERE NOT EXISTS (SELECT 1 FROM daily_tips WHERE title = 'Positive reinforcement');

INSERT INTO daily_tips (title, content, psychology_basis, is_active)
SELECT 'Child-directed play', E'Spend 5–10 minutes letting your child lead play. You follow their rules, describe what they do without directing, and avoid teaching. This builds connection and shows you value their world.', 'Child-Centered Play Therapy (CCPT) principles', true
WHERE NOT EXISTS (SELECT 1 FROM daily_tips WHERE title = 'Child-directed play');

