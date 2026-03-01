import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { layout } from '../../theme';
import { shadows } from '../../theme/spacing';

interface FABProps {
  onPress: () => void;
  label: string;
  icon?: string;
  variant?: 'primary' | 'accent';
  style?: ViewStyle;
}

export function FAB({ onPress, label, icon, variant = 'primary', style }: FABProps) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, layout.fabBottomInset);
  const right = layout.fabHorizontalMargin;

  return (
    <TouchableOpacity
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.fab,
        variant === 'accent' && styles.fabAccent,
        { bottom, right },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={styles.icon} numberOfLines={1}>
        {icon ?? '+'}
      </Text>
    </TouchableOpacity>
  );
}

const size = layout.fabSize;

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.fab,
  },
  fabAccent: {
    backgroundColor: colors.childAccent,
    shadowColor: colors.childAccent,
  },
  icon: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.textInverse,
    includeFontPadding: false,
  },
});
