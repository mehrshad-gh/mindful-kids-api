import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { borderRadius } from '../../theme/spacing';

export interface TabOption<T extends string> {
  value: T;
  label: string;
}

type SegmentedTabsVariant = 'default' | 'pill';

interface SegmentedTabsProps<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: SegmentedTabsVariant;
}

export function SegmentedTabs<T extends string>({ options, value, onChange, variant = 'default' }: SegmentedTabsProps<T>) {
  const isPill = variant === 'pill';
  return (
    <View style={[styles.wrap, isPill && styles.wrapPill]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.tab,
              active && styles.tabActive,
              isPill && styles.tabPill,
              isPill && active && styles.tabPillActive,
            ]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.tabText,
              active && styles.tabTextActive,
              isPill && active && styles.tabTextPillActive,
            ]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.md,
    padding: 4,
    gap: 4,
  },
  wrapPill: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    padding: 4,
    borderRadius: borderRadius.full,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPill: {
    borderRadius: borderRadius.full,
  },
  tabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  tabPillActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  tabText: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: colors.text, fontWeight: '600' },
  tabTextPillActive: { color: colors.textInverse, fontWeight: '600' },
});
