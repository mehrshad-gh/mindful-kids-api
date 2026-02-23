-- Seed psychologist profiles (name, specialty, bio, rating, location, languages)
-- Safe to re-run: inserts only when name not already present.

INSERT INTO psychologists (name, specialty, specialization, bio, rating, location, languages, is_active)
SELECT
  'Dr. Sarah Chen',
  'Child therapy',
  ARRAY['child therapy', 'play therapy', 'developmental'],
  E'Clinical psychologist specializing in child and family therapy. Over 12 years supporting children with emotional and behavioral challenges using evidence-based play and attachment-informed approaches.',
  4.8,
  'San Francisco, CA',
  ARRAY['English', 'Mandarin'],
  true
WHERE NOT EXISTS (SELECT 1 FROM psychologists WHERE name = 'Dr. Sarah Chen');

INSERT INTO psychologists (name, specialty, specialization, bio, rating, location, languages, is_active)
SELECT
  'Dr. James Okonkwo',
  'Anxiety',
  ARRAY['anxiety', 'CBT', 'child anxiety'],
  E'Licensed psychologist focused on anxiety disorders in children and teens. Uses cognitive behavioral therapy (CBT) and exposure techniques. Passionate about helping families understand and manage worry.',
  4.6,
  'Chicago, IL',
  ARRAY['English'],
  true
WHERE NOT EXISTS (SELECT 1 FROM psychologists WHERE name = 'Dr. James Okonkwo');

INSERT INTO psychologists (name, specialty, specialization, bio, rating, location, languages, is_active)
SELECT
  'Dr. Elena Vasquez',
  'Parenting',
  ARRAY['parenting', 'parent-child attachment', 'behavior'],
  E'Child and family psychologist with expertise in parenting support and attachment. Trained in CPRT and PCIT. Works with parents to strengthen relationships and reduce conflict at home.',
  4.9,
  'Austin, TX',
  ARRAY['English', 'Spanish'],
  true
WHERE NOT EXISTS (SELECT 1 FROM psychologists WHERE name = 'Dr. Elena Vasquez');

INSERT INTO psychologists (name, specialty, specialization, bio, rating, location, languages, is_active)
SELECT
  'Dr. Michael Torres',
  'Child therapy',
  ARRAY['child therapy', 'trauma', 'ADHD'],
  E'Clinical child psychologist specializing in trauma-informed care and ADHD assessment and intervention. Former school psychologist; experienced with learning and behavior in school and home settings.',
  4.5,
  'Denver, CO',
  ARRAY['English', 'Spanish'],
  true
WHERE NOT EXISTS (SELECT 1 FROM psychologists WHERE name = 'Dr. Michael Torres');

INSERT INTO psychologists (name, specialty, specialization, bio, rating, location, languages, is_active)
SELECT
  'Dr. Priya Sharma',
  'Anxiety',
  ARRAY['anxiety', 'parenting', 'mindfulness'],
  E'Psychologist supporting children and parents with anxiety and stress. Integrates mindfulness and CBT. Offers both individual child sessions and parent coaching for consistent support at home.',
  4.7,
  'Seattle, WA',
  ARRAY['English', 'Hindi'],
  true
WHERE NOT EXISTS (SELECT 1 FROM psychologists WHERE name = 'Dr. Priya Sharma');
