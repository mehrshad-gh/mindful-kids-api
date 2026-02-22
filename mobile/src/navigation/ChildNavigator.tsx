import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityHubScreen } from '../screens/child/ActivityHubScreen';
import { ActivityScreen } from '../screens/child/ActivityScreen';
import { RewardScreen } from '../screens/child/RewardScreen';
import { CalmToolsScreen } from '../screens/child/CalmToolsScreen';
import type { ChildTabParamList } from '../types/navigation';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator<ChildTabParamList>();

function ChildTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.childAccent,
        tabBarInactiveTintColor: colors.textSecondary,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Tab.Screen name="ActivityHub" component={ActivityHubScreen} options={{ tabBarLabel: 'Activities' }} />
      <Tab.Screen name="Activity" component={ActivityScreen} options={{ tabBarLabel: 'Do Activity' }} />
      <Tab.Screen name="Reward" component={RewardScreen} options={{ tabBarLabel: 'Rewards' }} />
      <Tab.Screen name="CalmTools" component={CalmToolsScreen} options={{ tabBarLabel: 'Calm' }} />
    </Tab.Navigator>
  );
}

export function ChildNavigator() {
  return <ChildTabs />;
}
