import AsyncStorage from '@react-native-async-storage/async-storage';

const PARENT_ONBOARDING_COMPLETE_KEY = '@mindful_kids_onboarding_completed_parent';
const PARENT_ONBOARDING_ACTIVITY_STARTED_KEY = '@mindful_kids_parent_onboarding_activity_started';

export async function getParentOnboardingComplete(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(PARENT_ONBOARDING_COMPLETE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setParentOnboardingComplete(complete: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(PARENT_ONBOARDING_COMPLETE_KEY, complete ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export async function getParentOnboardingActivityStarted(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(PARENT_ONBOARDING_ACTIVITY_STARTED_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setParentOnboardingActivityStarted(started: boolean): Promise<void> {
  try {
    if (started) {
      await AsyncStorage.setItem(PARENT_ONBOARDING_ACTIVITY_STARTED_KEY, 'true');
    } else {
      await AsyncStorage.removeItem(PARENT_ONBOARDING_ACTIVITY_STARTED_KEY);
    }
  } catch {
    // ignore
  }
}
