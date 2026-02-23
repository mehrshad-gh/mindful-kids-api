import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETE_KEY = '@mindful_kids_onboarding_complete';
const DISCLAIMER_ACCEPTED_KEY = '@mindful_kids_disclaimer_accepted';

export async function getOnboardingComplete(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setOnboardingComplete(complete: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, complete ? 'true' : 'false');
  } catch {
    // ignore
  }
}

const DISCLAIMER_ACCEPTED_LEGACY_KEY = '@mindful_kids_disclaimer_accepted_legacy';

export interface DisclaimerConsentRecord {
  accepted: boolean;
  at: string; // ISO timestamp
}

export async function getDisclaimerAccepted(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(DISCLAIMER_ACCEPTED_KEY);
    if (raw === 'true') return true;
    const parsed = parseDisclaimerRecord(raw);
    return parsed?.accepted === true;
  } catch {
    return false;
  }
}

export async function getDisclaimerAcceptedAt(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(DISCLAIMER_ACCEPTED_KEY);
    if (!raw || raw === 'true' || raw === 'false') return null;
    const parsed = parseDisclaimerRecord(raw);
    return parsed?.accepted ? parsed.at : null;
  } catch {
    return null;
  }
}

function parseDisclaimerRecord(raw: string | null): DisclaimerConsentRecord | null {
  if (!raw || raw === 'true' || raw === 'false') return null;
  try {
    const obj = JSON.parse(raw) as unknown;
    if (obj && typeof obj === 'object' && 'accepted' in obj && 'at' in obj) {
      return { accepted: !!obj.accepted, at: String(obj.at) };
    }
  } catch {
    // ignore
  }
  return null;
}

export async function setDisclaimerAccepted(accepted: boolean): Promise<void> {
  try {
    const record: DisclaimerConsentRecord = {
      accepted,
      at: new Date().toISOString(),
    };
    await AsyncStorage.setItem(DISCLAIMER_ACCEPTED_KEY, JSON.stringify(record));
    await AsyncStorage.removeItem(DISCLAIMER_ACCEPTED_LEGACY_KEY);
  } catch {
    // ignore
  }
}
