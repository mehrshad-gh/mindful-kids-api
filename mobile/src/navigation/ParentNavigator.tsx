import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/parent/DashboardScreen';
import { AdviceFeedScreen } from '../screens/parent/AdviceFeedScreen';
import { ContentLibraryScreen } from '../screens/parent/ContentLibraryScreen';
import { SearchScreen } from '../screens/parent/SearchScreen';
import { PsychologistDirectoryScreen } from '../screens/parent/PsychologistDirectoryScreen';
import { ClinicDirectoryScreen } from '../screens/parent/ClinicDirectoryScreen';
import { ChildProgressScreen } from '../screens/parent/ChildProgressScreen';
import { AddChildScreen } from '../screens/parent/AddChildScreen';
import { PsychologistDetailScreen } from '../screens/parent/PsychologistDetailScreen';
import { ClinicDetailScreen } from '../screens/parent/ClinicDetailScreen';
import { TrustAndSafetyScreen } from '../screens/parent/TrustAndSafetyScreen';
import { AboutScreen } from '../screens/parent/AboutScreen';
import { ParentResourcesScreen } from '../screens/parent/ParentResourcesScreen';
import { ContentDetailScreen } from '../screens/parent/ContentDetailScreen';
import { KidsActivitiesScreen } from '../screens/parent/KidsActivitiesScreen';
import { BookingScreen } from '../screens/parent/BookingScreen';
import { MyAppointmentsScreen } from '../screens/parent/MyAppointmentsScreen';
import { ChildSettingsScreen } from '../screens/parent/ChildSettingsScreen';
import { TermsOfServiceScreen } from '../screens/legal/TermsOfServiceScreen';
import { PrivacyPolicyScreen } from '../screens/legal/PrivacyPolicyScreen';
import { ProfessionalDisclaimerScreen } from '../screens/legal/ProfessionalDisclaimerScreen';
import type { ParentStackParamList, ParentTabParamList } from '../types/navigation';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator<ParentTabParamList>();
const Stack = createNativeStackNavigator<ParentStackParamList>();

const TAB_BAR_HEIGHT = 64;
const TAB_BAR_MARGIN_H = 16;
const TAB_BAR_MARGIN_BOTTOM = 12;
const TAB_BAR_RADIUS = 28;

function ParentTabs() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, TAB_BAR_MARGIN_BOTTOM);
  const floatingTabBarStyle = {
    position: 'absolute' as const,
    left: TAB_BAR_MARGIN_H,
    right: TAB_BAR_MARGIN_H,
    bottom: bottomInset,
    height: TAB_BAR_HEIGHT,
    backgroundColor: colors.surface,
    borderRadius: TAB_BAR_RADIUS,
    borderTopWidth: 0,
    paddingTop: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 12,
  };
  const sceneContainerStyle = {
    paddingBottom: TAB_BAR_HEIGHT + bottomInset + 16,
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: floatingTabBarStyle,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIconStyle: { marginBottom: -2 },
        tabBarShowLabel: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        headerTitleStyle: { fontSize: 18, fontWeight: '700' },
      }}
      sceneContainerStyle={sceneContainerStyle}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size ?? 24} color={color} />,
        }}
      />
      <Tab.Screen
        name="AdviceFeed"
        component={AdviceFeedScreen}
        options={{
          tabBarLabel: 'Advice',
          tabBarIcon: ({ color, size }) => <Ionicons name="bulb-outline" size={size ?? 24} color={color} />,
        }}
      />
      <Tab.Screen
        name="ContentLibrary"
        component={ContentLibraryScreen}
        options={{
          tabBarLabel: 'Library',
          tabBarIcon: ({ color, size }) => <Ionicons name="library-outline" size={size ?? 24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size ?? 24} color={color} />,
        }}
      />
      <Tab.Screen
        name="PsychologistDirectory"
        component={PsychologistDirectoryScreen}
        options={{
          tabBarLabel: 'Experts',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size ?? 24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Clinics"
        component={ClinicDirectoryScreen}
        options={{
          tabBarLabel: 'Clinics',
          tabBarIcon: ({ color, size }) => <Ionicons name="business-outline" size={size ?? 24} color={color} />,
        }}
      />
      <Tab.Screen
        name="ChildProgress"
        component={ChildProgressScreen}
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: ({ color, size }) => <Ionicons name="trending-up" size={size ?? 24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function ParentNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}>
      <Stack.Screen name="Main" component={ParentTabs} options={{ headerShown: false }} />
      <Stack.Screen name="AddChild" component={AddChildScreen} options={{ title: 'Add child' }} />
      <Stack.Screen name="PsychologistDetail" component={PsychologistDetailScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="ClinicDetail" component={ClinicDetailScreen} options={{ title: 'Clinic' }} />
      <Stack.Screen name="TrustAndSafety" component={TrustAndSafetyScreen} options={{ title: 'Trust & safety' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: 'About' }} />
      <Stack.Screen name="ParentResources" component={ParentResourcesScreen} options={{ title: 'Parent resources' }} />
      <Stack.Screen name="ContentDetail" component={ContentDetailScreen} options={{ title: 'Detail' }} />
      <Stack.Screen name="KidsActivities" component={KidsActivitiesScreen} options={{ title: 'Kids activities' }} />
      <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Book session' }} />
      <Stack.Screen name="MyAppointments" component={MyAppointmentsScreen} options={{ title: 'My appointments' }} />
      <Stack.Screen name="ChildSettings" component={ChildSettingsScreen} options={{ title: 'Child settings' }} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} options={{ title: 'Terms of Service' }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
      <Stack.Screen name="ProfessionalDisclaimer" component={ProfessionalDisclaimerScreen} options={{ title: 'Professional Disclaimer' }} />
    </Stack.Navigator>
  );
}
