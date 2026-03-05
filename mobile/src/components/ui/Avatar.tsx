import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Image } from 'react-native';
import { colors } from '../../design/colors';
import { typography } from '../../design/typography';
import { radius } from '../../design/radius';

interface AvatarProps {
  /** Display name for initials (e.g. "Jane" → "J") */
  name?: string;
  /** Image URL; if provided, shows image instead of initials */
  imageUri?: string | null;
  size?: number;
  backgroundColor?: string;
  style?: ViewStyle;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || '?';
}

export function Avatar({
  name = '',
  imageUri,
  size = 48,
  backgroundColor = colors.surfaceSoft,
  style,
}: AvatarProps) {
  const fontSize = Math.max(14, size * 0.4);

  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={[
          styles.base,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          style,
        ]}
        accessibilityLabel={name ? `Avatar for ${name}` : undefined}
      />
    );
  }

  return (
    <View
      style={[
        styles.base,
        styles.initialBox,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      <Text style={[styles.initial, { fontSize }]} numberOfLines={1}>
        {name ? getInitials(name) : '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {},
  initialBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    ...typography.CardTitle,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
