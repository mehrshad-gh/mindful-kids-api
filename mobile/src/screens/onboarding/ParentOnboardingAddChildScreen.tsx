import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useChildren } from '../../hooks/useChildren';
import { AuthBackground } from '../../components/auth/AuthBackground';
import { AuthCard } from '../../components/auth/AuthCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { layout } from '../../theme';
import { borderRadius } from '../../theme/spacing';
import type { ParentOnboardingStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<ParentOnboardingStackParamList, 'ParentOnboardingAddChild'>;

const AGE_GROUPS = ['3-5', '6-8', '9-12', '13+'] as const;

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const d = err.response.data as { error?: string; details?: Array<{ message?: string }> };
    if (d.error) return d.error;
    if (Array.isArray(d.details) && d.details.length)
      return d.details.map((e) => e.message || '').filter(Boolean).join('. ') || d.error || 'Validation failed';
  }
  if (err instanceof Error) return err.message;
  return 'Could not add child';
}

export function ParentOnboardingAddChildScreen({ navigation }: { navigation: Nav }) {
  const insets = useSafeAreaInsets();
  const { setSelectedChild } = useAuth();
  const { createChild } = useChildren();
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<typeof AGE_GROUPS[number] | ''>('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Please enter your child\'s name');
      return;
    }
    if (!ageGroup || !AGE_GROUPS.includes(ageGroup as typeof AGE_GROUPS[number])) {
      Alert.alert('Error', 'Please choose an age group');
      return;
    }
    setSaving(true);
    try {
      const child = await createChild({
        name: trimmedName,
        age_group: ageGroup,
      });
      setSelectedChild(child.id);
      navigation.navigate('ParentOnboardingFirstPractice');
    } catch (err) {
      Alert.alert('Could not add child', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <AuthBackground variant="family" heroFraction={0.35}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: layout.screenPadding }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.stepWrap}>
            <Text style={styles.stepLabel}>Step 2 of 3</Text>
          </View>
          <AuthCard style={styles.card}>
            <Text style={styles.cardTitle}>Add your child</Text>
            <Text style={styles.cardSubtitle}>We'll suggest the right practice for their age.</Text>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <Input
                label="Child's name"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Emma"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
              <Text style={styles.label}>Age group</Text>
              <View style={styles.ageRow}>
                {AGE_GROUPS.map((ag) => (
                  <TouchableOpacity
                    key={ag}
                    style={[styles.ageChip, ageGroup === ag && styles.ageChipActive]}
                    onPress={() => setAgeGroup(ag)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: ageGroup === ag }}
                  >
                    <Text style={[styles.ageChipText, ageGroup === ag && styles.ageChipTextActive]}>{ag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </KeyboardAvoidingView>
            <Button
              title="Continue"
              onPress={handleAdd}
              loading={saving}
              fullWidth
              size="large"
              style={styles.cta}
            />
          </AuthCard>
        </ScrollView>
      </AuthBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: spacing.md, paddingBottom: layout.sectionGap },
  stepWrap: { marginBottom: spacing.sm },
  stepLabel: { ...typography.caption, color: colors.textSecondary },
  card: { marginTop: spacing.sm },
  cardTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  cardSubtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.lg },
  input: { marginBottom: spacing.md },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.sm },
  ageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  ageChip: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minWidth: 64,
    alignItems: 'center',
  },
  ageChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  ageChipText: { ...typography.bodySmall, color: colors.textSecondary },
  ageChipTextActive: { color: colors.primary, fontWeight: '600' },
  cta: { minHeight: layout.touchTargetMin },
});
