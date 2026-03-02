import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  View,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getClinic, updateClinic } from '../../api/clinicAdmin';
import type { ClinicStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Nav = NativeStackNavigationProp<ClinicStackParamList, 'ClinicEdit'>;
type Route = RouteProp<ClinicStackParamList, 'ClinicEdit'>;

export function ClinicEditScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { clinicId } = route.params;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { clinic } = await getClinic(clinicId);
      setName(clinic.name ?? '');
      setDescription(clinic.description ?? '');
      setLocation(clinic.location ?? '');
      setAddress(clinic.address ?? '');
      setCountry(clinic.country ?? '');
      setWebsite(clinic.website ?? '');
      setPhone(clinic.phone ?? '');
      setLogoUrl(clinic.logo_url ?? '');
    } catch {
      Alert.alert('Error', 'Could not load clinic.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setInitialLoading(false);
    }
  }, [clinicId, navigation]);

  useFocusEffect(
    useCallback(() => {
      setInitialLoading(true);
      load();
    }, [load])
  );

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Required', 'Clinic name is required.');
      return;
    }
    setLoading(true);
    try {
      await updateClinic(clinicId, {
        name: trimmedName,
        description: description.trim() || null,
        location: location.trim() || null,
        address: address.trim() || null,
        country: country.trim() || null,
        website: website.trim() || null,
        phone: phone.trim() || null,
        logo_url: logoUrl.trim() || null,
      });
      Alert.alert('Saved', 'Clinic profile updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not update clinic.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenLayout>
    );
  }

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
            label="Country"
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
          <Input
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. +1 234 567 8900"
            keyboardType="phone-pad"
          />
          <Input
            label="Logo URL"
            value={logoUrl}
            onChangeText={setLogoUrl}
            placeholder="https://..."
            keyboardType="url"
            autoCapitalize="none"
          />
          <Button
            title="Save changes"
            onPress={handleSave}
            loading={loading}
            style={styles.submit}
          />
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
