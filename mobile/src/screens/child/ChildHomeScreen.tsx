import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useChildren } from '../../hooks/useChildren';
import { fetchDomainProgress, type DomainProgressItem } from '../../api/domainProgress';
import { fetchActivities } from '../../services/activitiesService';
import { EMOTIONAL_DOMAINS } from '../../constants/emotionalDomains';
import { getDomainColor } from '../../design/colors';
import { STICKER_IDS, STICKER_NAMES, STICKER_EMOJI, type StickerId } from '../../constants/stickers';
import {
  getDailyQuest,
  setDailyQuest,
  getStickers,
  addSticker,
  markDailyQuestClaimed,
  type DailyQuestRecord,
} from '../../utils/childGamificationStorage';
import { getChildGamificationSettings, type ChildGamificationSettings } from '../../utils/childGamificationSettingsStorage';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { IconCircle } from '../../components/ui/IconCircle';
import { DomainIcon } from '../../components/ui/DomainIcon';
import { colors } from '../../theme/colors';
import { spacing, layout, borderRadius, shadows } from '../../theme';
import { typography } from '../../theme/typography';
import type { ChildTabParamList, ChildStackParamList } from '../../types/navigation';

type TabNav = NativeStackNavigationProp<ChildTabParamList, 'Home'>;
type StackNav = NativeStackNavigationProp<ChildStackParamList, 'Main'>;

const SESSIONS_FOR_LEVEL = 10;
const DEFAULT_QUEST_DOMAIN = 'emotional_awareness';
const DOMAIN_CARD_WIDTH = 160;
const DOMAIN_CARD_GAP = 12;

function getOrderedDomainIdsByProgress(domains: DomainProgressItem[]): string[] {
  const byDomain = new Map(domains.map((d) => [d.domain_id, d]));
  const order = EMOTIONAL_DOMAINS.map((d) => d.id);
  const withSessions = order.map((id) => ({ id, sessions: byDomain.get(id)?.sessions_completed ?? 0 }));
  withSessions.sort((a, b) => a.sessions - b.sessions);
  return withSessions.map((x) => x.id);
}

