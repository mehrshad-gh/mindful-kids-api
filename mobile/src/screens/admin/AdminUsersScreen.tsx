import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { SegmentedTabs } from '../../components/ui/SegmentedTabs';
import {
  listAdminUsers,
  type AdminUserRole,
  type AdminUserListItem,
} from '../../api/admin';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const ROLE_OPTIONS: { value: AdminUserRole; label: string }[] = [
  { value: 'parent', label: 'Parents' },
  { value: 'therapist', label: 'Therapists' },
  { value: 'clinic_admin', label: 'Clinic Admins' },
  { value: 'admin', label: 'Admins' },
];

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}

function UserCard({ item }: { item: AdminUserListItem }) {
  return (
    <Card style={styles.card}>
      <Text style={styles.name} numberOfLines={1}>{item.name || '—'}</Text>
      <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
      <Text style={styles.date}>{formatDate(item.created_at)}</Text>
    </Card>
  );
}

export function AdminUsersScreen() {
  const [role, setRole] = useState<AdminUserRole>('parent');
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const PAGE_SIZE = 50;

  const load = useCallback(async (offset = 0) => {
    const isLoadMore = offset > 0;
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    try {
      const { users: list, total: totalCount } = await listAdminUsers({
        role,
        limit: PAGE_SIZE,
        offset,
        q: search.trim() || undefined,
        sort: 'created_at_desc',
      });
      if (offset === 0) {
        setUsers(list);
      } else {
        setUsers((prev) => [...prev, ...list]);
      }
      setTotal(totalCount);
      setError(null);
    } catch (e) {
      if (offset === 0) {
        setError(e instanceof Error ? e.message : 'Could not load users');
        setUsers([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [role, search]);

  const loadMore = useCallback(() => {
    if (loadingMore || users.length >= total) return;
    load(users.length);
  }, [load, loadingMore, users.length, total]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load(0);
    }, [load])
  );

  const isFirstRole = useRef(true);
  useEffect(() => {
    if (isFirstRole.current) {
      isFirstRole.current = false;
      return;
    }
    setLoading(true);
    load(0);
  }, [role]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(0);
  }, [load]);

  // Server-side search: debounce 400ms when search changes (skip initial mount to avoid double load)
  const isInitialSearchRef = useRef(true);
  useEffect(() => {
    if (isInitialSearchRef.current) {
      isInitialSearchRef.current = false;
      return;
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (search.trim()) {
      searchDebounceRef.current = setTimeout(() => {
        setLoading(true);
        load(0);
      }, 400);
    } else {
      setLoading(true);
      load(0);
    }
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [search, load]);

  return (
    <ScreenLayout scroll={false}>
      <View style={styles.tabsWrap}>
        <SegmentedTabs
          options={ROLE_OPTIONS}
          value={role}
          onChange={(v) => {
            setRole(v as AdminUserRole);
            setLoading(true);
            setSearch('');
          }}
        />
      </View>
      <TextInput
        style={styles.search}
        placeholder="Search by name or email..."
        placeholderTextColor={colors.textTertiary}
        value={search}
        onChangeText={setSearch}
      />
      {loading && users.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <UserCard item={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {search.trim() ? 'No matches.' : `No ${ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role}.`}
            </Text>
          }
          ListHeaderComponent={
            total > 0 ? (
              <Text style={styles.totalText}>{total} total</Text>
            ) : null
          }
          ListFooterComponent={
            users.length > 0 && users.length < total ? (
              <TouchableOpacity
                style={styles.loadMoreWrap}
                onPress={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.loadMoreText}>Load more</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  tabsWrap: {
    marginBottom: spacing.md,
  },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  date: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  errorCard: { marginBottom: spacing.md },
  errorText: { ...typography.body, color: colors.error },
  empty: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  totalText: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  loadMoreWrap: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  loadMoreText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});
