import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Linking,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { VerifiedExplainerModal } from '../../components/VerifiedExplainerModal';
import { ReportProfessionalModal } from '../../components/ReportProfessionalModal';
import { fetchPsychologistById, type PsychologistDetail, type PsychologistReview } from '../../api/psychologists';
import { submitReview } from '../../api/reviews';
import { useAuth } from '../../context/AuthContext';
import type { ParentStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, layout } from '../../theme';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<ParentStackParamList, 'PsychologistDetail'>;

function formatRating(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toFixed(1);
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

function StarRating({
  value,
  onSelect,
  size = 18,
}: {
  value: number;
  onSelect: (n: number) => void;
  size?: number;
}) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          onPress={() => onSelect(n)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.starTouch}
        >
          <Text style={[styles.starIcon, { fontSize: size }]}>{n <= value ? '★' : '☆'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ContactLink({ label, value, href }: { label: string; value: string; href?: string }) {
  if (!value) return null;
  const onPress = href ? () => Linking.openURL(href) : undefined;
  const content = (
    <Text style={styles.contactValue} numberOfLines={1}>
      {value}
    </Text>
  );
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.contactRow}>
        <Text style={styles.contactLabel}>{label}</Text>
        {content}
      </TouchableOpacity>
    );
  }
  return (
    <View style={styles.contactRow}>
      <Text style={styles.contactLabel}>{label}</Text>
      {content}
    </View>
  );
}

