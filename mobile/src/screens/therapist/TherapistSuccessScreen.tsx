import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/ui/Button';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { useAuth } from '../../context/AuthContext';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { TherapistOnboardingStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<TherapistOnboardingStackParamList, 'TherapistSuccess'>;

export function TherapistSuccessScreen({ navigation }: { navigation: Nav }) {
  const { setOnboardingComplete } = useAuth();

  const goToApp = async () => {
    await setOnboardingComplete(true);
    const rootNav = (navigation.getParent() as { navigate: (name: string) => void } | undefined);
    if (rootNav?.navigate) {
      rootNav.navigate('App');
    }
  };

  return (
    <ScreenLayout>
      <View style={styles.container}>
        <Text style={styles.icon}>✓</Text>
        <Text style={styles.title}>Submitted for review</Text>
        <Text style={styles.body}>
          Thank you. Our team will review your application and verify your credentials. We’ll notify you when your
          profile is approved and visible in the directory.
        </Text>
        <Button title="Continue to app" onPress={goToApp} style={styles.button} />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  icon: { fontSize: 64, color: colors.success, marginBottom: spacing.lg },
  title: { ...typography.h2, textAlign: 'center', marginBottom: spacing.md },
  body: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  button: { alignSelf: 'stretch' },
});
