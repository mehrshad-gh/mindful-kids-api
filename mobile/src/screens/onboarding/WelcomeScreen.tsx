import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/ui/Button';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { layout } from '../../theme';
import type { OnboardingStackParamList } from '../../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'>;
};

export function WelcomeScreen({ navigation }: Props) {
  return (
    <ScreenLayout centered>
      <View style={styles.hero}>
        <Text style={styles.title}>Mindful Kids</Text>
        <Text style={styles.subtitle}>
          Evidence-based activities and tips to support your child's emotional wellbeing. Track progress, get daily advice, and connect with experts when you need them.
        </Text>
      </View>
      <View style={styles.actions}>
        <Button
          title="Get started"
          onPress={() => navigation.navigate('Register', { onSuccessNavigateTo: 'AddChild' })}
          fullWidth
          size="large"
          style={styles.primaryBtn}
        />
        <TouchableOpacity
          onPress={() => navigation.navigate('Login', { onSuccessNavigateTo: 'AddChild' })}
          style={styles.linkWrap}
        >
          <Text style={styles.linkText}>I already have an account</Text>
        </TouchableOpacity>
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>
        <Button
          title="I'm a therapist – join the directory"
          onPress={() => (navigation.getParent() as any)?.navigate('TherapistOnboarding')}
          variant="outline"
          size="small"
          fullWidth
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  hero: { marginBottom: layout.sectionGap },
  title: { ...typography.display, textAlign: 'center', marginBottom: spacing.md },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actions: { gap: spacing.sm },
  primaryBtn: {},
  linkWrap: { paddingVertical: spacing.md, alignItems: 'center' },
  linkText: { ...typography.link },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.caption, color: colors.textTertiary, marginHorizontal: spacing.md },
});
