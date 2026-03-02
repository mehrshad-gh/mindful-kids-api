import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { TERMS_OF_SERVICE } from '../../constants/legalContent';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function TermsOfServiceScreen() {
  return (
    <ScreenLayout>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.text}>{TERMS_OF_SERVICE}</Text>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  text: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
  },
});
