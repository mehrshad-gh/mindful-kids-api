import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useProgressSummary } from '../../hooks/useProgressSummary';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
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
  const { starsEarned } = route.params;
  const { selectedChildId } = useAuth();
  const { summary, refresh } = useProgressSummary(selectedChildId);
  const starScale = useRef(new Animated.Value(0)).current;
  const streakScale = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
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
  }, [starScale, streakScale, messageOpacity]);

  const currentStreak = summary?.current_streak ?? 0;
  const message = getEncouragingMessage(starsEarned);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You did it!</Text>

      <Animated.View
        style={[
          styles.starsBox,
          {
            transform: [{ scale: starScale }],
          },
        ]}
      >
        <Text style={styles.starsEmoji}>{'⭐'.repeat(Math.min(5, Math.max(0, starsEarned)))}</Text>
        <Text style={styles.starsLabel}>Stars earned</Text>
        <Text style={styles.starsValue}>{starsEarned}</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.streakBox,
          {
            transform: [{ scale: streakScale }],
          },
        ]}
      >
        <Text style={styles.streakEmoji}>🔥</Text>
        <Text style={styles.streakLabel}>Current streak</Text>
        <Text style={styles.streakValue}>{currentStreak} day{currentStreak !== 1 ? 's' : ''}</Text>
      </Animated.View>

      <Animated.Text style={[styles.message, { opacity: messageOpacity }]}>
        {message}
      </Animated.Text>

      <Button
        title="Done"
        onPress={() => navigation.navigate('Main')}
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
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.childAccent,
    minWidth: 200,
  },
  starsEmoji: {
    fontSize: 40,
    marginBottom: spacing.xs,
  },
  starsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  starsValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.childAccent,
  },
  streakBox: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 180,
  },
  streakEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  streakLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  streakValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  doneBtn: {
    minWidth: 160,
  },
});
