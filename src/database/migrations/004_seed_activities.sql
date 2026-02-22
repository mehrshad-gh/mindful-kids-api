-- Seed activities: CBT, CPRT, DBT based
-- Each includes: title, description, age_groups (age_range), activity_type (psychology_method), psychology_basis, instructions

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
) VALUES
(
  'Emotion Identification',
  'emotion-identification-cbt',
  'A simple game to help children notice and name their feelings. Recognizing emotions is the first step in managing them. Based on cognitive behavioral approaches that link thoughts, feelings, and actions.',
  'cbt',
  ARRAY['3-5', '6-8', '9-12'],
  'CBT emphasizes identifying and labeling emotions to reduce overwhelm and increase emotional regulation. Naming feelings helps the brain process them and gives children a sense of control.',
  'Sit with your child and stay curious. If they struggle to name a feeling, offer choices (e.g. "Do you feel more like mad or sad?"). Praise any attempt to identify an emotion.',
  10,
  1,
  E'1. Find a quiet moment and sit together.\n2. Show or point to different faces (e.g. happy, sad, angry, scared) and name each emotion.\n3. Ask: "How are you feeling right now?" and let your child point or say.\n4. If they name a feeling, say: "That makes sense. Thanks for telling me."\n5. You can also play "guess the feeling" by making a face and having them guess.'
),
(
  'Reflective Listening Play',
  'reflective-listening-play-cprt',
  'A short play activity where the adult follows the child''s lead and reflects back what the child says and does. This builds connection and helps the child feel heard and valued.',
  'cprt',
  ARRAY['3-5', '6-8'],
  'Child-Parent Relationship Therapy (CPRT) uses reflective listening and child-directed play to strengthen the attachment and reduce behavioral problems. The child leads; the parent mirrors and describes.',
  'Let your child choose the play. Avoid directing or teaching. Simply describe what they do ("You’re putting the block on top") and reflect feelings when you notice them ("You’re excited it stayed up!").',
  15,
  2,
  E'1. Set a timer for 10–15 minutes. Tell your child: "This is your special time. You can choose what we play."\n2. Let your child lead. Do not suggest activities or correct.\n3. Reflect what they do: "You’re building a tall tower."\n4. Reflect what they say: "You want the red one next."\n5. If they share a feeling, reflect it: "You feel proud of that."\n6. When the timer ends, say: "Special time is over. We can do it again another day."'
),
(
  'Calm Breathing',
  'calm-breathing-dbt',
  'A short, guided breathing exercise to help children slow down and feel calmer when they are stressed or upset. Learning to control the breath is a core skill in emotion regulation.',
  'dbt',
  ARRAY['6-8', '9-12', '13+'],
  'DBT (Dialectical Behavior Therapy) teaches distress tolerance and emotion regulation. Mindful breathing activates the parasympathetic nervous system and helps shift from "fight or flight" to a calmer state.',
  'Practice when your child is already calm so it becomes familiar. When they’re upset, invite them gently: "Want to try our calm breathing?" Keep it short (1–2 minutes) and do it with them.',
  5,
  3,
  E'1. Sit or lie down in a comfortable place.\n2. Put one hand on your belly and one on your chest.\n3. Breathe in slowly through your nose for 3 counts. Feel your belly get a little bigger.\n4. Breathe out slowly through your mouth for 4 counts. Feel your belly go back down.\n5. Repeat 5–10 times. If your mind wanders, gently bring it back to your breath.\n6. When you’re done, notice how your body feels.'
)
ON CONFLICT (slug) DO NOTHING;
