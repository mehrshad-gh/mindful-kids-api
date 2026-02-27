/**
 * Mindful Kids – warm, calm palette for families.
 * Sage + warm neutrals + soft accents.
 */
export const colors = {
  primary: '#5B8A72',
  primaryDark: '#456B58',
  secondary: '#C4956A',
  background: '#F7F5F2',
  surface: '#FFFFFF',
  text: '#2D2A26',
  textSecondary: '#6B6560',
  border: '#E8E4DF',
  success: '#2E7D5E',
  warning: '#C4903C',
  error: '#C75C5C',
  childAccent: '#7B68A6',
  parentAccent: '#4A7BA7',
} as const;

export type Colors = typeof colors;
