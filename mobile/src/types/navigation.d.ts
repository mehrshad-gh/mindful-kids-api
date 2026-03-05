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
  About: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  ProfessionalDisclaimer: undefined;
  ParentResources: undefined;
  ContentDetail: { contentId: string };
  KidsActivities: undefined;
  Booking: { psychologistId: string };
  MyAppointments: undefined;
  ChildSettings: { childId: string };
};

export type ChildTabParamList = {
  Home: undefined;
  ActivityHub: undefined;
  Activity: { activityId?: string };
  Reward: undefined;
  CalmTools: undefined;
};

export type ChildStackParamList = {
  Main: undefined;
  DomainDetail: { domainId: string };
  CompletionReward: { starsEarned: number; domainTitle?: string; childName?: string };
};

export type OnboardingStackParamList = {
  AuthLanding: undefined;
  FamilyAuth: AuthOnSuccessParams | undefined;
  ProfessionalAccess: undefined;
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
  AdminUsers: undefined;
  TherapistApplications: undefined;
  TherapistApplicationDetail: { applicationId: string };
  AdminReports: undefined;
  AdminReportDetail: { reportId: string };
  AdminClinics: undefined;
  AdminClinicDetail: { clinicId: string };
  AdminPsychologistDetail: { psychologistId: string };
  AdminClinicForm: undefined;
  AdminClinicApplications: undefined;
  AdminClinicApplicationDetail: { applicationId: string };
  AdminContent: undefined;
  AdminContentDetail: { contentId: string };
};

/** Therapist: dashboard (application status), availability, appointments, legal. */
export type TherapistStackParamList = {
  TherapistDashboard: undefined;
  TherapistAvailability: undefined;
  TherapistAppointmentRequests: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  ProfessionalDisclaimer: undefined;
};

/** Clinic admin: list clinics, detail, edit profile, therapists, therapist availability, legal. */
export type ClinicStackParamList = {
  ClinicDashboard: undefined;
  ClinicDetail: { clinicId: string };
  ClinicEdit: { clinicId: string };
  ClinicTherapists: { clinicId: string };
  ClinicAvailabilityClinics: undefined;
  ClinicTherapistAvailability: { psychologistId: string; psychologistName?: string };
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  ProfessionalDisclaimer: undefined;
};

/** Parent onboarding: Welcome -> AddChild -> FirstPractice (then Child mode for activity). */
export type ParentOnboardingStackParamList = {
  ParentOnboardingWelcome: undefined;
  ParentOnboardingAddChild: undefined;
  ParentOnboardingFirstPractice: undefined;
};

export type RootStackParamList = {
  Onboarding: NavigatorScreenParams<OnboardingStackParamList> & {
    initialRouteName?: keyof OnboardingStackParamList;
    token?: string;
  };
  ParentOnboarding: NavigatorScreenParams<ParentOnboardingStackParamList>;
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
    interface ParentOnboardingParamList extends ParentOnboardingStackParamList {}
  }
}
