/**
 * Sticker IDs and display names for the child sticker book.
 * Cosmetic only – earned by completing daily quests.
 */

export const STICKER_IDS = [
  'star',
  'rocket',
  'rainbow',
  'trophy',
  'flower',
  'planet',
  'heart',
  'smile',
  'shield',
  'sparkle',
] as const;

export type StickerId = (typeof STICKER_IDS)[number];

export const STICKER_NAMES: Record<StickerId, string> = {
  star: 'Star',
  rocket: 'Rocket',
  rainbow: 'Rainbow',
  trophy: 'Trophy',
  flower: 'Flower',
  planet: 'Planet',
  heart: 'Heart',
  smile: 'Smile',
  shield: 'Shield',
  sparkle: 'Sparkle',
};

export const STICKER_EMOJI: Record<StickerId, string> = {
  star: '⭐',
  rocket: '🚀',
  rainbow: '🌈',
  trophy: '🏆',
  flower: '🌸',
  planet: '🪐',
  heart: '❤️',
  smile: '😊',
  shield: '🛡️',
  sparkle: '✨',
};
