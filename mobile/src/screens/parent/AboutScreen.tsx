import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme';
import { typography } from '../../theme/typography';

export function AboutScreen() {
  return (
    <ScreenLayout>
      <View style={styles.content}>
        <Text style={styles.paragraph}>
          MindfulKids is a structured emotional skill-building platform for families. It can be used independently or alongside professional guidance.
        </Text>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  paragraph: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
  },
});
