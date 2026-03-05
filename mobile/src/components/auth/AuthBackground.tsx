import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

type Variant = 'family' | 'professional';

interface AuthBackgroundProps {
  variant?: Variant;
  /** Flex weight for hero (e.g. 1 = 50% when lower also 1). */
  heroFraction?: number;
  style?: ViewStyle;
  /** Content rendered inside the hero (e.g. title, logo). */
  heroContent?: React.ReactNode;
  children?: React.ReactNode;
}

export function AuthBackground({
  variant = 'family',
  heroFraction = 1,
  style,
  heroContent,
  children,
}: AuthBackgroundProps) {
  const isFamily = variant === 'family';

  return (
    <View style={[styles.root, style]}>
      <View style={[styles.hero, { flex: heroFraction }]}>
        {isFamily ? (
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.gradientPro]} />
        )}
        {isFamily && (
          <>
            <View style={styles.lightFlare} />
            <View style={styles.lightFlareSmall} />
            <LinearGradient
              colors={['transparent', colors.background]}
              style={styles.heroFade}
            />
          </>
        )}
        <View style={[styles.blob, styles.blob1, isFamily ? styles.blobFamily1 : styles.blobPro1]} />
        <View style={[styles.blob, styles.blob2, isFamily ? styles.blobFamily2 : styles.blobPro2]} />
        <View style={[styles.blob, styles.blob3, isFamily ? styles.blobFamily3 : styles.blobPro3]} />
        {heroContent != null ? <View style={styles.heroContentWrap}>{heroContent}</View> : null}
      </View>
      <View style={styles.lower}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 200,
  },
  gradientPro: { backgroundColor: colors.surface },
  lightFlare: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  lightFlareSmall: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroFade: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.45,
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  blob1: { top: -60, left: -80, width: 220, height: 220 },
  blob2: { top: 40, right: -50, width: 160, height: 160 },
  blob3: { bottom: -30, left: 60, width: 100, height: 100 },
  blobFamily1: { backgroundColor: colors.primary, opacity: 0.14 },
  blobFamily2: { backgroundColor: colors.secondary, opacity: 0.12 },
  blobFamily3: { backgroundColor: colors.accent, opacity: 0.1 },
  blobPro1: { backgroundColor: colors.border, opacity: 0.15 },
  blobPro2: { backgroundColor: colors.border, opacity: 0.12 },
  blobPro3: { backgroundColor: colors.border, opacity: 0.1 },
  lower: { flex: 1, backgroundColor: colors.background },
  heroContentWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 1,
  },
});
