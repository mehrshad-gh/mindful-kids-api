import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../../components/ui/Button';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useAuth } from '../../context/AuthContext';

export function ParentChildExplainScreen() {
  const { setOnboardingComplete, setAppRole } = useAuth();

  const handleGetStarted = async () => {
    setAppRole('parent');
    await setOnboardingComplete(true);
  };

  return (
    <ScreenLayout scroll>
      <View style={styles.content}>
        <Text style={styles.title}>Parent & child mode</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Parent mode</Text> — Your dashboard: view your child's progress, read advice, find psychologists, and manage profiles.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Child mode</Text> — Hand the device to your child so they can do activities, check in with the emotion wheel, and earn rewards. Switch back to parent mode anytime.
        </Text>
        <Button
          title="Go to dashboard"
          onPress={handleGetStarted}
          style={styles.button}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  bold: {
    fontWeight: '600',
    color: colors.text,
  },
  button: {
    marginTop: spacing.md,
  },
});
