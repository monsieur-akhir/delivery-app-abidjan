import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../hooks/useAuth';
import { FeatherIcon } from '../components';
import { RootStackParamList, TabParamList } from '../types/navigation';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import VerifyOTPScreen from '../screens/auth/VerifyOTPScreen';
import OTPLoginScreen from '../screens/auth/OTPLoginScreen';

// Client Screens
import HomeScreen from '../screens/client/HomeScreen';
import CreateDeliveryScreen from '../screens/client/CreateDeliveryScreen';
import TrackDeliveryScreen from '../screens/client/TrackDeliveryScreen';
import DeliveryHistoryScreen from '../screens/client/DeliveryHistoryScreen';
import NotificationsScreen from '../screens/client/NotificationsScreen';
import WalletScreen from '../screens/client/WalletScreen';
import PaymentScreen from '../screens/client/PaymentScreen';
import PaymentMethodsScreen from '../screens/client/PaymentMethodsScreen';

// Courier Screens
import CourierDashboardScreen from '../screens/courier/CourierDashboardScreen';
import AvailableDeliveriesScreen from '../screens/courier/AvailableDeliveriesScreen';
import BidScreen from '../screens/courier/BidScreen';
import CourierTrackDeliveryScreen from '../screens/courier/CourierTrackDeliveryScreen';
import CourierEarningsScreen from '../screens/courier/CourierEarningsScreen';
import CollaborativeDeliveriesScreen from '../screens/courier/CollaborativeDeliveriesScreen';
import GamificationScreen from '../screens/courier/GamificationScreen';
import CommunityWalletScreen from '../screens/courier/CommunityWalletScreen';
import CourierHomeScreen from '../screens/courier/HomeScreen';

// Profile Screens
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Other Screens
import OnboardingScreen from '../screens/OnboardingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Orders':
              iconName = 'package';
              break;
            case 'Wallet':
              iconName = 'credit-card';
              break;
            case 'Notifications':
              iconName = 'bell';
              break;
            case 'Profile':
              iconName = 'user';
              break;
            default:
              iconName = 'circle';
          }

          return <FeatherIcon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B00',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Orders" component={DeliveryHistoryScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function CourierTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Deliveries':
              iconName = 'truck';
              break;
            case 'Earnings':
              iconName = 'dollar-sign';
              break;
            case 'Collaborative':
              iconName = 'users';
              break;
            case 'Profile':
              iconName = 'user';
              break;
            default:
              iconName = 'circle';
          }

          return <FeatherIcon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B00',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={CourierHomeScreen} />
      <Tab.Screen name="Deliveries" component={AvailableDeliveriesScreen} />
      <Tab.Screen name="Earnings" component={CourierEarningsScreen} />
      <Tab.Screen name="Collaborative" component={CollaborativeDeliveriesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        {!user ? (
          // Auth Stack
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
            <Stack.Screen name="OTPLogin" component={OTPLoginScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          </Stack.Group>
        ) : (
          // Main App Stack
          <Stack.Group>
            {user.role === 'courier' ? (
              <Stack.Screen name="CourierMain" component={CourierTabs} />
            ) : (
              <Stack.Screen name="ClientMain" component={ClientTabs} />
            )}

            {/* Shared Screens */}
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="CreateDelivery" component={CreateDeliveryScreen} />
            <Stack.Screen name="TrackDelivery" component={TrackDeliveryScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />

            {/* Courier Specific Screens */}
            <Stack.Screen name="BidScreen" component={BidScreen} />
            <Stack.Screen name="CourierTrackDelivery" component={CourierTrackDeliveryScreen} />
            <Stack.Screen name="Gamification" component={GamificationScreen} />
            <Stack.Screen name="CommunityWallet" component={CommunityWalletScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}