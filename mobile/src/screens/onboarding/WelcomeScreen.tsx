import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/ui/Button';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { OnboardingStackParamList } from '../../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'>;
};

export function WelcomeScreen({ navigation }: Props) {
  return (
    <ScreenLayout scroll>
      <View style={styles.content}>
        <Text style={styles.title}>Mindful Kids</Text>
        <Text style={styles.subtitle}>
          Evidence-based activities and tips to support your child's emotional wellbeing. Track progress, get daily advice, and connect with experts when you need them.
        </Text>
        <Button
          title="Get started"
          onPress={() => navigation.navigate('Register', { onSuccessNavigateTo: 'AddChild' })}
          style={styles.primary}
        />
        <Button
          title="I already have an account"
          onPress={() => navigation.navigate('Login', { onSuccessNavigateTo: 'AddChild' })}
          variant="ghost"
        />
        <Button
          title="I'm a therapist – join the directory"
          onPress={() => (navigation.getParent() as any)?.navigate('TherapistOnboarding')}
          variant="outline"
          style={styles.therapistBtn}
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
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  primary: {
    marginBottom: spacing.sm,
  },
  therapistBtn: {
    marginTop: spacing.md,
  },
});
