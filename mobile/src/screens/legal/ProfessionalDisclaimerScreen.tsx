import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { PROFESSIONAL_DISCLAIMER } from '../../constants/legalContent';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function ProfessionalDisclaimerScreen() {
  return (
    <ScreenLayout>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.text}>{PROFESSIONAL_DISCLAIMER}</Text>
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
