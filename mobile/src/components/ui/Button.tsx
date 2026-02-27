import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';
type Size = 'medium' | 'small';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const variantStyles = {
    primary: [styles.base, styles.primary],
    secondary: [styles.base, styles.secondary],
    ghost: [styles.base, styles.ghost],
    outline: [styles.base, styles.outline],
  };
  const sizeStyles = {
    medium: styles.sizeMedium,
    small: styles.sizeSmall,
  };
  const textVariantStyles = {
    primary: styles.textPrimary,
    secondary: styles.textSecondary,
    ghost: styles.textGhost,
    outline: styles.textOutline,
  };

  return (
    <TouchableOpacity
      style={[
        variantStyles[variant],
        sizeStyles[size],
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.primary : colors.surface} size="small" />
      ) : (
        <Text style={[styles.text, size === 'small' && styles.textSmall, textVariantStyles[variant], textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeMedium: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  sizeSmall: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 42,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.secondary },
  ghost: { backgroundColor: 'transparent' },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  disabled: { opacity: 0.5 },
  text: { ...typography.body, fontWeight: '600' },
  textSmall: { fontSize: 14 },
  textPrimary: { color: colors.surface },
  textSecondary: { color: colors.text },
  textGhost: { color: colors.primary },
  textOutline: { color: colors.primary },
});
