import React, { useState, useCallback } from 'react';
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
import { fetchContentList, type ContentItem } from '../../api/content';
import type { ParentStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<ParentStackParamList, 'KidsActivities'>;

const AGE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All ages' },
  { value: '3-5', label: '3–5' },
  { value: '6-8', label: '6–8' },
  { value: '9-12', label: '9–12' },
  { value: '13+', label: '13+' },
];

function ActivityCard({
  item,
  onPress,
}: {
  item: ContentItem;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card style={styles.card}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        {item.summary ? (
          <Text style={styles.cardSummary} numberOfLines={2}>{item.summary}</Text>
        ) : null}
        {item.age_range ? (
          <Text style={styles.cardMeta}>Ages {item.age_range}</Text>
        ) : null}
        {item.psychology_basis && item.psychology_basis.length > 0 ? (
          <Text style={styles.cardBasis} numberOfLines={1}>
            {item.psychology_basis.join(' • ')}
          </Text>
        ) : null}
      </Card>
    </TouchableOpacity>
  );
}

export function KidsActivitiesScreen() {
  const navigation = useNavigation<Nav>();
  const [ageRange, setAgeRange] = useState('');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchContentList({
        type: 'activity',
        ...(ageRange ? { age_range: ageRange } : {}),
      });
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load activities');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [ageRange]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScreenLayout scroll={false}>
      <Text style={styles.lead}>Activities to build emotional skills with your child.</Text>
      <View style={styles.filterRow}>
        {AGE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value || 'all'}
            style={[styles.filterChip, ageRange === opt.value && styles.filterChipActive]}
            onPress={() => setAgeRange(opt.value)}
          >
            <Text style={[styles.filterChipText, ageRange === opt.value && styles.filterChipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : error ? (
        <Card style={styles.card}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </Card>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ActivityCard
              item={item}
              onPress={() => navigation.navigate('ContentDetail', { contentId: item.id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No activities for this age yet.</Text>
          }
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  lead: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md, gap: spacing.sm },
  filterChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
  },
  filterChipActive: { backgroundColor: colors.primaryLight },
  filterChipText: { ...typography.subtitle, color: colors.textSecondary },
  filterChipTextActive: { ...typography.subtitle, color: colors.primary, fontWeight: '600' },
  card: { marginBottom: spacing.md },
  cardTitle: { ...typography.body, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  cardSummary: { ...typography.subtitle, color: colors.textSecondary },
  cardMeta: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.xs },
  cardBasis: { ...typography.caption, color: colors.primary, marginTop: spacing.xs },
  listContent: { paddingBottom: spacing.xl },
  centered: { paddingVertical: spacing.xl, alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  errorText: { ...typography.body, color: colors.text },
  retryBtn: { marginTop: spacing.sm },
  retryText: { ...typography.body, color: colors.primary, textDecorationLine: 'underline' },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg },
});
