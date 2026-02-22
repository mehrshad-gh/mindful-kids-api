import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenLayoutProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}

export function ScreenLayout({ children, scroll = true, style }: ScreenLayoutProps) {
  const content = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.container}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safe, style]} edges={['top', 'bottom']}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16 },
  container: { flex: 1, padding: 16 },
});
