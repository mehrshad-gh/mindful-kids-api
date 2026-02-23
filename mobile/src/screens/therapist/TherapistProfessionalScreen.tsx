import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { getApplication, upsertApplication } from '../../api/therapist';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import type { TherapistOnboardingStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<TherapistOnboardingStackParamList, 'TherapistProfessional'>;

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const d = err.response.data as { error?: string };
    if (d.error) return d.error;
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}

export function TherapistProfessionalScreen({ navigation }: { navigation: Nav }) {
  const { user } = useAuth();
  const [professionalName, setProfessionalName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getApplication();
        if (cancelled) return;
        if (res.application) {
          setProfessionalName(res.application.professional_name || '');
          setEmail(res.application.email || user?.email || '');
          setPhone(res.application.phone || '');
          setBio(res.application.bio || '');
        } else {
          setProfessionalName(user?.name || '');
          setEmail(user?.email || '');
        }
      } catch {
        if (!cancelled) {
          setProfessionalName(user?.name || '');
          setEmail(user?.email || '');
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleNext = async () => {
    if (!professionalName.trim() || !email.trim()) {
      Alert.alert('Required', 'Professional name and email are required.');
      return;
    }
    setLoading(true);
    try {
      await upsertApplication({
        professional_name: professionalName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      navigation.navigate('TherapistCredentials');
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return null;

  return (
    <ScreenLayout>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <Input
            label="Professional name"
            value={professionalName}
            onChangeText={setProfessionalName}
            placeholder="As it appears on your license"
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="Optional" keyboardType="phone-pad" />
          <Input
            label="Short bio"
            value={bio}
            onChangeText={setBio}
            placeholder="A few sentences about your practice (optional)"
            multiline
            numberOfLines={3}
          />
          <Button title="Continue" onPress={handleNext} loading={loading} style={styles.button} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  button: { marginTop: spacing.lg },
});
