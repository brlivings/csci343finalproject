// React Navigation: a root native stack wrapping bottom tabs.
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../constants/theme';
import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import CompoundDetailScreen from '../screens/CompoundDetailScreen';
import MyStackScreen from '../screens/MyStackScreen';
import JournalScreen from '../screens/JournalScreen';
import QuizzesScreen from '../screens/QuizzesScreen';
import QuizPlayScreen from '../screens/QuizPlayScreen';
import QuizResultScreen from '../screens/QuizResultScreen';
import GymScreen from '../screens/GymScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = {
  Home: 'home-variant',
  Library: 'file-tree',
  Quizzes: 'school',
  Gym: 'office-building',
  MyStack: 'layers-triple',
};

function Tabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontFamily: FONTS.medium, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          minHeight: 56 + insets.bottom,
        },
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name={TAB_ICONS[route.name]} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Quizzes" component={QuizzesScreen} />
      <Tab.Screen name="Gym" component={GymScreen} options={{ title: 'My Gym' }} />
      <Tab.Screen name="MyStack" component={MyStackScreen} options={{ title: 'My Stack' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primaryDark },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontFamily: FONTS.semiBold },
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="CompoundDetail" component={CompoundDetailScreen} options={{ title: 'Compound' }} />
      <Stack.Screen name="QuizPlay" component={QuizPlayScreen} options={{ title: 'Quiz' }} />
      <Stack.Screen name="QuizResult" component={QuizResultScreen} options={{ title: 'Results', headerBackVisible: false }} />
      <Stack.Screen name="Journal" component={JournalScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
