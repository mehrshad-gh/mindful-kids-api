import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { createClinic } from '../../api/admin';
import type { AdminStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminClinicForm'>;

export function AdminClinicFormScreen() {
  const navigation = useNavigation<Nav>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Required', 'Clinic name is required.');
      return;
    }
    setLoading(true);
    try {
      await createClinic({
        name: trimmedName,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        address: address.trim() || undefined,
        country: country.trim() || undefined,
        website: website.trim() || undefined,
      });
      Alert.alert('Done', 'Clinic created. Therapists can now select it when applying.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not create clinic.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            label="Clinic name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Tehran Psychology Center"
            autoCapitalize="words"
          />
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Short description (optional)"
            multiline
            numberOfLines={2}
          />
          <Input
            label="Location / city"
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Tehran"
          />
          <Input
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Full address (optional)"
          />
          <Input
            label="Country (code)"
            value={country}
            onChangeText={setCountry}
            placeholder="e.g. IR"
            autoCapitalize="characters"
          />
          <Input
            label="Website"
            value={website}
            onChangeText={setWebsite}
            placeholder="https://..."
            keyboardType="url"
            autoCapitalize="none"
          />
          <Button title="Create clinic" onPress={handleCreate} loading={loading} style={styles.submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xl },
  submit: { marginTop: spacing.lg },
});
