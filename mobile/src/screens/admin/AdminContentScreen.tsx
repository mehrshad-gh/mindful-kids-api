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
import { listAdminContent, type AdminContentItem, type AdminContentType } from '../../api/admin';
import type { AdminStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminContent'>;

const TYPE_OPTIONS: { value: AdminContentType | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'article', label: 'Articles' },
  { value: 'video', label: 'Videos' },
  { value: 'activity', label: 'Activities' },
];

function ContentRow({
  item,
  onPress,
}: {
  item: AdminContentItem;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card style={styles.row}>
        <View style={styles.rowMain}>
          <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.rowMeta}>{item.type} {item.age_range ? ` · ${item.age_range}` : ''}</Text>
        </View>
        <View style={[styles.badge, item.is_published ? styles.badgePublished : styles.badgeDraft]}>
          <Text style={styles.badgeText}>{item.is_published ? 'Published' : 'Draft'}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export function AdminContentScreen() {
  const navigation = useNavigation<Nav>();
  const [typeFilter, setTypeFilter] = useState<AdminContentType | ''>('');
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items: list } = await listAdminContent(
        typeFilter ? { type: typeFilter } : undefined
      );
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load content');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScreenLayout scroll={false}>
      <View style={styles.filterRow}>
        {TYPE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value || 'all'}
            style={[styles.filterChip, typeFilter === opt.value && styles.filterChipActive]}
            onPress={() => setTypeFilter(opt.value as AdminContentType | '')}
          >
            <Text style={[styles.filterText, typeFilter === opt.value && styles.filterTextActive]}>
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
          <TouchableOpacity onPress={load}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </Card>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ContentRow
              item={item}
              onPress={() => navigation.navigate('AdminContentDetail', { contentId: item.id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No content yet.</Text>
          }
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md, gap: spacing.sm },
  filterChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
  },
  filterChipActive: { backgroundColor: colors.primaryLight },
  filterText: { ...typography.subtitle, color: colors.textSecondary },
  filterTextActive: { ...typography.subtitle, color: colors.primary, fontWeight: '600' },
  row: { marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowMain: { flex: 1, marginRight: spacing.sm },
  rowTitle: { ...typography.body, fontWeight: '600', color: colors.text },
  rowMeta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  badge: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: 6 },
  badgePublished: { backgroundColor: colors.successMuted },
  badgeDraft: { backgroundColor: colors.surfaceSubtle },
  badgeText: { ...typography.caption, fontWeight: '600' },
  listContent: { paddingBottom: spacing.xl },
  card: { marginBottom: spacing.md },
  errorText: { ...typography.body, color: colors.text },
  retryText: { ...typography.body, color: colors.primary, marginTop: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg },
  centered: { paddingVertical: spacing.xl, alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
});
