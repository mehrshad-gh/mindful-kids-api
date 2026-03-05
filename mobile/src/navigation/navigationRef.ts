import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Navigate from outside React (e.g. API interceptor). Safe no-op if ref not ready.
 */
export function navigate(name: keyof RootStackParamList, params?: undefined) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params as never);
  }
}

/**
 * Navigate when possible; if ref not ready, run fallback (e.g. show Alert with same guidance).
 * Ensures "Get help now" always gives the user something even before nav is ready.
 */
export function navigateSafe<K extends keyof RootStackParamList>(
  name: K,
  params?: RootStackParamList[K],
  fallback?: () => void
) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as keyof RootStackParamList, params as never);
  } else if (fallback) {
    fallback();
  }
}
