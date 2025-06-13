import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabNavigationProp, BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

// Root Stack Parameter List
export type RootStackParamList = {
  // Auth Screens
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyOTP: { phoneNumber: string; isRegistration?: boolean };
  OTPLogin: undefined;
  Onboarding: undefined;

  // Main Tab Navigators
  ClientMain: undefined;
  CourierMain: undefined;

  // Shared Screens
  Settings: undefined;
  CreateDelivery: undefined;
  TrackDelivery: { deliveryId: string };
  Payment: { deliveryId: string; amount: number };
  PaymentMethods: undefined;

  // Courier Specific Screens
  BidScreen: { deliveryId: string };
  CourierTrackDelivery: { deliveryId: string };
  Gamification: undefined;
  CommunityWallet: undefined;
};

// Tab Parameter Lists
export type TabParamList = {
  Home: undefined;
  Orders: undefined;
  Wallet: undefined;
  Notifications: undefined;
  Profile: undefined;
  Dashboard: undefined;
  Deliveries: undefined;
  Earnings: undefined;
  Collaborative: undefined;
};

// Navigation Props
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type TabNavigationProp = BottomTabNavigationProp<TabParamList>;

// Screen Props
export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;
export type VerifyOTPScreenProps = NativeStackScreenProps<RootStackParamList, 'VerifyOTP'>;
export type TrackDeliveryScreenProps = NativeStackScreenProps<RootStackParamList, 'TrackDelivery'>;
export type BidScreenProps = NativeStackScreenProps<RootStackParamList, 'BidScreen'>;
export type PaymentScreenProps = NativeStackScreenProps<RootStackParamList, 'Payment'>;

// Tab Screen Props
export type HomeTabProps = BottomTabScreenProps<TabParamList, 'Home'>;
export type ProfileTabProps = BottomTabScreenProps<TabParamList, 'Profile'>;

// Route Props
export type VerifyOTPRouteProp = RouteProp<RootStackParamList, 'VerifyOTP'>;
export type TrackDeliveryRouteProp = RouteProp<RootStackParamList, 'TrackDelivery'>;
export type BidScreenRouteProp = RouteProp<RootStackParamList, 'BidScreen'>;
export type PaymentRouteProp = RouteProp<RootStackParamList, 'Payment'>;

// Generic navigation prop for components that need navigation
export type NavigationProp = RootStackNavigationProp;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}