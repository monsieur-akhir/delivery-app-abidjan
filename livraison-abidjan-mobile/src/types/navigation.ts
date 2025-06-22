import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabNavigationProp, BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

// Root Stack Parameter List
export type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;
export type CourierStatsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CourierStats'>;

export type RootStackParamList = {
  // Auth Stack
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyOTP: { phoneNumber: string; phone?: string; isRegistration?: boolean };
  OTPLogin: undefined;
  Onboarding: undefined;
  ClassicLogin: undefined;

  // Main Stacks
  ClientMain: undefined;
  CourierMain: undefined;

  // Shared Screens
  Settings: undefined;
  CreateDelivery: { 
    serviceType?: string; 
    searchQuery?: string;
    isModification?: boolean;
    deliveryData?: {
      id: number;
      pickup_address: string;
      delivery_address: string;
      pickup_commune: string;
      delivery_commune: string;
      pickup_lat: number;
      pickup_lng: number;
      delivery_lat: number;
      delivery_lng: number;
      package_description: string;
      package_size: string;
      package_weight: number;
      is_fragile: boolean;
      proposed_price: number;
      delivery_type: string;
      proposed_price: number;
    };
  } | undefined;
  TrackDelivery: { deliveryId: string | number };
  Payment: { deliveryId?: string; amount?: number } | undefined;
  PaymentMethods: undefined;
  Notifications: undefined;
  DeliveryDetails: { deliveryId: string | number };

  // Client Screens
  Home: undefined;
  Wallet: undefined;
  DeliveryHistory: undefined;
  Profile: undefined;
  Support: undefined;
  TransactionHistory: undefined;
  AddFunds: undefined;
  Marketplace: undefined;
  MerchantDetails: { merchantId: string };
  RateDelivery: { deliveryId: string };
  EnhancedRateDelivery: { deliveryId: string };
  ComplaintsScreen: undefined;
  KYCVerification: undefined;
  PrivacySettings: undefined;
  Cart: { merchantId: string };
  WebPayment: { paymentUrl: string; transactionId: string; onComplete: (success: boolean) => void };

  // Courier Screens
  CourierHome: undefined;
  CourierEarnings: undefined;
  CourierStats: undefined;
  CourierStatus: undefined;
  CollaborativeDeliveries: undefined;
  AvailableDeliveries: undefined;
  BidScreen: { deliveryId: string };
  CourierTrackDelivery: { deliveryId: string | number };
  Gamification: undefined;
  CommunityWallet: undefined;
  GamificationScreen: undefined;
  CollaborativeDeliveryDetails: { deliveryId: string; clientName: string; finalPrice: number };
  JoinCollaborativeDelivery: { deliveryId: string };
  CollaborativeChat: { deliveryId: string };
  VehicleManagement: undefined;
  AddVehicle: { vehicleId?: number };
  CourierProfile: undefined;

  // Settings Screens
  NotificationSettings: undefined;
  SecuritySettings: undefined;
  LanguageSettings: undefined;
  ChangePassword: undefined;
  SecurityQuestions: undefined;
  StorageManagementScreen: undefined;
  AutoSyncSettingsScreen: undefined;
  DataUsageSettingsScreen: undefined;
  WeatherScreen: { location?: string };

  // Other screens
  Bids: { deliveryId: string };
  Bid: { deliveryId: string };
  ClientHome: undefined;
  Main: undefined;
  OfflineManagerScreen: undefined;

  // Livraisons planifiées
  ScheduledDeliveries: undefined
  CreateScheduledDelivery: undefined
  EditScheduledDelivery: { deliveryId: number }

  // Livraisons multiples destinations
  MultiDestinationDeliveries: undefined
  CreateMultiDestinationDelivery: undefined
  MultiDestinationDeliveryDetails: { deliveryId: number }

  // Courier routes
  CourierDashboard: undefined;
  AvailableDeliveries: undefined;
  CourierTrackDelivery: { deliveryId: string };
  CourierEarnings: undefined;
  CollaborativeDeliveries: undefined;
  CourierScheduledDeliveries: undefined;
  CourierMultiDestination: undefined;
  ExpressDeliveries: undefined;
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