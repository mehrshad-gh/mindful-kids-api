import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { VerifiedExplainerModal } from '../../components/VerifiedExplainerModal';
import { fetchPsychologistList, type PsychologistListItem } from '../../api/psychologists';
import type { ParentStackParamList, ParentTabParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, layout } from '../../theme';
import { typography } from '../../theme/typography';

const SPECIALTY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All specialties' },
  { value: 'Child therapy', label: 'Child therapy' },
  { value: 'Anxiety', label: 'Anxiety' },
  { value: 'Parenting', label: 'Parenting' },
];

const RATING_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Any rating' },
  { value: 4, label: '4+' },
  { value: 4.5, label: '4.5+' },
];

type TabNav = NativeStackNavigationProp<ParentTabParamList, 'PsychologistDirectory'>;

function formatRating(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toFixed(1);
}

function PsychologistCard({
  item,
  onPress,
}: {
  item: PsychologistListItem;
  onPress: () => void;
}) {
  const rating = item.avg_rating ?? item.rating ?? null;
  const displayRating = formatRating(rating);
  const reviewCount = item.review_count ?? 0;

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.cardMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
              {item.is_verified ? (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ Verified</Text>
                </View>
              ) : null}
            </View>
            {item.specialty ? (
              <Text style={styles.specialty} numberOfLines={1}>{item.specialty}</Text>
            ) : null}
            <View style={styles.ratingRow}>
              <Text style={styles.ratingText}>{displayRating}</Text>
              <Text style={styles.star}>★</Text>
              {reviewCount > 0 && (
                <Text style={styles.reviewCount}>({reviewCount})</Text>
              )}
            </View>
            {item.location ? (
              <Text style={styles.location} numberOfLines={1}>📍 {item.location}</Text>
            ) : null}
            {item.is_verified && item.verified_country ? (
              <Text style={styles.verifiedCountry}>License verified in {item.verified_country}</Text>
            ) : null}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export function PsychologistDirectoryScreen() {
  const navigation = useNavigation<TabNav>();
  const parentStack = navigation.getParent<NativeStackNavigationProp<ParentStackParamList>>();
  const [list, setList] = useState<PsychologistListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [showVerifiedExplainer, setShowVerifiedExplainer] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPsychologistList({
        specialty: specialty || undefined,
        location: location.trim() || undefined,
        min_rating: minRating ?? undefined,
      });
      setList(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load experts');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [specialty, location, minRating]);

  const loadRef = useRef(load);
  loadRef.current = load;

  useFocusEffect(
    useCallback(() => {
      loadRef.current();
    }, [])
  );

  useEffect(() => {
    load();
  }, [specialty, minRating]);

  useEffect(() => {
    const t = setTimeout(() => loadRef.current(), 400);
    return () => clearTimeout(t);
  }, [location]);

  const openProfile = (psychologistId: string) => {
    parentStack?.navigate('PsychologistDetail', { psychologistId });
  };

  if (loading && list.length === 0) {
    return (
      <ScreenLayout scroll={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.parentAccent} />
          <Text style={styles.loadingText}>Loading experts…</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout scroll={false}>
      <Text style={styles.title}>Expert directory</Text>
      <View style={styles.subtitleRow}>
        <Text style={styles.subtitle}>Browse verified psychologists. Tap a profile for details.</Text>
        <TouchableOpacity onPress={() => setShowVerifiedExplainer(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.verifiedLink}>What does Verified mean?</Text>
        </TouchableOpacity>
      </View>
      <VerifiedExplainerModal visible={showVerifiedExplainer} onClose={() => setShowVerifiedExplainer(false)} />

      <View style={styles.filters}>
        <Text style={styles.filterLabel}>Specialty</Text>
        <View style={styles.chipRow}>
          {SPECIALTY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value || 'all'}
              style={[styles.chip, specialty === opt.value && styles.chipActive]}
              onPress={() => setSpecialty(opt.value)}
            >
              <Text style={[styles.chipText, specialty === opt.value && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.filterLabel}>Rating</Text>
        <View style={styles.chipRow}>
          {RATING_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value ?? 'any'}
              style={[styles.chip, minRating === opt.value && styles.chipActive]}
              onPress={() => setMinRating(opt.value)}
            >
              <Text style={[styles.chipText, minRating === opt.value && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.filterLabel}>Location</Text>
        <Input
          value={location}
          onChangeText={setLocation}
          placeholder="City or region"
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.hint}>Pull down to try again.</Text>
        </Card>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PsychologistCard item={item} onPress={() => openProfile(item.id)} />
          )}
          contentContainerStyle={styles.listContent}
          listEmptyComponent={
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No experts match your filters. Try changing specialty, location, or rating.
              </Text>
            </Card>
          }
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.parentAccent} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subtitleRow: {
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.subtitle,
  },
  verifiedLink: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  filters: {
    marginBottom: spacing.lg,
  },
  filterLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.parentAccent + '18',
    borderColor: colors.parentAccent,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.parentAccent,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  card: {
    marginBottom: layout.listItemGap,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.parentAccent + '22',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.parentAccent,
  },
  cardMeta: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  cardName: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  specialty: {
    ...typography.caption,
    fontSize: 13,
    color: colors.parentAccent,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  ratingText: {
    ...typography.subtitle,
    fontWeight: '600',
    color: colors.text,
  },
  star: {
    fontSize: 12,
    color: colors.warning,
  },
  reviewCount: {
    ...typography.caption,
    marginLeft: 2,
  },
  location: {
    ...typography.caption,
    marginTop: 2,
  },
  verifiedCountry: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    ...typography.subtitle,
    marginTop: spacing.md,
  },
  errorCard: {
    marginTop: spacing.sm,
  },
  errorText: {
    ...typography.error,
  },
  hint: {
    ...typography.caption,
    marginTop: spacing.xs,
    fontSize: 13,
  },
  emptyCard: {},
  emptyText: {
    ...typography.subtitle,
    textAlign: 'center',
  },
});
