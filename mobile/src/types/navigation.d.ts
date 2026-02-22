import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
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
};

export type ChildTabParamList = {
  ActivityHub: undefined;
  Activity: { activityId?: string };
  Reward: undefined;
  CalmTools: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  RoleSelect: undefined;
  App: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
    interface AuthParamList extends AuthStackParamList {}
    interface ParentParamList extends ParentTabParamList {}
    interface ChildParamList extends ChildTabParamList {}
  }
}
