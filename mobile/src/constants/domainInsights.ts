/**
 * Non-clinical parent insights per emotional domain.
 * Used when a child has practiced a domain consistently (sessions >= 5).
 * No diagnosis, evaluation, or mental health claims.
 */

export type DomainInsightTier = 'growing' | 'strong';

export interface DomainInsightContent {
  message: string;
  explanation: string;
  prompt: string;
}

export const DOMAIN_INSIGHTS: Record<
  string,
  { growing: DomainInsightContent; strong: DomainInsightContent }
> = {
  emotional_awareness: {
    growing: {
      message: "You're building emotional awareness together.",
      explanation: 'Noticing feelings helps children understand themselves and communicate better.',
      prompt: 'Try asking tonight: "What feeling showed up most today?"',
    },
    strong: {
      message: 'Emotional awareness is becoming a strong skill.',
      explanation: 'Children who can name feelings often find it easier to talk through challenges.',
      prompt: 'Try asking: "When did you notice a feeling change today?"',
    },
  },

  self_regulation: {
    growing: {
      message: "You're practicing calming skills together.",
      explanation: 'Learning how to slow down helps children respond instead of react.',
      prompt: 'Try asking: "What helped your body feel calm today?"',
    },
    strong: {
      message: 'Calming skills are becoming more natural.',
      explanation: 'With practice, children can reset faster during tough moments.',
      prompt: 'Ask: "What calm tool worked best for you recently?"',
    },
  },

  problem_solving: {
    growing: {
      message: "You're building problem-solving skills.",
      explanation: 'Practicing choices helps children think through situations.',
      prompt: 'Ask: "What\'s one thing you could try next time?"',
    },
    strong: {
      message: 'Problem-solving is becoming confident thinking.',
      explanation: 'Children who practice solutions often recover faster from mistakes.',
      prompt: 'Ask: "What helped you figure it out?"',
    },
  },

  social_connection: {
    growing: {
      message: "You're strengthening connection skills.",
      explanation: 'Practicing kind words and listening builds healthy relationships.',
      prompt: 'Ask: "When did you use kind words today?"',
    },
    strong: {
      message: 'Connection skills are becoming strong habits.',
      explanation: 'Children who practice repair and listening build trust with others.',
      prompt: 'Ask: "How did you help someone feel heard?"',
    },
  },

  resilience: {
    growing: {
      message: "You're building resilience together.",
      explanation: 'Trying again helps children grow confidence over time.',
      prompt: 'Ask: "What did you keep trying even when it was hard?"',
    },
    strong: {
      message: "Resilience is becoming part of your child's mindset.",
      explanation: 'Children who notice effort learn that growth takes practice.',
      prompt: 'Ask: "What are you proud of trying recently?"',
    },
  },
};
