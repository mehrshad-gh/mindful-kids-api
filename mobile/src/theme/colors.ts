export const colors = {
  primary: '#4A90A4',
  primaryDark: '#3A7585',
  secondary: '#F5A623',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#2C3E50',
  textSecondary: '#7F8C8D',
  border: '#E0E6ED',
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
  childAccent: '#9B59B6',
  parentAccent: '#3498DB',
} as const;

export type Colors = typeof colors;
