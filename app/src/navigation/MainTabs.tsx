import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../hooks/useAppTheme';
import { HistoryScreen } from '../screens/history/HistoryScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const TAB_ICONS: Record<keyof MainTabParamList, { active: IconName; inactive: IconName }> = {
  Home: { active: 'water', inactive: 'water-outline' },
  History: { active: 'clipboard-text-clock', inactive: 'clipboard-text-clock-outline' },
  Settings: { active: 'cog', inactive: 'cog-outline' },
};

export function MainTabs() {
  const { colors } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: ({ focused, color, size }) => (
          <MaterialCommunityIcons
            name={focused ? TAB_ICONS[route.name].active : TAB_ICONS[route.name].inactive}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Histórico' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ajustes' }} />
    </Tab.Navigator>
  );
}
