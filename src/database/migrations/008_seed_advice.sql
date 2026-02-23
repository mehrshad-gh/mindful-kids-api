-- Seed daily parenting advice (title, content, psychology_basis, age_range)
-- Inserts only if title not already present so migration is safe to re-run.

INSERT INTO advice (title, content, category, psychology_basis, age_range, is_daily)
SELECT 'Emotion naming guidance', E'Help your child put feelings into words. When you notice a big feeling, name it simply: "You look frustrated" or "That made you really happy." Don’t rush to fix it—just naming the emotion helps the brain regulate and shows your child you see them. Offer choices if they’re stuck: "Are you more sad or more angry right now?"', 'emotions', 'CBT - Emotion identification and labeling', '3-12', false
WHERE NOT EXISTS (SELECT 1 FROM advice WHERE title = 'Emotion naming guidance');

INSERT INTO advice (title, content, category, psychology_basis, age_range, is_daily)
SELECT 'Reflective listening tip', E'Repeat back what your child says in your own words, without adding advice or questions. If they say "I don’t want to go to school," try "You really don’t want to go today." This reflective listening shows you’re paying attention and often helps children open up or calm down because they feel heard.', 'communication', 'CPRT - Reflective listening', '3-10', false
WHERE NOT EXISTS (SELECT 1 FROM advice WHERE title = 'Reflective listening tip');

INSERT INTO advice (title, content, category, psychology_basis, age_range, is_daily)
SELECT 'Co-regulation strategy', E'When your child is upset, your calm presence helps their nervous system settle. Stay nearby, keep your voice soft, and match their energy only slightly (e.g. a gentle hand on their back). You don’t have to say much—co-regulation is about "we’re in this together" so they can borrow your calm until they find their own.', 'regulation', 'Attachment & polyvagal-informed co-regulation', '2-10', false
WHERE NOT EXISTS (SELECT 1 FROM advice WHERE title = 'Co-regulation strategy');

INSERT INTO advice (title, content, category, psychology_basis, age_range, is_daily)
SELECT 'Positive reinforcement method', E'Notice and name the behaviour you want more of. Instead of only correcting, say what they did well: "You used your words when you were upset" or "You sat still for the whole story." Be specific and timely. This positive reinforcement makes good behaviour more likely and builds your child’s sense of competence.', 'behaviour', 'Behavioural psychology - Positive reinforcement', '3-12', false
WHERE NOT EXISTS (SELECT 1 FROM advice WHERE title = 'Positive reinforcement method');

INSERT INTO advice (title, content, category, psychology_basis, age_range, is_daily)
SELECT 'Calm-down routine', E'Create a short, repeatable routine for when things get big: e.g. "Let’s do three breaths together, then we’ll figure it out." Practice when they’re already calm so the routine is familiar in moments of stress. Keep it simple—same place, same steps—so their brain can latch onto the pattern and shift out of fight-or-flight.', 'regulation', 'DBT-informed distress tolerance & routines', '4-12', false
WHERE NOT EXISTS (SELECT 1 FROM advice WHERE title = 'Calm-down routine');
