import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme';
import { typography } from '../../theme/typography';

export function TrustAndSafetyScreen() {
  return (
    <ScreenLayout>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.lead}>
          Mindful Kids supports emotional skill development and parent education. It does not diagnose, treat, or replace professional care.
        </Text>

        <Card style={styles.card}>
          <Text style={styles.heading}>Platform positioning</Text>
          <Text style={styles.body}>
            We provide activities and advice to help families build emotional skills. We are not a healthcare provider. For diagnosis, treatment, or clinical support, please see a qualified professional.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.heading}>What “Verified” means</Text>
          <Text style={styles.body}>
            Professionals with a Verified badge have had their submitted credentials (e.g. license, issuing country, specialization) reviewed by Mindful Kids. Verification is not an endorsement of their practice or outcomes. Always use your own judgment when choosing care.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.heading}>Your responsibility</Text>
          <Text style={styles.body}>
            You are the parent or legal guardian. You control your child’s profile and data. You can revoke access or delete a child’s profile at any time from your Dashboard.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.heading}>Data & privacy</Text>
          <Text style={styles.body}>
            We collect only what is needed: account details, child profile (e.g. name, age group), and activity progress. Data is stored securely and is not sold. You can delete your account and data at any time. For full details, see our Privacy Policy (in app or on our website).
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.heading}>Safety</Text>
          <Text style={styles.body}>
            If you see concerning content or behavior, you can report a professional from their profile. We are not a crisis service; in an emergency, please contact local emergency services or a crisis helpline.
          </Text>
        </Card>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  lead: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  card: { marginBottom: spacing.lg },
  heading: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
