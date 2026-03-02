import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  /** Public form for clinics to apply (no auth). */
  ClinicApplicationForm: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  ProfessionalDisclaimer: undefined;
};

/** Params for Register/Login when used in onboarding (navigate to AddChild on success). */
export type AuthOnSuccessParams = {
  onSuccessNavigateTo?: 'AddChild';
};

export type ParentTabParamList = {
  Dashboard: undefined;
  AdviceFeed: undefined;
  ContentLibrary: undefined;
  Search: undefined;
  PsychologistDirectory: undefined;
  Clinics: undefined;
  ChildProgress: undefined;
};

export type ParentStackParamList = {
  Main: NavigatorScreenParams<ParentTabParamList>;
  AddChild: undefined;
  PsychologistDetail: { psychologistId: string };
  ClinicDetail: { clinicId: string };
  TrustAndSafety: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  ProfessionalDisclaimer: undefined;
  ParentResources: undefined;
  ContentDetail: { contentId: string };
  KidsActivities: undefined;
};

export type ChildTabParamList = {
  ActivityHub: undefined;
  Activity: { activityId?: string };
  Reward: undefined;
  CalmTools: undefined;
};

export type ChildStackParamList = {
  Main: undefined;
  CompletionReward: { starsEarned: number };
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  Register: AuthOnSuccessParams | undefined;
  Login: AuthOnSuccessParams | undefined;
  ClinicApplicationForm: undefined;
  SetPassword: { token: string };
  DisclaimerConsent: { next: 'AddChild' } | undefined;
  AddChild: undefined;
  ParentChildExplain: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  ProfessionalDisclaimer: undefined;
};

/** Therapist onboarding: linear steps after register (or when therapist has no application). */
export type TherapistOnboardingStackParamList = {
  TherapistRegister: { fromAuth?: boolean } | undefined;
  TherapistProfessional: undefined;
  TherapistCredentials: undefined;
  TherapistLicense: undefined;
  TherapistSpecialties: undefined;
  TherapistClinic: undefined;
  TherapistSubmit: undefined;
  TherapistSuccess: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  ProfessionalDisclaimer: undefined;
};

/** Admin: dashboard, therapist applications, reports (trust & safety), clinics, clinic applications, content. */
export type AdminStackParamList = {
  AdminMain: undefined;
  TherapistApplications: undefined;
  TherapistApplicationDetail: { applicationId: string };
  AdminReports: undefined;
  AdminReportDetail: { reportId: string };
  AdminClinics: undefined;
  AdminClinicForm: undefined;
  AdminClinicApplications: undefined;
  AdminClinicApplicationDetail: { applicationId: string };
  AdminContent: undefined;
  AdminContentDetail: { contentId: string };
};

/** Therapist: dashboard (application status), legal. */
export type TherapistStackParamList = {
  TherapistDashboard: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  ProfessionalDisclaimer: undefined;
};

/** Clinic admin: list clinics, detail, edit profile, therapists, legal. */
export type ClinicStackParamList = {
  ClinicDashboard: undefined;
  ClinicDetail: { clinicId: string };
  ClinicEdit: { clinicId: string };
  ClinicTherapists: { clinicId: string };
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  ProfessionalDisclaimer: undefined;
};

export type RootStackParamList = {
  Onboarding: NavigatorScreenParams<OnboardingStackParamList> & {
    initialRouteName?: keyof OnboardingStackParamList;
    token?: string;
  };
  Auth: NavigatorScreenParams<AuthStackParamList>;
  TherapistOnboarding: NavigatorScreenParams<TherapistOnboardingStackParamList> & { initialScreen?: keyof TherapistOnboardingStackParamList };
  RoleSelect: undefined;
  App: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
    interface OnboardingParamList extends OnboardingStackParamList {}
    interface AuthParamList extends AuthStackParamList {}
    interface ParentParamList extends ParentTabParamList {}
    interface ChildParamList extends ChildStackParamList {}
    interface TherapistOnboardingParamList extends TherapistOnboardingStackParamList {}
    interface AdminParamList extends AdminStackParamList {}
    interface TherapistParamList extends TherapistStackParamList {}
    interface ClinicParamList extends ClinicStackParamList {}
  }
}
