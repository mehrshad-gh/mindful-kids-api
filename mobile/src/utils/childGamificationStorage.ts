import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEST_PREFIX = '@mindful_kids_child_daily_quest:';
const STICKERS_PREFIX = '@mindful_kids_child_stickers:';

/** Device local date as YYYY-MM-DD for timezone-consistent quest keys. */
export function getLocalDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface DailyQuestRecord {
  completed: boolean;
  activity_slug: string;
  domain_id: string;
  activity_id?: string;
  activity_title?: string;
  domain_title?: string;
  claimed?: boolean;
}

export interface StickerRecord {
  owned: string[];
  last_awarded_at?: string;
}

function todayKey(): string {
  return getLocalDateKey();
}

function questKey(childId: string): string {
  return `${QUEST_PREFIX}${childId}:${todayKey()}`;
}

function stickersKey(childId: string): string {
  return `${STICKERS_PREFIX}${childId}`;
}

export async function getDailyQuest(childId: string): Promise<DailyQuestRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(questKey(childId));
    if (!raw) return null;
    return JSON.parse(raw) as DailyQuestRecord;
  } catch {
    return null;
  }
}

export async function setDailyQuest(childId: string, record: DailyQuestRecord): Promise<void> {
  try {
    await AsyncStorage.setItem(questKey(childId), JSON.stringify(record));
  } catch {
    // ignore
  }
}

export async function markDailyQuestCompleted(childId: string): Promise<void> {
  const existing = await getDailyQuest(childId);
  if (!existing) return;
  await setDailyQuest(childId, { ...existing, completed: true });
}

export async function markDailyQuestClaimed(childId: string): Promise<void> {
  const existing = await getDailyQuest(childId);
  if (!existing || !existing.completed) return;
  await setDailyQuest(childId, { ...existing, claimed: true });
}

/**
 * Call when an activity is completed. If the activity slug matches today's quest, mark quest completed.
 */
export async function updateDailyQuestOnCompletion(
  childId: string,
  activitySlug: string,
  domainId: string
): Promise<void> {
  const quest = await getDailyQuest(childId);
  if (!quest || quest.activity_slug !== activitySlug) return;
  await setDailyQuest(childId, { ...quest, completed: true });
}

export async function getStickers(childId: string): Promise<StickerRecord> {
  try {
    const raw = await AsyncStorage.getItem(stickersKey(childId));
    if (!raw) return { owned: [] };
    return JSON.parse(raw) as StickerRecord;
  } catch {
    return { owned: [] };
  }
}

export async function setStickers(childId: string, record: StickerRecord): Promise<void> {
  try {
    await AsyncStorage.setItem(stickersKey(childId), JSON.stringify(record));
  } catch {
    // ignore
  }
}

export async function addSticker(childId: string, stickerId: string): Promise<void> {
  const current = await getStickers(childId);
  if (current.owned.includes(stickerId)) return;
  await setStickers(childId, {
    owned: [...current.owned, stickerId],
    last_awarded_at: new Date().toISOString(),
  });
}
