-- Optional domain_id for daily tips: when set, suggestions can recommend a kid tool in that domain.
UPDATE daily_tips SET domain_id = 'emotional_awareness' WHERE title = 'Emotion naming' AND domain_id IS NULL;
UPDATE daily_tips SET domain_id = 'self_regulation' WHERE title = 'Calm-down coaching' AND domain_id IS NULL;
UPDATE daily_tips SET domain_id = 'emotional_awareness' WHERE title = 'Reflective listening' AND domain_id IS NULL;
UPDATE daily_tips SET domain_id = 'social_connection' WHERE title = 'Child-directed play' AND domain_id IS NULL;
UPDATE daily_tips SET domain_id = 'resilience' WHERE title = 'Positive reinforcement' AND domain_id IS NULL;
