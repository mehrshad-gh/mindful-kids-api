import React from 'react';
import { ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { layout } from '../../design/theme';

interface ScrollableScreenProps {
  children: React.ReactNode;
  /** Extra bottom padding (e.g. for FAB) */
  contentPaddingBottom?: number;
  contentContainerStyle?: ViewStyle;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
}

export function ScrollableScreen({
  children,
  contentPaddingBottom,
  contentContainerStyle,
  keyboardShouldPersistTaps = 'handled',
}: ScrollableScreenProps) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        contentPaddingBottom != null && { paddingBottom: contentPaddingBottom },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { flexGrow: 1, padding: layout.screenPadding },
});