export function PsychologistDetailScreen({ route, navigation }: Props) {
  const { psychologistId } = route.params;
  const { user } = useAuth();
  const [data, setData] = useState<PsychologistDetail | null>(null);
  const [reviews, setReviews] = useState<PsychologistReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitRating, setSubmitRating] = useState(0);
  const [submitComment, setSubmitComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showVerifiedExplainer, setShowVerifiedExplainer] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPsychologistById(psychologistId);
      setData(res?.psychologist ?? null);
      setReviews(res?.reviews ?? []);
      if (!res?.psychologist) setError('Profile not found');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load profile');
      setData(null);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [psychologistId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const myReview = user ? reviews.find((r) => r.user_id === user.id) : null;

  useEffect(() => {
    if (myReview) {
      setSubmitRating(myReview.rating);
      setSubmitComment(myReview.comment ?? '');
    } else {
      setSubmitRating(0);
      setSubmitComment('');
    }
  }, [myReview?.id, myReview?.rating, myReview?.comment]);

  const handleSubmitReview = useCallback(async () => {
    if (submitRating < 1 || submitRating > 5) {
      setSubmitError('Please choose a rating from 1 to 5.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitReview(psychologistId, submitRating, submitComment.trim() || null);
      await load();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  }, [psychologistId, submitRating, submitComment, load]);

  const hasFormChanged = myReview
    ? submitRating !== myReview.rating || submitComment !== (myReview.comment ?? '')
    : submitRating > 0 || submitComment.trim() !== '';

  if (loading && !data) {
    return (
      <ScreenLayout scroll={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.parentAccent} />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (error || !data) {
    return (
      <ScreenLayout>
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error ?? 'Profile not found'}</Text>
        </Card>
      </ScreenLayout>
    );
  }

  const rating = data.avg_rating ?? data.rating ?? null;
  const displayRating = formatRating(rating);
  const reviewCount = data.review_count ?? reviews.length;
  const contact = data.contact_info as Record<string, string> | undefined;
  const email = contact?.email ?? data.email;
  const phone = contact?.phone ?? data.phone;
  const languages = data.languages?.filter(Boolean).join(', ') || null;

  return (
    <ScreenLayout>
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>{data.name.charAt(0)}</Text>
        </View>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{data.name}</Text>
          {data.is_verified ? (
            <TouchableOpacity
              style={styles.verifiedBadge}
              onPress={() => setShowVerifiedExplainer(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.verifiedText}>✓ Verified</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {data.specialty ? (
          <Text style={styles.specialty}>{data.specialty}</Text>
        ) : null}
        {data.specialization?.length ? (
          <Text style={styles.specialization}>
            {data.specialization.join(' · ')}
          </Text>
        ) : null}
        <View style={styles.ratingRow}>
          <Text style={styles.ratingNum}>{displayRating}</Text>
          <Text style={styles.star}>★</Text>
          {reviewCount > 0 && (
            <Text style={styles.reviewCount}>{reviewCount} reviews</Text>
          )}
        </View>
        {data.location ? (
          <Text style={styles.location}>📍 {data.location}</Text>
        ) : null}
      </View>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Review summary</Text>
        <View style={styles.reviewSummaryRow}>
          <Text style={styles.reviewSummaryRating}>{displayRating}</Text>
          <Text style={styles.star}>★</Text>
          <Text style={styles.reviewSummaryText}>
            {reviewCount > 0
              ? `Based on ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`
              : 'No reviews yet'}
          </Text>
        </View>
      </Card>

      {data.bio ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{data.bio}</Text>
        </Card>
      ) : null}

      {languages ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <Text style={styles.languages}>{languages}</Text>
        </Card>
      ) : null}

      {data.clinics?.length ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Clinic affiliation</Text>
          {data.clinics.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.clinicRow}
              onPress={() => navigation.navigate('ClinicDetail', { clinicId: c.id })}
              activeOpacity={0.7}
            >
              <Text style={styles.clinicName}>{c.name}</Text>
              {c.role_label ? (
                <Text style={styles.clinicRole}>{c.role_label}</Text>
              ) : null}
              {c.is_primary ? (
                <Text style={styles.clinicPrimary}>Primary</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </Card>
      ) : null}

      {(email || phone) ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <ContactLink label="Email" value={email} href={email ? `mailto:${email}` : undefined} />
          <ContactLink label="Phone" value={phone} href={phone ? `tel:${phone}` : undefined} />
        </Card>
      ) : null}

      {user ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{myReview ? 'Your review' : 'Write a review'}</Text>
          <Text style={styles.ratingLabel}>Rating (1–5)</Text>
          <StarRating value={submitRating} onSelect={setSubmitRating} />
          <Input
            value={submitComment}
            onChangeText={setSubmitComment}
            placeholder="Share your experience (optional)"
            multiline
            numberOfLines={3}
            style={styles.commentInput}
          />
          {submitError ? (
            <Text style={styles.submitErrorText}>{submitError}</Text>
          ) : null}
          <Button
            title={myReview ? 'Update review' : 'Submit review'}
            onPress={handleSubmitReview}
            loading={submitting}
            disabled={!hasFormChanged}
            style={styles.submitButton}
          />
        </Card>
      ) : null}

      <Card style={styles.section}>
        <Button
          title="Report this professional"
          variant="ghost"
          onPress={() => setShowReportModal(true)}
          style={styles.reportButton}
        />
      </Card>

      <VerifiedExplainerModal
        visible={showVerifiedExplainer}
        onClose={() => setShowVerifiedExplainer(false)}
      />
      <ReportProfessionalModal
        visible={showReportModal}
        psychologistId={data.id}
        psychologistName={data.name}
        onClose={() => setShowReportModal(false)}
        onSuccess={() => Alert.alert('Thank you', 'Our team will review your report.')}
      />

      {reviews.length > 0 ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          {reviews.map((r) => (
            <View key={r.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>
                  {user && r.user_id === user.id ? 'You' : (r.user_name ?? 'Anonymous')}
                </Text>
                <View style={styles.reviewMeta}>
                  <Text style={styles.reviewStars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
                  <Text style={styles.reviewDate}>{formatDate(r.created_at)}</Text>
                </View>
              </View>
              {r.comment ? (
                <Text style={styles.reviewComment}>{r.comment}</Text>
              ) : null}
            </View>
          ))}
        </Card>
      ) : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.parentAccent + '28',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarLargeText: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.parentAccent,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  name: {
    ...typography.h2,
    textAlign: 'center',
  },
  verifiedBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  specialty: {
    ...typography.bodySmall,
    color: colors.parentAccent,
    marginTop: 4,
  },
  specialization: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  ratingNum: {
    ...typography.h3,
    fontSize: 18,
    color: colors.text,
  },
  star: {
    fontSize: 16,
    color: colors.warning,
  },
  reviewCount: {
    ...typography.subtitle,
  },
  location: {
    ...typography.subtitle,
    marginTop: 6,
  },
  reviewSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewSummaryRating: {
    ...typography.h3,
    fontSize: 20,
    color: colors.text,
  },
  reviewSummaryText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  clinicRow: {
    marginBottom: spacing.sm,
  },
  clinicName: {
    ...typography.body,
    fontWeight: '600',
  },
  clinicRole: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  clinicPrimary: {
    ...typography.bodySmall,
    color: colors.primary,
    marginTop: 2,
  },
  section: {
    marginBottom: layout.listItemGap,
  },
  sectionTitle: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  bio: {
    ...typography.bodySmall,
  },
  languages: {
    ...typography.bodySmall,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  contactLabel: {
    ...typography.subtitle,
    marginRight: spacing.sm,
  },
  contactValue: {
    ...typography.subtitle,
    color: colors.parentAccent,
    flex: 1,
    textAlign: 'right',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    ...typography.subtitle,
    marginTop: spacing.md,
  },
  errorCard: {
    marginTop: spacing.sm,
  },
  errorText: {
    ...typography.error,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  starTouch: {
    padding: 4,
  },
  starIcon: {
    color: colors.warning,
  },
  ratingLabel: {
    ...typography.subtitle,
    marginBottom: spacing.xs,
  },
  commentInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  reportButton: {
    alignSelf: 'flex-start',
  },
  submitErrorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  reviewItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  reviewerName: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reviewStars: {
    fontSize: 12,
    color: colors.warning,
  },
  reviewDate: {
    ...typography.caption,
  },
  reviewComment: {
    ...typography.subtitle,
    marginTop: spacing.xs,
    color: colors.text,
  },
});
