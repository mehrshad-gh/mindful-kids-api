import React, { useState } from 'react';
import { StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useChildren } from '../../hooks/useChildren';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { spacing } from '../../theme/spacing';
import type { OnboardingStackParamList } from '../../types/navigation';

const AGE_GROUPS = ['3-5', '6-8', '9-12', '13+'] as const;

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'AddChild'>;
};

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

export function OnboardingAddChildScreen({ navigation }: Props) {
  const { setSelectedChild } = useAuth();
  const { createChild } = useChildren();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [saving, setSaving] = useState(false);

  const goNext = () => navigation.navigate('ParentChildExplain');

  const handleAdd = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Please enter the child\'s name');
      return;
    }
    const trimmedAgeGroup = ageGroup.trim();
    if (trimmedAgeGroup && !AGE_GROUPS.includes(trimmedAgeGroup as (typeof AGE_GROUPS)[number])) {
      Alert.alert('Error', 'Age group must be one of: 3-5, 6-8, 9-12, 13+');
      return;
    }
    const trimmedBirthDate = birthDate.trim();
    if (trimmedBirthDate && !/^\d{4}-\d{2}-\d{2}$/.test(trimmedBirthDate)) {
      Alert.alert('Error', 'Birth date must be YYYY-MM-DD (e.g. 2020-05-15)');
      return;
    }
    setSaving(true);
    try {
      const child = await createChild({
        name: trimmedName,
        birth_date: trimmedBirthDate || undefined,
        age_group: trimmedAgeGroup || undefined,
      });
      setSelectedChild(child.id);
      goNext();
    } catch (err) {
      Alert.alert('Could not add child', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <Input
            label="Child's name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Emma"
          />
          <Input
            label="Birth date (optional)"
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="YYYY-MM-DD"
          />
          <Input
            label="Age group (optional)"
            value={ageGroup}
            onChangeText={setAgeGroup}
            placeholder="3-5, 6-8, 9-12, 13+"
          />
          <Button
            title="Add child"
            onPress={handleAdd}
            loading={saving}
            style={styles.submit}
          />
          <Button
            title="Skip for now"
            onPress={goNext}
            variant="ghost"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  submit: { marginTop: spacing.lg, marginBottom: spacing.xs },
});