export function ChildHomeScreen() {
  const navigation = useNavigation<TabNav>();
  const stackNav = useNavigation<StackNav>();
  const { setAppRole, selectedChildId } = useAuth();
  const { children } = useChildren();
  const childId = selectedChildId ?? children[0]?.id ?? null;
  const child = childId ? children.find((c) => c.id === childId) : null;

  const [quest, setQuestState] = useState<DailyQuestRecord | null>(null);
  const [questLoading, setQuestLoading] = useState(true);
  const [questError, setQuestError] = useState(false);
  const [domainProgress, setDomainProgress] = useState<DomainProgressItem[]>([]);
  const [progressLoading, setProgressLoading] = useState(true);
  const [stickers, setStickersState] = useState<{ owned: string[] }>({ owned: [] });
  const [refreshing, setRefreshing] = useState(false);
  const [stickerModalId, setStickerModalId] = useState<StickerId | null>(null);
  const [claimedModalVisible, setClaimedModalVisible] = useState(false);
  const [newlyClaimedId, setNewlyClaimedId] = useState<StickerId | null>(null);
  const [gamificationSettings, setGamificationSettings] = useState<ChildGamificationSettings>({
    dailyQuestEnabled: true,
    stickersEnabled: true,
    reducedMotion: false,
  });
  const claimScale = useRef(new Animated.Value(0)).current;
  const claimOpacity = useRef(new Animated.Value(0)).current;
  const questCardOpacity = useRef(new Animated.Value(0)).current;
  const questCardTranslate = useRef(new Animated.Value(12)).current;
  const domainScaleRefs = useRef<Record<string, Animated.Value>>({});

  const getDomainScale = (id: string) => {
    if (!domainScaleRefs.current[id]) domainScaleRefs.current[id] = new Animated.Value(1);
    return domainScaleRefs.current[id];
  };

  const loadProgress = useCallback(async () => {
    if (!childId) {
      setDomainProgress([]);
      setProgressLoading(false);
      return;
    }
    setProgressLoading(true);
    try {
      const { domains } = await fetchDomainProgress(childId);
      setDomainProgress(domains);
    } catch {
      setDomainProgress([]);
    } finally {
      setProgressLoading(false);
    }
  }, [childId]);

  const loadQuest = useCallback(async () => {
    if (!childId) {
      setQuestState(null);
      setQuestError(false);
      setQuestLoading(false);
      return;
    }
    setQuestLoading(true);
    setQuestError(false);
    try {
      let record = await getDailyQuest(childId);
      if (!record) {
        let domains: DomainProgressItem[] = [];
        try {
          const res = await fetchDomainProgress(childId);
          domains = res.domains;
        } catch {
          setQuestError(true);
          setQuestState(null);
          setQuestLoading(false);
          return;
        }
        const orderedIds = domains.length ? getOrderedDomainIdsByProgress(domains) : [DEFAULT_QUEST_DOMAIN];
        const idsToTry = orderedIds.includes(DEFAULT_QUEST_DOMAIN) ? orderedIds : [DEFAULT_QUEST_DOMAIN, ...orderedIds];
        for (const domainId of idsToTry) {
          try {
            const list = await fetchActivities({ active: true, domain_id: domainId });
            const first = list[0];
            const domain = EMOTIONAL_DOMAINS.find((d) => d.id === domainId);
            if (first && domain) {
              record = {
                completed: false,
                activity_slug: first.slug,
                domain_id: domainId,
                activity_id: first.id,
                activity_title: first.title,
                domain_title: domain.title,
              };
              await setDailyQuest(childId, record);
              break;
            }
          } catch {
            setQuestError(true);
            setQuestState(null);
            setQuestLoading(false);
            return;
          }
        }
      }
      setQuestState(record);
    } catch {
      setQuestError(true);
      setQuestState(null);
    } finally {
      setQuestLoading(false);
    }
  }, [childId]);

  const loadStickers = useCallback(async () => {
    if (!childId) return;
    try {
      const rec = await getStickers(childId);
      setStickersState({ owned: rec.owned });
    } catch {
      setStickersState({ owned: [] });
    }
  }, [childId]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadProgress();
    if (childId) {
      const s = await getChildGamificationSettings(childId);
      setGamificationSettings(s);
      if (s.dailyQuestEnabled) await loadQuest();
      else {
        setQuestState(null);
        setQuestLoading(false);
      }
    } else {
      setQuestState(null);
      setQuestLoading(false);
    }
    await loadStickers();
    setRefreshing(false);
  }, [childId, loadProgress, loadQuest, loadStickers]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        await loadProgress();
        if (!childId) {
          setQuestState(null);
          setQuestLoading(false);
          loadStickers();
          return;
        }
        const s = await getChildGamificationSettings(childId);
        if (cancelled) return;
        setGamificationSettings(s);
        if (s.dailyQuestEnabled) await loadQuest();
        else {
          setQuestState(null);
          setQuestLoading(false);
        }
        loadStickers();
      })();
      return () => { cancelled = true; };
    }, [childId, loadProgress, loadQuest, loadStickers])
  );

  useEffect(() => {
    if (!gamificationSettings.dailyQuestEnabled || questLoading) return;
    if (gamificationSettings.reducedMotion) {
      questCardOpacity.setValue(1);
      questCardTranslate.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(questCardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(questCardTranslate, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [gamificationSettings.dailyQuestEnabled, gamificationSettings.reducedMotion, questLoading]);

  const handleStartQuest = () => {
    if (!quest?.activity_id) return;
    (navigation.getParent() as any)?.navigate('Activity', { activityId: quest.activity_id });
  };

  const handleClaimSticker = async () => {
    if (!gamificationSettings.stickersEnabled) return;
    if (!childId || !quest || quest.claimed) return;
    if (!quest.completed) return;
    const rec = await getStickers(childId);
    const nextId = STICKER_IDS.find((id) => !rec.owned.includes(id));
    if (!nextId) return;
    await addSticker(childId, nextId);
    await markDailyQuestClaimed(childId);
    setQuestState((q) => (q ? { ...q, claimed: true } : null));
    setStickersState((s) => ({ owned: [...s.owned, nextId] }));
    setNewlyClaimedId(nextId);
    setClaimedModalVisible(true);
    if (!gamificationSettings.reducedMotion) {
      claimScale.setValue(0);
      claimOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(claimScale, { toValue: 1, useNativeDriver: true, friction: 6 }),
        Animated.timing(claimOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  };

  const openDomain = (domainId: string) => stackNav.navigate('DomainDetail', { domainId });

  const handleDomainPressIn = (domainId: string) => {
    if (gamificationSettings.reducedMotion) return;
    Animated.timing(getDomainScale(domainId), { toValue: 0.98, duration: 80, useNativeDriver: true }).start();
  };
  const handleDomainPressOut = (domainId: string) => {
    if (gamificationSettings.reducedMotion) return;
    Animated.spring(getDomainScale(domainId), { toValue: 1, useNativeDriver: true, friction: 8 }).start();
  };

  if (!childId && children.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Add a child in parent mode to start.</Text>
        <Button title="Back to Parent mode" onPress={() => setAppRole('parent')} variant="ghost" />
      </View>
    );
  }

  const progressByDomain = new Map(domainProgress.map((d) => [d.domain_id, d]));

  const renderQuestCard = () => {
    if (!gamificationSettings.dailyQuestEnabled) {
      return (
        <Card variant="outlined" style={styles.questCard}>
          <View style={styles.questDisabledRow}>
            <IconCircle size={40} backgroundColor={colors.surfaceSoft}>
              <Text style={styles.lockIcon}>🔒</Text>
            </IconCircle>
            <Text style={styles.questEmpty}>Daily Quest is off</Text>
          </View>
        </Card>
      );
    }
    if (questLoading) {
      return (
        <Card variant="elevated" style={styles.questCard}>
          <ActivityIndicator size="small" color={colors.childAccent} />
        </Card>
      );
    }
    if (questError) {
      return (
        <Card variant="outlined" style={styles.questCard}>
          <Text style={styles.questErrorText}>Something went wrong. Check your connection.</Text>
          <Button title="Try again" onPress={loadQuest} variant="primary" size="small" style={styles.questBtn} />
        </Card>
      );
    }
    if (quest) {
      const accent = getDomainColor(quest.domain_id);
      return (
        <Card variant="domain" accentColor={accent} style={styles.questCardLarge}>
          <View style={styles.questHeaderRow}>
            <IconCircle size={48} backgroundColor={accent + '24'}>
              <DomainIcon domainId={quest.domain_id} size={26} color={accent} />
            </IconCircle>
            <View style={styles.questHeaderText}>
              <Text style={styles.questDomain}>{quest.domain_title}</Text>
              <Text style={styles.questTool} numberOfLines={2}>{quest.activity_title}</Text>
            </View>
          </View>
          {quest.completed ? (
            <View style={styles.questCompletedBlock}>
              <View style={styles.questCompletedBadge}>
                <Text style={styles.questCheckIcon}>✓</Text>
                <Text style={styles.questCompleted}>Completed today</Text>
              </View>
              {gamificationSettings.stickersEnabled && !quest.claimed ? (
                <Button title="Claim sticker" onPress={handleClaimSticker} variant="soft" size="small" style={styles.claimBtn} />
              ) : quest.claimed ? (
                <Text style={styles.questClaimed}>Sticker claimed for today</Text>
              ) : null}
            </View>
          ) : (
            <Button title="Start today's quest" onPress={handleStartQuest} variant="primary" size="medium" style={styles.questBtn} />
          )}
        </Card>
      );
    }
    return (
      <Card variant="outlined" style={styles.questCard}>
        <Text style={styles.questEmpty}>No quest for today. Try again later.</Text>
      </Card>
    );
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.childAccent} />}
      showsVerticalScrollIndicator={false}
    >
      {/* 1) Hero */}
      <LinearGradient
        colors={[colors.childAccentMuted, colors.surface, colors.background]}
        style={styles.heroGradient}
      >
        <Avatar name={child?.name} size={72} backgroundColor={colors.childAccentMuted} />
        <Text style={styles.heroTitle}>Hi {child?.name ?? 'there'}!</Text>
      </LinearGradient>

      {/* 2) Today's Quest */}
      <Text style={styles.sectionTitle}>Today's Quest</Text>
      {gamificationSettings.reducedMotion ? (
        renderQuestCard()
      ) : (
        <Animated.View style={[styles.questCardWrap, { opacity: questCardOpacity, transform: [{ translateY: questCardTranslate }] }]}>
          {renderQuestCard()}
        </Animated.View>
      )}

      {/* 3) Pick a skill – horizontal carousel */}
      <Text style={styles.sectionTitle}>Pick a skill</Text>
      {progressLoading ? (
        <View style={styles.loadRow}><ActivityIndicator size="small" color={colors.childAccent} /></View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          style={styles.carousel}
        >
          {EMOTIONAL_DOMAINS.map((d) => {
            const prog = progressByDomain.get(d.id);
            const sessions = prog?.sessions_completed ?? 0;
            const levelLabel = prog?.level_label ?? 'Starting';
            const scaleAnim = getDomainScale(d.id);
            const accent = getDomainColor(d.id);
            const cardContent = (
              <Card variant="domain" accentColor={accent} style={[styles.domainCardCarousel, { width: DOMAIN_CARD_WIDTH }]}>
                <View style={styles.domainCardTop}>
                  <IconCircle size={40} backgroundColor={accent + '20'}>
                    <DomainIcon domainId={d.id} size={22} color={accent} />
                  </IconCircle>
                  <View style={[styles.levelBadge, { backgroundColor: accent + '24' }]}>
                    <Text style={[styles.levelText, { color: accent }]}>{levelLabel}</Text>
                  </View>
                </View>
                <Text style={styles.domainNameCarousel} numberOfLines={2}>{d.title}</Text>
                <ProgressBar progress={Math.min(1, sessions / SESSIONS_FOR_LEVEL)} fillColor={accent} height={6} animated={false} style={styles.domainMiniBar} />
                <Text style={styles.sessionsText}>{sessions} / {SESSIONS_FOR_LEVEL}</Text>
              </Card>
            );
            return (
              <Pressable
                key={d.id}
                onPress={() => openDomain(d.id)}
                onPressIn={() => handleDomainPressIn(d.id)}
                onPressOut={() => handleDomainPressOut(d.id)}
                style={({ pressed }) => [styles.domainCardTouch, pressed && gamificationSettings.reducedMotion && styles.domainCardPressed]}
              >
                {gamificationSettings.reducedMotion ? (
                  cardContent
                ) : (
                  <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>{cardContent}</Animated.View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* 4) Sticker Book */}
      {gamificationSettings.stickersEnabled ? (
        <>
          <Text style={styles.sectionTitle}>Sticker Book</Text>
          <Card variant="elevated" style={styles.stickerCard}>
            <View style={styles.stickerProgressHeader}>
              <Text style={styles.stickerCount}>{stickers.owned.length} / 10 collected</Text>
              <View style={styles.stickerProgressTrack}>
                <View style={[styles.stickerProgressFill, { width: `${(stickers.owned.length / 10) * 100}%` }]} />
              </View>
            </View>
            <View style={styles.stickerGrid}>
              {STICKER_IDS.map((id) => {
                const owned = stickers.owned.includes(id);
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.stickerCell, !owned && styles.stickerCellLocked]}
                    onPress={() => setStickerModalId(id)}
                    activeOpacity={0.8}
                  >
                    {owned && <View style={styles.stickerShine} />}
                    <Text style={[styles.stickerEmoji, !owned && styles.stickerEmojiLocked]}>{STICKER_EMOJI[id]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        </>
      ) : null}

      <Modal visible={stickerModalId != null} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setStickerModalId(null)}>
          <View style={styles.modalBox}>
            {stickerModalId != null && (
              <>
                <Text style={styles.modalEmoji}>{STICKER_EMOJI[stickerModalId]}</Text>
                <Text style={styles.modalName}>{STICKER_NAMES[stickerModalId]}</Text>
                <Text style={styles.modalEarned}>You earned this by practicing!</Text>
              </>
            )}
            <Button title="Close" onPress={() => setStickerModalId(null)} variant="ghost" size="small" />
          </View>
        </Pressable>
      </Modal>

      <Modal visible={claimedModalVisible} transparent animationType="fade">
        <View style={styles.celebBackdrop}>
          {gamificationSettings.reducedMotion ? (
            <View style={styles.celebBox}>
              {newlyClaimedId && (
                <>
                  <Text style={styles.celebEmoji}>{STICKER_EMOJI[newlyClaimedId]}</Text>
                  <Text style={styles.celebTitle}>You earned a sticker!</Text>
                  <Text style={styles.celebName}>{STICKER_NAMES[newlyClaimedId]}</Text>
                </>
              )}
              <Button title="Awesome!" onPress={() => setClaimedModalVisible(false)} variant="primary" size="small" style={styles.celebBtn} />
            </View>
          ) : (
            <Animated.View style={[styles.celebBox, { transform: [{ scale: claimScale }], opacity: claimOpacity }]}>
              {newlyClaimedId && (
                <>
                  <Text style={styles.celebEmoji}>{STICKER_EMOJI[newlyClaimedId]}</Text>
                  <Text style={styles.celebTitle}>You earned a sticker!</Text>
                  <Text style={styles.celebName}>{STICKER_NAMES[newlyClaimedId]}</Text>
                </>
              )}
              <Button title="Awesome!" onPress={() => setClaimedModalVisible(false)} variant="primary" size="small" style={styles.celebBtn} />
            </Animated.View>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: layout.fabContentPaddingBottom },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  heroGradient: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: layout.screenPadding,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  heroTitle: { ...typography.HeroTitle, color: colors.text, marginTop: spacing.md },
  sectionTitle: { ...typography.SectionTitle, color: colors.text, marginBottom: spacing.sm, paddingHorizontal: layout.screenPadding },
  questCardWrap: { paddingHorizontal: layout.screenPadding, marginBottom: spacing.lg },
  questCard: { marginBottom: 0, ...shadows.sm },
  questCardLarge: { marginBottom: 0, padding: layout.cardPadding, ...shadows.md },
  questDisabledRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  questEmpty: { ...typography.body, color: colors.textSecondary },
  questErrorText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  questBtn: {},
  questHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  questHeaderText: { flex: 1, marginLeft: spacing.md },
  questDomain: { ...typography.Caption, color: colors.textSecondary, marginBottom: 2 },
  questTool: { ...typography.CardTitle, color: colors.text },
  questCompletedBlock: { marginTop: spacing.xs },
  questCompletedBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  questCheckIcon: { fontSize: 24, color: colors.success, fontWeight: '700' },
  questCompleted: { ...typography.CardTitle, color: colors.text },
  lockIcon: { fontSize: 22 },
  claimBtn: {},
  questClaimed: { ...typography.Caption, color: colors.textSecondary },
  loadRow: { marginBottom: spacing.lg, paddingHorizontal: layout.screenPadding },
  carousel: { marginHorizontal: -layout.screenPadding },
  carouselContent: { paddingHorizontal: layout.screenPadding, gap: DOMAIN_CARD_GAP, paddingBottom: spacing.sm },
  domainCardTouch: { marginRight: DOMAIN_CARD_GAP },
  domainCardPressed: { opacity: 0.9 },
  domainCardCarousel: { marginBottom: 0, padding: layout.cardPaddingCompact },
  domainCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  levelBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  levelText: { ...typography.caption, fontWeight: '600' },
  domainNameCarousel: { ...typography.CardTitle, color: colors.text, marginBottom: spacing.sm },
  domainMiniBar: { marginBottom: spacing.xs },
  sessionsText: { ...typography.Caption, color: colors.textSecondary },
  stickerCard: { marginHorizontal: layout.screenPadding, marginBottom: spacing.lg, padding: layout.cardPadding },
  stickerProgressHeader: { marginBottom: spacing.md },
  stickerCount: { ...typography.Caption, color: colors.textSecondary, marginBottom: spacing.xs },
  stickerProgressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  stickerProgressFill: { height: '100%', backgroundColor: colors.childAccent, borderRadius: 3 },
  stickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  stickerCell: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  stickerCellLocked: { opacity: 0.45 },
  stickerShine: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 28 },
  stickerEmoji: { fontSize: 28 },
  stickerEmojiLocked: { opacity: 0.75 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  modalBox: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center', minWidth: 260, ...shadows.modal },
  modalEmoji: { fontSize: 48, marginBottom: spacing.sm },
  modalName: { ...typography.CardTitle, color: colors.text, marginBottom: spacing.xs },
  modalEarned: { ...typography.Caption, color: colors.textSecondary, marginBottom: spacing.lg },
  celebBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  celebBox: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center', minWidth: 260, ...shadows.modal },
  celebEmoji: { fontSize: 56, marginBottom: spacing.sm },
  celebTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  celebName: { ...typography.body, color: colors.childAccent, marginBottom: spacing.lg },
  celebBtn: {},
});
