import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Animated, Easing, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { ScrollableScreen } from '../../components/layout/ScrollableScreen';
import { submitClinicApplication } from '../../api/clinicApplications';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';
import { layout } from '../../theme';

const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const;

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const d = err.response.data as { error?: string };
    if (d.error) return d.error;
  }
  if (axios.isAxiosError(err) && err.response?.status === 429) return 'Too many submissions. Please try again later.';
  return err instanceof Error ? err.message : 'Something went wrong.';
}

// ----------------------------------------------------------------------
// Shared UI Components (matching AuthLandingScreen)
// ----------------------------------------------------------------------

const AmbientBackground = React.memo(() => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 25000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [anim]);

  const rotate1 = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rotate2 = anim.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#F0F4FA' }]} />
      <Animated.View
        style={[
          styles.blob,
          styles.blob1,
          { transform: [{ rotate: rotate1 }, { translateX: 60 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          styles.blob2,
          { transform: [{ rotate: rotate2 }, { translateX: -80 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          styles.blob3,
          { transform: [{ rotate: rotate1 }, { translateY: 90 }] },
        ]}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.4)' }]} />
    </View>
  );
});

function FloatingInput({ label, multiline, value, onChangeText, autoCapitalize, keyboardType }: any) {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused || value !== '' ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, focusAnim]);

  const labelTop = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 8],
  });
  const labelFontSize = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 12],
  });
  const labelColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textMuted, colors.primary],
  });
  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0.06)', colors.primary],
  });

  return (
    <Animated.View style={[styles.floatingInputWrap, multiline && { height: 100 }, { borderColor }]}>
      <Animated.Text style={[styles.floatingLabel, { top: labelTop, fontSize: labelFontSize, color: labelColor }]}>
        {label}
      </Animated.Text>
      <TextInput
        style={[styles.floatingTextInput, multiline && { height: 76, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </Animated.View>
  );
}

function GlowingCTA({ title, onPress, loading, disabled }: { title: string; onPress: () => void; loading?: boolean; disabled?: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled) Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    if (!disabled) Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.9}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <Animated.View style={[styles.ctaContainer, disabled && { opacity: 0.5, shadowOpacity: 0 }, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={[colors.primary, '#4A7BD9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaGradient}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>{title}</Text>
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function ClinicApplicationFormScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [clinicName, setClinicName] = useState('');
  const [country, setCountry] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');
  const [document, setDocument] = useState<{ uri: string; name: string; mimeType?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [picking, setPicking] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const cardOp = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOp, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(cardSlide, { toValue: 0, tension: 30, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [cardOp, cardSlide]);

  const handlePickDocument = async () => {
    setPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ALLOWED_DOCUMENT_TYPES, copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets[0];
      setDocument({ uri: file.uri, name: file.name ?? 'document', mimeType: file.mimeType ?? undefined });
    } catch {
      Alert.alert('Error', 'Could not select file.');
    } finally {
      setPicking(false);
    }
  };

  const handleSubmit = async () => {
    const name = clinicName.trim();
    const c = country.trim();
    const email = contactEmail.trim();
    if (!name || !c || !email) {
      Alert.alert('Missing fields', 'Clinic name, country, and contact email are required.');
      return;
    }
    if (!document) {
      Alert.alert('Document required', 'Please attach a PDF or image.');
      return;
    }
    if (!termsAccepted) {
      Alert.alert('Error', 'You must agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    setSubmitting(true);
    try {
      await submitClinicApplication({ clinic_name: name, country: c, contact_email: email, contact_phone: contactPhone.trim() || undefined, description: description.trim() || undefined }, document);
      setSubmitted(true);
    } catch (err) {
      Alert.alert('Submission failed', getErrorMessage(err));
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.screen}>
        <AmbientBackground />
        <View style={[styles.successContainer, { paddingTop: insets.top }]}>
          <Animated.View style={[{ opacity: cardOp, transform: [{ translateY: cardSlide }], alignItems: 'center' }]}>
            <View style={styles.successIconCircle}>
              <Text style={styles.successIcon}>🎉</Text>
            </View>
            <Text style={styles.headerTitle}>Application Sent</Text>
            <Text style={styles.headerSubtitle}>Thank you for applying to partner with MindfulKids.</Text>
            
            <View style={[styles.glassCard, { marginTop: 40, width: '100%' }]}>
              <Text style={styles.statusLabel}>Current Status</Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>Under Review</Text>
              </View>
              <Text style={styles.successMessage}>
                Our team will review your clinic details and reach out to you at {contactEmail} within 24–48 hours.
              </Text>
              
              <TouchableOpacity style={styles.backHomeBtn} onPress={() => navigation.navigate('AuthLanding')}>
                <Text style={styles.backHomeText}>Return to Home</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AmbientBackground />
      <ScrollableScreen
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + layout.sectionGap },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[{ opacity: cardOp, transform: [{ translateY: cardSlide }] }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <View style={styles.backBtnInner}>
              <Text style={styles.backIcon}>←</Text>
              <Text style={styles.backText}>Back</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoEmoji}>🏢</Text>
            </View>
            <Text style={styles.headerTitle}>Clinic Application</Text>
            <Text style={styles.headerSubtitle}>List your clinic and manage therapists.</Text>
          </View>

          <View style={styles.glassCard}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              
              <Text style={styles.sectionTitle}>Clinic Details</Text>
              <FloatingInput label="Clinic Name *" value={clinicName} onChangeText={setClinicName} />
              <FloatingInput label="Country *" value={country} onChangeText={setCountry} />
              <FloatingInput label="Description (Optional)" value={description} onChangeText={setDescription} multiline />
              
              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Contact Information</Text>
              <FloatingInput label="Contact Email *" value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" autoCapitalize="none" />
              <FloatingInput label="Contact Phone" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Verification Document *</Text>
              <Text style={styles.sectionHint}>Please provide a business license or registration (PDF/Image, max 10MB).</Text>
              
              <TouchableOpacity style={styles.docButton} onPress={handlePickDocument} disabled={picking} activeOpacity={0.7}>
                {picking ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : document ? (
                  <View style={styles.docSelected}>
                    <Text style={styles.docSelectedIcon}>📄</Text>
                    <View style={styles.docSelectedInfo}>
                      <Text style={styles.docSelectedName} numberOfLines={1}>{document.name}</Text>
                      <Text style={styles.docSelectedHint}>Tap to change file</Text>
                    </View>
                    <Text style={styles.docCheck}>✓</Text>
                  </View>
                ) : (
                  <View style={styles.docEmpty}>
                    <View style={styles.docUploadIconWrap}>
                      <Text style={styles.docUploadIcon}>↑</Text>
                    </View>
                    <Text style={styles.docUploadText}>Tap to upload document</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.checkboxRow}>
                <TouchableOpacity onPress={() => setTermsAccepted(!termsAccepted)} activeOpacity={0.7} style={styles.checkboxTouchTarget}>
                  <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                    {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
                <View style={styles.legalCopyWrap}>
                  <Text style={styles.legalCopy}>I agree to the </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <Text style={styles.legalLink}>Terms of Service</Text>
                  </TouchableOpacity>
                  <Text style={styles.legalCopy}>, </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <Text style={styles.legalLink}>Privacy Policy</Text>
                  </TouchableOpacity>
                  <Text style={styles.legalCopy}>, and </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('ProfessionalDisclaimer')} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <Text style={styles.legalLink}>Professional Disclaimer</Text>
                  </TouchableOpacity>
                  <Text style={styles.legalCopy}>.</Text>
                </View>
              </View>

              <View style={{ marginTop: 16 }}>
                <GlowingCTA title="Submit Application" onPress={handleSubmit} loading={submitting} disabled={!document} />
              </View>

            </KeyboardAvoidingView>
          </View>
        </Animated.View>
      </ScrollableScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingHorizontal: layout.screenPadding },

  // --- Background Blobs ---
  blob: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    opacity: 0.4,
  },
  blob1: { backgroundColor: colors.primary, top: -100, right: -100 },
  blob2: { backgroundColor: '#4A7BD9', bottom: 100, left: -150 },
  blob3: { backgroundColor: '#74A3FF', top: 300, right: -200 },

  // --- Header ---
  backBtn: { alignSelf: 'flex-start', marginBottom: spacing.lg },
  backBtnInner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,1)', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 },
  backIcon: { fontSize: 16, color: colors.primary, marginRight: 6, fontWeight: '600' },
  backText: { ...typography.Body, color: colors.primary, fontWeight: '600' },
  header: { alignItems: 'center', marginBottom: 32 },
  logoBadge: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.9)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 5, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 1)' },
  logoEmoji: { fontSize: 32 },
  headerTitle: { ...typography.HeroTitle, fontSize: 32, letterSpacing: -0.5, color: colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  headerSubtitle: { ...typography.Body, fontSize: 16, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 },

  // --- Card & Form ---
  glassCard: { backgroundColor: 'rgba(255, 255, 255, 0.85)', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.95)', shadowColor: colors.primary, shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.08, shadowRadius: 40, elevation: 10, marginBottom: 32 },
  sectionTitle: { ...typography.CardTitle, color: colors.textPrimary, marginBottom: 16, marginTop: 8 },
  sectionHint: { ...typography.Caption, color: colors.textSecondary, marginTop: -12, marginBottom: 16 },
  divider: { height: 1, backgroundColor: 'rgba(31, 42, 55, 0.1)', marginVertical: 24 },
  
  floatingInputWrap: { height: 64, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, marginBottom: 16, justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  floatingLabel: { position: 'absolute', left: 16, fontWeight: '500' },
  floatingTextInput: { ...typography.Body, color: colors.textPrimary, marginTop: 16, height: 40 },

  // --- Document Picker ---
  docButton: { backgroundColor: '#fff', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: 16, padding: 16, minHeight: 100, justifyContent: 'center' },
  docEmpty: { alignItems: 'center' },
  docUploadIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(91, 141, 239, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  docUploadIcon: { color: colors.primary, fontSize: 20, fontWeight: '700' },
  docUploadText: { ...typography.Body, color: colors.primary, fontWeight: '600' },
  docSelected: { flexDirection: 'row', alignItems: 'center' },
  docSelectedIcon: { fontSize: 32, marginRight: 16 },
  docSelectedInfo: { flex: 1 },
  docSelectedName: { ...typography.Body, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  docSelectedHint: { ...typography.Caption, color: colors.primary },
  docCheck: { fontSize: 20, color: colors.success, marginLeft: 16 },

  // --- CTA ---
  ctaContainer: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, borderRadius: 16, marginTop: 8 },
  ctaGradient: { height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ctaText: { ...typography.Body, color: '#fff', fontWeight: '700', fontSize: 18, letterSpacing: 0.5 },
  
  // --- Checkbox & Legal ---
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 8, paddingHorizontal: 4 },
  checkboxTouchTarget: { marginRight: 10 },
  legalCopyWrap: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkboxChecked: { backgroundColor: colors.primary },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  legalCopy: { ...typography.Caption, color: colors.textSecondary, flex: 1, lineHeight: 20 },
  legalLink: { color: colors.primary, fontWeight: '600' },
  
  // --- Success State ---
  successContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: layout.screenPadding },
  successIconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(110, 211, 166, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 2, borderColor: 'rgba(110, 211, 166, 0.5)', alignSelf: 'center' },
  successIcon: { fontSize: 48 },
  statusLabel: { ...typography.label, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', marginBottom: 12 },
  statusPill: { alignSelf: 'center', backgroundColor: 'rgba(249, 199, 79, 0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(249, 199, 79, 0.5)', marginBottom: 20 },
  statusPillText: { color: '#B38114', fontWeight: '700', fontSize: 15 },
  successMessage: { ...typography.Body, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  backHomeBtn: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 24, backgroundColor: 'rgba(91, 141, 239, 0.1)', borderRadius: 24 },
  backHomeText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
});
