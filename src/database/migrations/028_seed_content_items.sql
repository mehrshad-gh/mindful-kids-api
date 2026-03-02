-- =============================================================================
-- Phase 6: seed 5 articles, 3 videos, 5 activities (published)
-- =============================================================================

-- Articles (parent resources)
INSERT INTO content_items (type, title, summary, body_markdown, age_range, tags, psychology_basis, for_parents_notes, evidence_notes, is_published, published_at)
SELECT 'article', 'Understanding Your Child''s Big Feelings', 'How to recognize and respond when emotions run high.', E'## Why emotions feel big\nChildren''s brains are still developing the ability to regulate. What looks like "overreacting" is often their nervous system doing its best.\n\n## What helps\n- Name the feeling: "You seem really frustrated."\n- Stay calm and present.\n- Offer a simple choice once they''re a bit calmer.', '3-12', ARRAY['emotions', 'regulation', 'parenting'], ARRAY['Emotion labeling', 'Co-regulation'], 'Practice naming your own feelings out loud so your child learns the language.', 'Emotion labeling supports emotional awareness (e.g. Lieberman et al.).', true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM content_items WHERE type = 'article' AND title = 'Understanding Your Child''s Big Feelings');

INSERT INTO content_items (type, title, summary, body_markdown, age_range, tags, psychology_basis, for_parents_notes, evidence_notes, is_published, published_at)
SELECT 'article', 'The Power of Reflective Listening', 'Repeat back what your child says so they feel heard.', E'## What is reflective listening?\nYou mirror back the meaning (and sometimes the feeling) of what your child said, without adding advice or questions.\n\n## Example\nChild: "I don''t want to go to school."\nYou: "You really don''t want to go today."\n\nOften that alone helps them open up or calm down.', '3-10', ARRAY['communication', 'listening'], ARRAY['CPRT - Reflective listening'], 'Keep it to one or two sentences. Less is more.', null, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM content_items WHERE type = 'article' AND title = 'The Power of Reflective Listening');

INSERT INTO content_items (type, title, summary, body_markdown, age_range, tags, psychology_basis, for_parents_notes, evidence_notes, is_published, published_at)
SELECT 'article', 'Building a Calm-Down Routine', 'A short, repeatable routine helps kids shift from stress to calm.', E'## Why routines help\nPredictable steps give the brain something to latch onto instead of the stressor. Practice when things are calm so the routine is familiar in the moment.\n\n## Simple template\n1. Pause (e.g. "Let''s take a breath.")\n2. Do 2–3 breaths or a physical anchor (feet on floor, hands on knees).\n3. One calm phrase: "We''re okay. We can figure this out."', '4-12', ARRAY['regulation', 'routines'], ARRAY['DBT-informed distress tolerance'], 'Same place and same steps each time increases effectiveness.', null, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM content_items WHERE type = 'article' AND title = 'Building a Calm-Down Routine');

INSERT INTO content_items (type, title, summary, body_markdown, age_range, tags, psychology_basis, for_parents_notes, evidence_notes, is_published, published_at)
SELECT 'article', 'When to Worry: Normal Stress vs. Needing Support', 'Guidance on when everyday worry might need professional attention.', E'## Normal stress\nWorry before a test, shyness in new situations, or occasional meltdowns are common. They often improve with consistency and time.\n\n## When to consider extra support\n- Big changes in sleep, appetite, or mood that last weeks\n- Avoiding school or friends consistently\n- Talk of hurting themselves or others\n- Your gut says something is off\n\nWhen in doubt, a check-in with your paediatrician or a mental health professional can bring clarity.', '6-12', ARRAY['mental health', 'support'], ARRAY['Developmental norms'], 'You know your child best. Trust your instincts and seek support early if needed.', null, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM content_items WHERE type = 'article' AND title = 'When to Worry: Normal Stress vs. Needing Support');

INSERT INTO content_items (type, title, summary, body_markdown, age_range, tags, psychology_basis, for_parents_notes, evidence_notes, is_published, published_at)
SELECT 'article', 'Positive Reinforcement That Works', 'Catch the behaviour you want and name it.', E'## The idea\nNotice and name what your child did well—specifically and soon after it happens. "You used your words when you were upset." This makes the behaviour more likely and builds competence.\n\n## Tips\n- Be specific, not vague ("You shared the blocks" vs "You were good").\n- Don''t mix with a criticism in the same breath.\n- Focus on effort and process, not only outcomes.', '3-12', ARRAY['behaviour', 'positive reinforcement'], ARRAY['Behavioural psychology - Positive reinforcement'], 'Aim for a few genuine comments per day rather than constant praise.', null, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM content_items WHERE type = 'article' AND title = 'Positive Reinforcement That Works');

-- Videos (parent resources; video_url placeholder)
INSERT INTO content_items (type, title, summary, body_markdown, video_url, age_range, tags, psychology_basis, for_parents_notes, evidence_notes, is_published, published_at)
SELECT 'video', 'Co-Regulation in 5 Minutes', 'How your calm presence helps your child regulate.', null, 'https://example.com/videos/co-regulation', '2-10', ARRAY['regulation', 'co-regulation'], ARRAY['Attachment & polyvagal-informed co-regulation'], 'Watch when you''re calm so you can try one thing next time.', null, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM content_items WHERE type = 'video' AND title = 'Co-Regulation in 5 Minutes');

