/**
 * Child-friendly emotion set for the wheel.
 * id used for backend; label + emoji for display.
 */
export interface EmotionOption {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export const DEFAULT_EMOTIONS: EmotionOption[] = [
  { id: 'happy', label: 'Happy', emoji: '😊', color: '#FFD93D' },
  { id: 'calm', label: 'Calm', emoji: '😌', color: '#6BCB77' },
  { id: 'excited', label: 'Excited', emoji: '🤩', color: '#FF6B6B' },
  { id: 'loved', label: 'Loved', emoji: '🥰', color: '#FF8FAB' },
  { id: 'sad', label: 'Sad', emoji: '😢', color: '#4D96FF' },
  { id: 'worried', label: 'Worried', emoji: '😟', color: '#9B59B6' },
  { id: 'angry', label: 'Angry', emoji: '😠', color: '#E74C3C' },
  { id: 'scared', label: 'Scared', emoji: '😨', color: '#95A5A6' },
  { id: 'tired', label: 'Tired', emoji: '😴', color: '#A0A0A0' },
  { id: 'surprised', label: 'Surprised', emoji: '😲', color: '#F39C12' },
];
