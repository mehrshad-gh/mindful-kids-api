export type ApplicationStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface TherapistCredential {
  type: string;
  issuer?: string;
  number?: string;
  document_url?: string;
  verified?: boolean;
}

export interface TherapistApplication {
  id: string;
  user_id: string;
  professional_name: string;
  email: string;
  phone?: string;
  specialty?: string;
  specialization: string[];
  bio?: string;
  location?: string;
  languages: string[];
  profile_image_url?: string;
  video_urls: string[];
  contact_info: Record<string, unknown>;
  credentials: TherapistCredential[];
  status: ApplicationStatus;
  submitted_at?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  psychologist_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ClinicAffiliation {
  clinic_id: string;
  role_label?: string;
  is_primary?: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  location?: string;
  address?: string;
  country?: string;
  website?: string;
  logo_url?: string;
  is_active: boolean;
  verification_status?: 'pending' | 'verified' | 'rejected' | 'suspended';
}

/** Therapist on a clinic public page (summary for listing). */
export interface ClinicTherapist {
  id: string;
  name: string;
  specialty?: string | null;
  specialization?: string[] | null;
  bio?: string | null;
  location?: string | null;
  profile_image?: string | null;
  is_verified?: boolean;
  role_label?: string | null;
  is_primary?: boolean;
  avg_rating?: number;
  review_count?: number;
}