INSERT INTO content_items (type, title, summary, body_markdown, video_url, age_range, tags, psychology_basis, for_parents_notes, evidence_notes, is_published, published_at)
SELECT 'video', 'Emotion Coaching: Step by Step', 'Name, validate, and then problem-solve with your child.', null, 'https://example.com/videos/emotion-coaching', '3-12', ARRAY['emotions', 'coaching'], ARRAY['Emotion-focused parenting'], 'Pause the video and practice one step before moving on.', null, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM content_items WHERE type = 'video' AND title = 'Emotion Coaching: Step by Step');

INSERT INTO content_items (type, title, summary, body_markdown, video_url, age_range, tags, psychology_basis, for_parents_notes, evidence_notes, is_published, published_at)
SELECT 'video', 'Setting Limits with Kindness', 'Clear boundaries without shame or blame.', null, 'https://example.com/videos/limits-kindness', '3-10', ARRAY['boundaries', 'discipline'], ARRAY['Authoritative parenting'], 'Pick one limit to be consistent about this week.', null, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM content_items WHERE type = 'video' AND title = 'Setting Limits with Kindness');

-- Activities (kids; body_markdown = steps / instructions)
INSERT INTO content_items (type, title, summary, body_markdown, age_range, tags, psychology_basis, for_parents_notes, evidence_notes, is_published, published_at)
SELECT 'activity', 'Balloon Breathing', 'A simple breathing exercise to feel calmer.', E'## Steps\n1. Sit comfortably and imagine you have a balloon in your tummy.\n2. Breathe in slowly through your nose and let the balloon get big.\n3. Breathe out slowly through your mouth and watch the balloon get smaller.\n4. Do this 3–5 times together.', '3-8', ARRAY['breathing', 'calm'], ARRAY['Mindfulness', 'Self-regulation'], 'Do it with your child. Keep it short; a few breaths are enough.', null, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM content_items WHERE type = 'activity' AND title = 'Balloon Breathing');

INSERT INTO content_items (type, title, summary, body_markdown, age_range, tags, psychology_basis, for_parents_notes, evidence_notes, is_published, published_at)
SELECT 'activity', 'Feeling Faces', 'Match faces to feelings and names.', E'## Steps\n1. Look at the feeling faces (happy, sad, angry, scared, excited).\n2. Point to the face that shows how you feel right now.\n3. Say the name of that feeling.\n4. If you want, draw your own feeling face.', '3-6', ARRAY['emotions', 'naming'], ARRAY['Emotion identification and labeling'], 'No wrong answers. If they say "tired" or "bored," that counts.', null, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM content_items WHERE type = 'activity' AND title = 'Feeling Faces');

INSERT INTO content_items (type, title, summary, body_markdown, age_range, tags, psychology_basis, for_parents_notes, evidence_notes, is_published, published_at)
SELECT 'activity', 'My Calm Corner', 'Design a small space that feels safe and calm.', E'## Steps\n1. Choose a corner or spot (e.g. by a cushion, under a blanket).\n2. Add one or two things that help you feel calm (a soft toy, a book).\n3. Decide one thing you can do there when you need to calm down (e.g. 3 breaths, count to 5).\n4. Practice going there when you''re already calm so it feels familiar.', '4-10', ARRAY['calm', 'space', 'regulation'], ARRAY['Coping space', 'Behavioural rehearsal'], 'Use it together at first. Keep it low-stimulation.', null, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM content_items WHERE type = 'activity' AND title = 'My Calm Corner');

INSERT INTO content_items (type, title, summary, body_markdown, age_range, tags, psychology_basis, for_parents_notes, evidence_notes, is_published, published_at)
SELECT 'activity', 'Gratitude Stones', 'Pick a stone and think of one good thing.', E'## Steps\n1. Hold a small stone (or any object) in your hand.\n2. Think of one thing that was good today (big or small).\n3. Say it out loud or in your head: "I am grateful for…"\n4. Put the stone in a special place or pass it to a family member to share theirs.', '5-12', ARRAY['gratitude', 'mindfulness'], ARRAY['Positive psychology', 'Gratitude practice'], 'Model first: share one thing you''re grateful for.', null, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM content_items WHERE type = 'activity' AND title = 'Gratitude Stones');

INSERT INTO content_items (type, title, summary, body_markdown, age_range, tags, psychology_basis, for_parents_notes, evidence_notes, is_published, published_at)
SELECT 'activity', 'Worry Box', 'Write or draw worries and put them away for later.', E'## Steps\n1. Get a small box and decorate it (optional).\n2. When a worry pops up, draw it or write one word on a slip of paper.\n3. Put the slip in the worry box.\n4. Tell yourself: "I don''t have to think about it right now. It''s in the box."\n5. You can open the box later with a parent to talk about one worry if you want.', '6-12', ARRAY['worry', 'coping'], ARRAY['CBT - Externalization', 'Contained processing'], 'Don''t force opening the box. Let the child lead.', null, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM content_items WHERE type = 'activity' AND title = 'Worry Box');
