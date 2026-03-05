import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useProgressSummary } from '../../hooks/useProgressSummary';
import { setParentOnboardingComplete, getParentOnboardingActivityStarted, setParentOnboardingActivityStarted } from '../../utils/onboardingStorage';
import { useParentOnboardingSuccess } from '../../context/ParentOnboardingSuccessContext';
import { getChildGamificationSettings } from '../../utils/childGamificationSettingsStorage';
import { colors } from '../../design/colors';
import { radius, spacing } from '../../design/theme';
import { typography } from '../../design/typography';
import type { ChildStackParamList } from '../../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<ChildStackParamList, 'CompletionReward'>;
  route: RouteProp<ChildStackParamList, 'CompletionReward'>;
};

const ENCOURAGING_MESSAGES: Record<number, string> = {
  1: 'You did it! Every star counts. 🌟',
  2: 'Nice work! You’re building great habits.',
  3: 'Awesome! Keep it up!',
  4: 'Amazing! You’re doing so well!',
  5: 'Incredible! Five stars — you crushed it! ⭐',
};

function getEncouragingMessage(stars: number): string {
  return ENCOURAGING_MESSAGES[Math.min(5, Math.max(1, stars))] ?? ENCOURAGING_MESSAGES[3];
}

export function CompletionRewardScreen({ navigation, route }: Props) {
  const { starsEarned, domainTitle, childName } = route.params;
  const { selectedChildId, setAppRole } = useAuth();
  const { setBanner } = useParentOnboardingSuccess();
  const { summary, refresh } = useProgressSummary(selectedChildId);
  const [reducedMotion, setReducedMotion] = useState(false);
  const starScale = useRef(new Animated.Value(0)).current;

  const handleDone = async () => {
    const fromParentOnboarding = await getParentOnboardingActivityStarted();
    if (fromParentOnboarding) {
      await setParentOnboardingComplete(true);
      await setParentOnboardingActivityStarted(false);
      if (domainTitle && childName) {
        setBanner({ domainTitle, childName });
      }
      setAppRole('parent');
    } else {
      navigation.navigate('Main');
    }
  };
  const streakScale = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      refresh();
      if (selectedChildId) {
        getChildGamificationSettings(selectedChildId).then((s) => setReducedMotion(s.reducedMotion));
      }
    }, [refresh, selectedChildId])
  );

  // When reducedMotion is true, reward animations (star/streak scale, message opacity) are disabled; content renders statically.
  useEffect(() => {
    if (reducedMotion) return;
    Animated.sequence([
      Animated.timing(starScale, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2)),
      }),
      Animated.timing(streakScale, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reducedMotion, starScale, streakScale, messageOpacity]);

  const currentStreak = summary?.current_streak ?? 0;

  const starsContent = (
    <>
      <Text style={styles.starsEmoji}>{'⭐'.repeat(Math.min(5, Math.max(0, starsEarned)))}</Text>
      <Text style={styles.starsLabel}>+{starsEarned} Stars Earned</Text>
    </>
  );
  const streakContent = (
    <>
      <Text style={styles.streakEmoji}>🔥</Text>
      <Text style={styles.streakLabel}>Current streak</Text>
      <Text style={styles.streakValue}>{currentStreak} day{currentStreak !== 1 ? 's' : ''}</Text>
    </>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You did it!</Text>

      {reducedMotion ? (
        <View style={styles.starsBox}>{starsContent}</View>
      ) : (
        <Animated.View style={[styles.starsBox, { transform: [{ scale: starScale }] }]}>
          {starsContent}
        </Animated.View>
      )}

      {reducedMotion ? (
        <View style={styles.streakBox}>{streakContent}</View>
      ) : (
        <Animated.View style={[styles.streakBox, { transform: [{ scale: streakScale }] }]}>
          {streakContent}
        </Animated.View>
      )}

      {reducedMotion ? (
        <>
          <Text style={styles.message}>Great practice!</Text>
          {domainTitle ? (
            <Text style={styles.skillMessage}>You just practiced {domainTitle}.</Text>
          ) : null}
        </>
      ) : (
        <>
          <Animated.Text style={[styles.message, { opacity: messageOpacity }]}>
            Great practice!
          </Animated.Text>
          {domainTitle ? (
            <Animated.Text style={[styles.skillMessage, { opacity: messageOpacity }]}>
              You just practiced {domainTitle}.
            </Animated.Text>
          ) : null}
        </>
      )}

      <Button
        title="Done"
        onPress={handleDone}
        style={styles.doneBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xl,
  },
  starsBox: {
    alignItems: 'center',
    paddingVertical: spacing[24],
    paddingHorizontal: spacing[32],
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.childAccent,
    minWidth: 220,
    ...typography.CardTitle,
  },
  starsEmoji: {
    fontSize: 44,
    marginBottom: spacing.sm,
  },
  starsLabel: {
    ...typography.SectionTitle,
    color: colors.childAccent,
  },
  streakBox: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 180,
  },
  streakEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  streakLabel: {
    ...typography.Caption,
    color: colors.textSecondary,
  },
  streakValue: {
    ...typography.CardTitle,
    color: colors.textPrimary,
  },
  message: {
    ...typography.SectionTitle,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skillMessage: {
    ...typography.Caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  doneBtn: {
    minWidth: 160,
  },
});
