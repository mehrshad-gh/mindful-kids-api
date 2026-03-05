/**
 * Static Safety Help screen – no API calls, avoid interceptor loops.
 * Shown when user taps "Get help now" after a safety escalation (422).
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { borderRadius } from '../../theme/spacing';

/** Exit must work even if screen opened without back stack (e.g. from interceptor before nav ready). */
export function SafetyHelpScreen() {
  const navigation = useNavigation();

  const exit = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    }
  };

  return (
    <ScreenLayout>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>If you are in immediate danger</Text>
          <Text style={styles.body}>
            Contact local emergency services. In the US and Canada you can call 911. Elsewhere, use
            your local emergency number.
          </Text>
          <Button title="I understand" onPress={exit} variant="primary" fullWidth />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>If this is not an emergency</Text>
          <Text style={styles.body}>
            Consider reaching out to a trusted person or a qualified professional for support.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Need resources?</Text>
          <Text style={styles.body}>
            You can search for local crisis resources in your country/region.
          </Text>
        </Card>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  card: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  cardTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
});
