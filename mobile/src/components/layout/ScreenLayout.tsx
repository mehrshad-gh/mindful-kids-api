import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { layout } from '../../theme';
import { colors } from '../../theme/colors';

interface ScreenLayoutProps {
  children: React.ReactNode;
  scroll?: boolean;
  /** Center content with max width (good for auth/forms on tablets) */
  centered?: boolean;
  /** Add bottom padding so content isn't hidden behind a FAB */
  fabSpacing?: boolean;
  /** Full-bleed: no horizontal padding, content can go edge-to-edge */
  edgeToEdge?: boolean;
  style?: ViewStyle;
}

export function ScreenLayout({ children, scroll = true, centered = false, fabSpacing = false, edgeToEdge = false, style }: ScreenLayoutProps) {
  const paddingStyle = edgeToEdge ? styles.scrollContentEdgeToEdge : (centered ? styles.scrollContentCentered : styles.scrollContent);
  const contentPadding = fabSpacing ? { paddingBottom: layout.fabContentPaddingBottom } : undefined;
  const content = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContentBase, paddingStyle, contentPadding]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.container, centered && styles.containerCentered, edgeToEdge && styles.containerEdgeToEdge, contentPadding]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safe, style]} edges={['top', 'bottom']}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContentBase: { flexGrow: 1 },
  scrollContent: { padding: layout.screenPadding },
  scrollContentEdgeToEdge: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: layout.screenPadding },
  scrollContentCentered: {
    padding: layout.screenPadding,
    maxWidth: layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  container: { flex: 1, padding: layout.screenPadding },
  containerEdgeToEdge: { paddingHorizontal: 0, paddingTop: 0 },
  containerCentered: { maxWidth: layout.maxContentWidth, alignSelf: 'center', width: '100%' },
});
