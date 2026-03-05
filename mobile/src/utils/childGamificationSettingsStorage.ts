import AsyncStorage from '@react-native-async-storage/async-storage';
import { setStickers } from './childGamificationStorage';
import { getDailyQuest, setDailyQuest } from './childGamificationStorage';

const SETTINGS_PREFIX = '@mindful_kids_child_gamification_settings:';

function settingsKey(childId: string): string {
  return `${SETTINGS_PREFIX}${childId}`;
}

export interface ChildGamificationSettings {
  dailyQuestEnabled: boolean;
  stickersEnabled: boolean;
  reducedMotion: boolean;
}

const DEFAULTS: ChildGamificationSettings = {
  dailyQuestEnabled: true,
  stickersEnabled: true,
  reducedMotion: false,
};

export async function getChildGamificationSettings(childId: string): Promise<ChildGamificationSettings> {
  try {
    const raw = await AsyncStorage.getItem(settingsKey(childId));
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<ChildGamificationSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function setChildGamificationSettings(
  childId: string,
  partial: Partial<ChildGamificationSettings>
): Promise<void> {
  try {
    const current = await getChildGamificationSettings(childId);
    const next = { ...current, ...partial };
    await AsyncStorage.setItem(settingsKey(childId), JSON.stringify(next));
  } catch {
    // ignore
  }
}

/**
 * Reset sticker book for this child and allow a new sticker to be earned today
 * (clears stickers and sets today's quest claimed=false if present).
 */
export async function resetChildStickers(childId: string): Promise<void> {
  try {
    await setStickers(childId, { owned: [] });
    const quest = await getDailyQuest(childId);
    if (quest) {
      await setDailyQuest(childId, { ...quest, claimed: false });
    }
  } catch {
    // ignore
  }
}
