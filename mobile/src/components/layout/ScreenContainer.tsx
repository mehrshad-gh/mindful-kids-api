import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../design/colors';
import { layout } from '../../design/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  /** Apply standard screen padding */
  padded?: boolean;
  style?: ViewStyle;
}

export function ScreenContainer({ children, padded = true, style }: ScreenContainerProps) {
  return (
    <SafeAreaView style={[styles.safe, style]} edges={['top', 'bottom']}>
      <View style={[styles.inner, padded && styles.padded]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1 },
  padded: { padding: layout.screenPadding },
});
