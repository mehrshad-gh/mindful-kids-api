/**
 * Core emotional skill-building domains for Mindful Kids.
 * "Mindful Kids helps parents respond better to their child's big emotions — every day."
 * This is skill-building, not therapy, diagnosis, or clinical care.
 */

export const EMOTIONAL_DOMAINS = [
  {
    id: 'emotional_awareness',
    title: 'Understanding Feelings',
    description: 'Learn to notice and name emotions.',
  },
  {
    id: 'self_regulation',
    title: 'Calming the Body',
    description: 'Learn skills to calm strong feelings.',
  },
  {
    id: 'problem_solving',
    title: 'Solving Problems',
    description: 'Learn what to do when things go wrong.',
  },
  {
    id: 'social_connection',
    title: 'Building Relationships',
    description: 'Learn to listen, share, and repair.',
  },
  {
    id: 'resilience',
    title: 'Growing Through Challenges',
    description: 'Learn to try again and build confidence.',
  },
] as const;

export type EmotionalDomainId = (typeof EMOTIONAL_DOMAINS)[number]['id'];
