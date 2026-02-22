import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useChildren } from '../../hooks/useChildren';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { ParentStackParamList } from '../../types/navigation';

const AGE_GROUPS = ['3-5', '6-8', '9-12', '13+'] as const;

type Nav = NativeStackNavigationProp<ParentStackParamList, 'AddChild'>;

export function AddChildScreen() {
  const navigation = useNavigation<Nav>();
  const { setSelectedChild } = useAuth();
  const { createChild } = useChildren();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Please enter the child\'s name');
      return;
    }
    setSaving(true);
    try {
      const child = await createChild({
        name: trimmedName,
        birth_date: birthDate.trim() || undefined,
        age_group: ageGroup.trim() || undefined,
      });
      setSelectedChild(child.id);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not add child');
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
            onPress={handleSubmit}
            loading={saving}
            style={styles.submit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  submit: { marginTop: spacing.lg },
});
