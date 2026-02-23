import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

/** Params for Register/Login when used in onboarding (navigate to AddChild on success). */
export type AuthOnSuccessParams = {
  onSuccessNavigateTo?: 'AddChild';
};

export type ParentTabParamList = {
  Dashboard: undefined;
  AdviceFeed: undefined;
  ContentLibrary: undefined;
  PsychologistDirectory: undefined;
  ChildProgress: undefined;
};

export type ParentStackParamList = {
  Main: NavigatorScreenParams<ParentTabParamList>;
  AddChild: undefined;
  PsychologistDetail: { psychologistId: string };
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
  AddChild: undefined;
  ParentChildExplain: undefined;
};

export type RootStackParamList = {
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Auth: NavigatorScreenParams<AuthStackParamList>;
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
  }
}
