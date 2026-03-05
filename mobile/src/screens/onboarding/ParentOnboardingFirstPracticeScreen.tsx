import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useChildren } from '../../hooks/useChildren';
import { AuthBackground } from '../../components/auth/AuthBackground';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EMOTIONAL_DOMAINS } from '../../constants/emotionalDomains';
import { fetchActivities, type Activity } from '../../services/activitiesService';
import { setParentOnboardingActivityStarted } from '../../utils/onboardingStorage';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { layout } from '../../theme';
import type { ParentOnboardingStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<ParentOnboardingStackParamList, 'ParentOnboardingFirstPractice'>;

const SUGGESTED_DOMAIN_ID = 'emotional_awareness';
const SUGGESTED_ACTIVITY_SLUG = 'emotion-wheel';

export function ParentOnboardingFirstPracticeScreen({ navigation }: { navigation: Nav }) {
  const insets = useSafeAreaInsets();
  const { setAppRole, setSelectedChild, setPendingActivityId, selectedChildId } = useAuth();
  const { children } = useChildren();
  const [suggestedActivity, setSuggestedActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [chooseToolModalVisible, setChooseToolModalVisible] = useState(false);
  const [chooseToolLoading, setChooseToolLoading] = useState(false);

  const child = children.find((c) => c.id === selectedChildId) ?? children[0];
  const domain = EMOTIONAL_DOMAINS.find((d) => d.id === SUGGESTED_DOMAIN_ID);

  const loadSuggested = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchActivities({ active: true, domain_id: SUGGESTED_DOMAIN_ID });
      const found = list.find((a) => a.slug === SUGGESTED_ACTIVITY_SLUG) ?? list[0];
      setSuggestedActivity(found ?? null);
    } catch {
      setSuggestedActivity(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuggested();
  }, [loadSuggested]);

  const handleStartPractice = async () => {
    if (!child || !suggestedActivity) return;
    await setParentOnboardingActivityStarted(true);
    setSelectedChild(child.id);
    setPendingActivityId(suggestedActivity.id);
    setAppRole('child');
  };

  const handleChooseOther = () => {
    if (!child) return;
    setChooseToolModalVisible(true);
  };

  const handlePickDomain = useCallback(
    async (domainId: string) => {
      if (!child) return;
      setChooseToolModalVisible(false);
      setChooseToolLoading(true);
      try {
        const list = await fetchActivities({ active: true, domain_id: domainId });
        const first = list[0];
        if (first) {
          await setParentOnboardingActivityStarted(true);
          setSelectedChild(child.id);
          setPendingActivityId(first.id);
          setAppRole('child');
        } else {
          setSelectedChild(child.id);
          setAppRole('child');
        }
      } catch {
        setSelectedChild(child.id);
        setAppRole('child');
      } finally {
        setChooseToolLoading(false);
      }
    },
    [child, setSelectedChild, setPendingActivityId, setAppRole]
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <AuthBackground variant="family" heroFraction={0.28}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: layout.screenPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stepWrap}>
            <Text style={styles.stepLabel}>Step 3 of 3</Text>
          </View>
          {child && (
            <View style={styles.childRow}>
              <Avatar name={child.name} size={40} />
              <View style={styles.childInfo}>
                <Text style={styles.childName}>{child.name}</Text>
                {child.age_group ? (
                  <Text style={styles.childAge}>Age group: {child.age_group}</Text>
                ) : null}
              </View>
            </View>
          )}
          <Text style={styles.title}>Start first practice</Text>
          <Text style={styles.subtitle}>One short activity to build the habit. You can try more after.</Text>
          {loading ? (
            <View style={styles.loadWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : suggestedActivity && domain ? (
            <>
              <Card variant="elevated" style={styles.domainCard}>
                <Text style={styles.domainTitle}>First practice: {domain.title}</Text>
                <Text style={styles.domainBenefit}>Helps kids notice and name feelings.</Text>
              </Card>
              <Card variant="elevated" style={styles.toolCard}>
                <Text style={styles.toolTitle}>Tool: {suggestedActivity.title}</Text>
                <Text style={styles.toolTime}>
                  ~{suggestedActivity.duration_minutes ?? 2} minutes
                </Text>
              </Card>
              <Button
                title="Start practice in Child mode"
                onPress={handleStartPractice}
                variant="primary"
                size="large"
                fullWidth
                style={styles.cta}
              />
              <Button
                title="Choose another tool"
                onPress={handleChooseOther}
                variant="ghost"
                fullWidth
                style={styles.secondaryBtn}
              />
            </>
          ) : (
            <Card variant="outlined" style={styles.errorCard}>
              <Text style={styles.errorText}>Could not load activities. Try again or choose from the app.</Text>
              <Button title="Open Child mode" onPress={handleChooseOther} variant="outline" fullWidth style={styles.cta} />
            </Card>
          )}
        </ScrollView>
      </AuthBackground>

      <Modal
        visible={chooseToolModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setChooseToolModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={styles.modalBackdropTouchable} activeOpacity={1} onPress={() => setChooseToolModalVisible(false)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose a practice</Text>
            <Text style={styles.modalSubtitle}>Pick a skill area. We'll open the first tool in that area.</Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {EMOTIONAL_DOMAINS.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={styles.modalDomainCard}
                  onPress={() => handlePickDomain(d.id)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                >
                  <Text style={styles.modalDomainTitle}>{d.title}</Text>
                  <Text style={styles.modalDomainDesc} numberOfLines={2}>{d.description}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button
              title="Cancel"
              onPress={() => setChooseToolModalVisible(false)}
              variant="ghost"
              style={styles.modalCancelBtn}
            />
          </View>
        </View>
      </Modal>

      {chooseToolLoading ? (
        <View style={styles.loadingOverlay} pointerEvents="box-only">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: spacing.md, paddingBottom: layout.sectionGap },
  stepWrap: { marginBottom: spacing.sm },
  stepLabel: { ...typography.caption, color: colors.textSecondary },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  childInfo: { marginLeft: spacing.md },
  childName: { ...typography.h4, color: colors.text },
  childAge: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  title: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.lg },
  loadWrap: { paddingVertical: spacing.xxl, alignItems: 'center' },
  domainCard: { marginBottom: spacing.md },
  domainTitle: { ...typography.CardTitle, color: colors.text, marginBottom: spacing.xs },
  domainBenefit: { ...typography.Caption, color: colors.textSecondary },
  toolCard: { marginBottom: spacing.lg },
  toolTitle: { ...typography.CardTitle, color: colors.text, marginBottom: spacing.xs },
  toolTime: { ...typography.Caption, color: colors.textSecondary },
  cta: { marginBottom: spacing.sm, minHeight: layout.touchTargetMin },
  secondaryBtn: { marginBottom: spacing.md },
  errorCard: { marginTop: spacing.sm },
  errorText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouchable: { flex: 1 },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: layout.screenPadding,
    maxHeight: '80%',
  },
  modalTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  modalSubtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.lg },
  modalScroll: { maxHeight: 320, marginBottom: spacing.md },
  modalDomainCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalDomainTitle: { ...typography.CardTitle, color: colors.text, marginBottom: spacing.xs },
  modalDomainDesc: { ...typography.Caption, color: colors.textSecondary },
  modalCancelBtn: { marginTop: spacing.sm },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
