import type { ProgressSummary } from '../api/progress';

const EMOTION_SHORT_TIPS: Record<string, string> = {
  happy: 'They’re in a good place — a short chat or play can build on that.',
  sad: 'A moment of comfort and listening can help.',
  angry: 'Strong feelings are normal; a calm-down activity when they’re ready can help.',
  scared: 'Reassurance and a calm presence go a long way.',
  calm: 'Good time for connection or a low-key activity.',
  excited: 'Channel the energy with a quick game or shared activity.',
  worried: 'Listening without fixing often helps.',
  tired: 'Rest and low stimulation may be what they need.',
  loved: 'A small moment of attention can reinforce that.',
  surprised: 'Check in — is it a good or overwhelming surprise?',
};

function isRecent(iso: string, hoursAgo: number): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (now.getTime() - d.getTime()) / (1000 * 60 * 60) <= hoursAgo;
}

function completedRecently(summary: ProgressSummary): boolean {
  if (!summary.recent_completions?.length) return false;
  return isRecent(summary.recent_completions[0].completed_at, 48);
}

function emotionCheckedRecently(summary: ProgressSummary): boolean {
  if (!summary.last_emotion) return false;
  return isRecent(summary.last_emotion.completed_at, 48);
}

/**
 * Generate a short, supportive parent insight from progress summary
 * (recent emotions, activity frequency, streak consistency).
 */
export function getParentInsight(
  summary: ProgressSummary | null,
  childName: string
): string {
  if (!summary) {
    return `When ${childName} tries activities and emotion check-ins, you’ll see a supportive insight here.`;
  }

  const hasActivities = summary.completed_count > 0;
  const hasEmotion = !!summary.last_emotion;
  const streak = summary.current_streak ?? 0;
  const activeRecently = completedRecently(summary);
  const emotionRecently = emotionCheckedRecently(summary);

  if (!hasActivities && !hasEmotion) {
    return `When ${childName} does activities and emotion check-ins, you’ll see a short insight here.`;
  }

  const parts: string[] = [];

  // Streak
  if (streak >= 3) {
    parts.push(`${streak}-day streak — that consistency really helps.`);
  } else if (streak >= 1) {
    parts.push(`Streak started; every day counts.`);
  } else if (hasActivities) {
    parts.push(`A small routine can help — even one activity can start a streak.`);
  }

  // Recent activity
  if (activeRecently && hasActivities) {
    parts.push(`They’ve been active lately.`);
  } else if (hasActivities && !activeRecently) {
    parts.push(`A quick activity together could be a nice moment today.`);
  }

  // Recent emotion
  if (summary.last_emotion) {
    const tip =
      EMOTION_SHORT_TIPS[summary.last_emotion.emotion] ??
      'Noting how they feel helps you respond with care.';
    if (emotionRecently) {
      parts.push(tip);
    } else if (!parts.length) {
      parts.push(tip);
    }
  }

  if (parts.length === 0) {
    return `You’re doing a good job supporting ${childName}. Keep the gentle structure going.`;
  }

  return parts.slice(0, 2).join(' ');
}
