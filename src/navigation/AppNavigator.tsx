import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { useAuthStore } from '../store';
import { COLORS } from '../constants';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';

// Profile Setup Screens
import BasicInfoScreen from '../screens/profile/BasicInfoScreen';
import PhotosScreen from '../screens/profile/PhotosScreen';
import DealBreakersScreen from '../screens/profile/DealBreakersScreen';
import BioScreen from '../screens/profile/BioScreen';

// Main Tab Screens
import DiscoverScreen from '../screens/matching/DiscoverScreen';
import MatchesScreen from '../screens/messaging/MatchesScreen';
import MessagesScreen from '../screens/messaging/MessagesScreen';
import ProfileScreen from '../screens/settings/ProfileScreen';

// Other Screens
import ChatScreen from '../screens/messaging/ChatScreen';
import ProfileDetailScreen from '../screens/matching/ProfileDetailScreen';
import DateSuggestionScreen from '../screens/venues/DateSuggestionScreen';
import VenueSelectionScreen from '../screens/venues/VenueSelectionScreen';
import EditProfileScreen from '../screens/settings/EditProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

import type {
  RootStackParamList,
  AuthStackParamList,
  ProfileSetupStackParamList,
  MainTabParamList,
} from '../types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const ProfileSetupStack = createNativeStackNavigator<ProfileSetupStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const MainStack = createNativeStackNavigator();

// Auth Navigator
const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
    <AuthStack.Screen name="SignIn" component={SignInScreen} />
    <AuthStack.Screen name="SignUp" component={SignUpScreen} />
  </AuthStack.Navigator>
);

// Profile Setup Navigator
const ProfileSetupNavigator = () => (
  <ProfileSetupStack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <ProfileSetupStack.Screen name="BasicInfo" component={BasicInfoScreen} />
    <ProfileSetupStack.Screen name="Photos" component={PhotosScreen} />
    <ProfileSetupStack.Screen name="DealBreakers" component={DealBreakersScreen} />
    <ProfileSetupStack.Screen name="Bio" component={BioScreen} />
  </ProfileSetupStack.Navigator>
);

// Tab Navigator
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textSecondary,
      tabBarShowLabel: true,
      tabBarLabelStyle: styles.tabBarLabel,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        switch (route.name) {
          case 'Discover':
            iconName = focused ? 'compass' : 'compass-outline';
            break;
          case 'Matches':
            iconName = focused ? 'heart' : 'heart-outline';
            break;
          case 'Messages':
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            break;
          case 'Profile':
            iconName = focused ? 'person' : 'person-outline';
            break;
          default:
            iconName = 'help-outline';
        }

        return <Ionicons name={iconName} size={24} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Discover" component={DiscoverScreen} />
    <Tab.Screen name="Matches" component={MatchesScreen} />
    <Tab.Screen name="Messages" component={MessagesScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// Main Navigator (Tab + Modal screens)
const MainNavigator = () => (
  <MainStack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <MainStack.Screen name="Tabs" component={TabNavigator} />
    <MainStack.Screen
      name="Chat"
      component={ChatScreen}
      options={{
        animation: 'slide_from_right',
      }}
    />
    <MainStack.Screen
      name="ProfileDetail"
      component={ProfileDetailScreen}
      options={{
        animation: 'slide_from_bottom',
        presentation: 'modal',
      }}
    />
    <MainStack.Screen
      name="DateSuggestion"
      component={DateSuggestionScreen}
      options={{
        animation: 'slide_from_bottom',
        presentation: 'modal',
      }}
    />
    <MainStack.Screen
      name="VenueSelection"
      component={VenueSelectionScreen}
      options={{
        animation: 'slide_from_right',
      }}
    />
    <MainStack.Screen
      name="EditProfile"
      component={EditProfileScreen}
      options={{
        animation: 'slide_from_right',
      }}
    />
    <MainStack.Screen
      name="Settings"
      component={SettingsScreen}
      options={{
        animation: 'slide_from_right',
      }}
    />
  </MainStack.Navigator>
);

// Loading Screen
const LoadingScreen = () => (
  <View style={styles.loading}>
    <ActivityIndicator size="large" color={COLORS.primary} />
  </View>
);

// Root Navigator
export const AppNavigator = () => {
  const { isLoading, isAuthenticated, isProfileComplete, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : !isProfileComplete ? (
          <RootStack.Screen name="ProfileSetup" component={ProfileSetupNavigator} />
        ) : (
          <RootStack.Screen name="Main" component={MainNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    height: 80,
    paddingBottom: 20,
    paddingTop: 10,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AppNavigator;
