import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

/** No API calls – avoids interceptor loop if backend returns 401 deactivated. */
export function AccountDeactivatedScreen() {
  const insets = useSafeAreaInsets();
  const { clearAccountDeactivated } = useAuth();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Your account has been deactivated</Text>
        <Text style={styles.message}>
          If you believe this was a mistake, please contact support.
        </Text>
        <Button
          title="OK"
          onPress={clearAccountDeactivated}
          variant="primary"
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: {
    maxWidth: 320,
    alignSelf: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
  },
});
