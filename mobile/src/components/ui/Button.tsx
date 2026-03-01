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
import { layout } from '../../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'soft';
type Size = 'medium' | 'small' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
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
  fullWidth,
  style,
  textStyle,
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[`size_${size}`],
        styles[`variant_${variant}`],
        disabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.78}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'ghost' || variant === 'soft' ? colors.primary : colors.textInverse}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            size === 'small' && styles.textSmall,
            size === 'large' && styles.textLarge,
            styles[`text_${variant}`],
            textStyle,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.touchTargetMin,
  },
  size_small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 40,
  },
  size_medium: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  size_large: {
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.xl,
    minHeight: 52,
  },
  fullWidth: { width: '100%' },
  variant_primary: { backgroundColor: colors.primary },
  variant_secondary: { backgroundColor: colors.secondary },
  variant_ghost: { backgroundColor: 'transparent' },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  variant_soft: { backgroundColor: colors.primaryMuted },
  disabled: { opacity: 0.5 },
  text: { ...typography.body, fontWeight: '600' },
  textSmall: { fontSize: 14 },
  textLarge: { fontSize: 17 },
  text_primary: { color: colors.textInverse },
  text_secondary: { color: colors.textInverse },
  text_ghost: { color: colors.primary },
  text_outline: { color: colors.primary },
  text_soft: { color: colors.primaryDark },
});
