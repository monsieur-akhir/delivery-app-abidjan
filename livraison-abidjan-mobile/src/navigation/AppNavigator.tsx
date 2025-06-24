import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
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
import ClientHomeScreen from '../screens/client/HomeScreen';
import CourierHomeScreen from '../screens/courier/HomeScreen';
import CreateDeliveryScreen from '../screens/client/CreateDeliveryScreen';
import TrackDeliveryScreen from '../screens/client/TrackDeliveryScreen';
import DeliveryHistoryScreen from '../screens/client/DeliveryHistoryScreen';
import DeliveryDetailsScreen from '../screens/client/DeliveryDetailsScreen';
import NotificationsScreen from '../screens/client/NotificationsScreen';
import WalletScreen from '../screens/client/WalletScreen';
import PaymentScreen from '../screens/client/PaymentScreen';
import PaymentMethodsScreen from '../screens/client/PaymentMethodsScreen';
import BidScreen from '../screens/client/BidScreen';
import MultiDestinationDeliveriesScreen from '../screens/client/MultiDestinationDeliveriesScreen';
import CreateMultiDestinationDeliveryScreen from '../screens/client/CreateMultiDestinationDeliveryScreen';
import MultiDestinationDeliveryDetailsScreen from '../screens/client/MultiDestinationDeliveryDetailsScreen';
import ScheduledDeliveriesScreen from '../screens/client/ScheduledDeliveriesScreen';
import CreateScheduledDeliveryScreen from '../screens/client/CreateScheduledDeliveryScreen';

// Courier Screens
import CourierDashboardScreen from '../screens/courier/CourierDashboardScreen';
import AvailableDeliveriesScreen from '../screens/courier/AvailableDeliveriesScreen';
import CourierTrackDeliveryScreen from '../screens/courier/CourierTrackDeliveryScreen';
import CourierEarningsScreen from '../screens/courier/CourierEarningsScreen';
import CollaborativeDeliveriesScreen from '../screens/courier/CollaborativeDeliveriesScreen';
import GamificationScreen from '../screens/courier/GamificationScreen';
import CommunityWalletScreen from '../screens/courier/CommunityWalletScreen';
import ExpressDeliveriesScreen from '../screens/courier/ExpressDeliveriesScreen';
import CourierMultiDestinationScreen from '../screens/courier/CourierMultiDestinationScreen';

// Profile Screens
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Other Screens
import OnboardingScreen from '../screens/OnboardingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Composant temporaire pour tester
const TestHomeScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Test Home Screen</Text>
  </View>
);

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
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={ClientHomeScreen} />
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
            case 'Dashboard':
              iconName = 'grid';
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
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={CourierDashboardScreen} />
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

  // Gestion d'erreur pour éviter les problèmes de navigation
  const handleNavigationError = (error: any) => {
    console.warn('Erreur de navigation:', error);
  };

  return (
    <Stack.Navigator
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
          <Stack.Screen name="DeliveryDetails" component={DeliveryDetailsScreen} />
          <Stack.Screen name="Payment">
            {props => <PaymentScreen {...props} />}
          </Stack.Screen>
          <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
          <Stack.Screen name="BidScreen" component={BidScreen} />
          <Stack.Screen name="MultiDestinationDeliveries" component={MultiDestinationDeliveriesScreen} />
          <Stack.Screen name="CreateMultiDestinationDelivery" component={CreateMultiDestinationDeliveryScreen} />
          <Stack.Screen name="MultiDestinationDeliveryDetails" component={MultiDestinationDeliveryDetailsScreen} />
          <Stack.Screen name="ScheduledDeliveries" component={ScheduledDeliveriesScreen} />
          <Stack.Screen name="CreateScheduledDelivery" component={CreateScheduledDeliveryScreen} />

          {/* Courier Specific Screens */}
          <Stack.Screen name="CourierTrackDelivery" component={CourierTrackDeliveryScreen} />
          <Stack.Screen name="Gamification" component={GamificationScreen} />
          <Stack.Screen name="CommunityWallet" component={CommunityWalletScreen} />
          <Stack.Screen name="ExpressDeliveries" component={ExpressDeliveriesScreen} />
          {/* <Stack.Screen name="MultiDestinationDeliveries" component={CourierMultiDestinationScreen} /> */}
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}