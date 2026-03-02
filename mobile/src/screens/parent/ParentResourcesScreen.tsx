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
import { fetchContentList, type ContentItem, type ContentType } from '../../api/content';
import type { ParentStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<ParentStackParamList, 'ParentResources'>;

const FILTERS: { value: ContentType; label: string }[] = [
  { value: 'article', label: 'Articles' },
  { value: 'video', label: 'Videos' },
];

function ResourceCard({
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
      </Card>
    </TouchableOpacity>
  );
}

export function ParentResourcesScreen() {
  const navigation = useNavigation<Nav>();
  const [filter, setFilter] = useState<ContentType>('article');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchContentList({ type: filter });
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load resources');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScreenLayout scroll={false}>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterTab, filter === f.value && styles.filterTabActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
              {f.label}
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
            <ResourceCard
              item={item}
              onPress={() => navigation.navigate('ContentDetail', { contentId: item.id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No {filter === 'article' ? 'articles' : 'videos'} yet.</Text>
          }
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', marginBottom: spacing.md, gap: spacing.sm },
  filterTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surfaceSubtle,
  },
  filterTabActive: { backgroundColor: colors.primaryLight },
  filterText: { ...typography.body, color: colors.textSecondary },
  filterTextActive: { color: colors.primary, fontWeight: '600' },
  card: { marginBottom: spacing.md },
  cardTitle: { ...typography.body, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  cardSummary: { ...typography.subtitle, color: colors.textSecondary },
  cardMeta: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.xs },
  listContent: { paddingBottom: spacing.xl },
  centered: { paddingVertical: spacing.xl, alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  errorText: { ...typography.body, color: colors.text },
  retryBtn: { marginTop: spacing.sm },
  retryText: { ...typography.body, color: colors.primary, textDecorationLine: 'underline' },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg },
});
