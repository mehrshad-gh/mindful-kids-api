import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthBackground } from '../../components/auth/AuthBackground';
import { AuthCard } from '../../components/auth/AuthCard';
import { Button } from '../../components/ui/Button';
import { ScrollableScreen } from '../../components/layout/ScrollableScreen';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { layout } from '../../theme';
import type { ParentOnboardingStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<ParentOnboardingStackParamList, 'ParentOnboardingWelcome'>;

const BULLETS = [
  { icon: 'person-outline' as const, text: 'Add your child profile' },
  { icon: 'play-circle-outline' as const, text: 'Choose a first practice tool' },
  { icon: 'star-outline' as const, text: 'Earn stars and track growth' },
];

export function ParentOnboardingWelcomeScreen({ navigation }: { navigation: Nav }) {
  const insets = useSafeAreaInsets();
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(16)).current;
  const cardFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(heroSlide, { toValue: 0, duration: 480, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(120),
        Animated.timing(cardFade, { toValue: 1, duration: 380, useNativeDriver: true }),
      ]),
    ]).start();
  }, [heroFade, heroSlide, cardFade]);

  const heroContent = (
    <Animated.View
      style={[
        styles.heroInner,
        {
          opacity: heroFade,
          transform: [{ translateY: heroSlide }],
        },
      ]}
    >
      <Text style={styles.title}>Let's set up your family in 2 minutes</Text>
      <View style={styles.bullets}>
        {BULLETS.map((item, i) => (
          <View key={i} style={styles.bulletRow}>
            <Ionicons name={item.icon} size={22} color="rgba(255,255,255,0.95)" style={styles.bulletIcon} />
            <Text style={styles.bulletText}>{item.text}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <AuthBackground variant="family" heroContent={heroContent}>
        <ScrollableScreen
          contentContainerStyle={styles.scrollContent}
          contentPaddingBottom={layout.sectionGap}
        >
          <Animated.View style={{ opacity: cardFade }}>
            <View style={styles.stepWrap}>
              <Text style={styles.stepLabel}>Step 1 of 3</Text>
            </View>
            <AuthCard style={styles.card}>
              <Button
                title="Get started"
                onPress={() => navigation.navigate('ParentOnboardingAddChild')}
                variant="primary"
                size="large"
                fullWidth
                style={styles.cta}
              />
            </AuthCard>
          </Animated.View>
        </ScrollableScreen>
      </AuthBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  heroInner: { alignItems: 'center', maxWidth: 320 },
  title: {
    ...typography.HeroTitle,
    color: colors.textInverse,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  bullets: { alignSelf: 'stretch', paddingHorizontal: spacing.md },
  bulletRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  bulletIcon: { marginRight: spacing.md },
  bulletText: { ...typography.body, color: 'rgba(255,255,255,0.95)', flex: 1 },
  stepWrap: { marginBottom: spacing.sm, paddingHorizontal: spacing.lg },
  stepLabel: { ...typography.caption, color: colors.textSecondary },
  card: { marginTop: spacing.sm },
  cta: { minHeight: layout.touchTargetMin },
});
