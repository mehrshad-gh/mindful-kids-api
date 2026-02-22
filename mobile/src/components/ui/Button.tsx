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

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
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
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.primary : colors.surface} />
      ) : (
        <Text style={[styles.text, textVariantStyles[variant], textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
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
  text: { fontSize: 16, fontWeight: '600' },
  textPrimary: { color: colors.surface },
  textSecondary: { color: colors.text },
  textGhost: { color: colors.primary },
  textOutline: { color: colors.primary },
});
