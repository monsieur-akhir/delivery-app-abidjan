import type { NavigatorScreenParams } from '@react-navigation/native'

export type RootStackParamList = {
  Login: undefined
  Register: undefined
  ClientTabs: NavigatorScreenParams<TabParamList>
  CourierTabs: NavigatorScreenParams<CourierTabParamList>
  ForgotPassword: undefined;
  VerifyOTP: { phoneNumber: string; phone?: string; isRegistration?: boolean };
  AddVehicleScreen: { vehicleId?: number };
  OTPLogin: undefined;
  Onboarding: undefined;
  ClassicLogin: undefined;

  // Main Stacks
  ClientMain: undefined;
  CourierMain: undefined;

  // Shared Screens
  Settings: undefined;
  CreateDelivery: { serviceType?: string; searchQuery?: string } | undefined;
  TrackDelivery: { deliveryId: string | number };
  Payment: { deliveryId?: string; amount?: number } | undefined;
  PaymentMethods: undefined;

  // Client Screens
  Home: undefined;
  Wallet: undefined;
  DeliveryHistory: undefined;
  Notifications: undefined;
  Profile: undefined;
  Support: undefined;
  TransactionHistory: undefined;
  AddFunds: undefined;
  Marketplace: undefined;
  MerchantDetails: { merchantId: string };
  DeliveryDetails: { deliveryId: string | number };
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
  CourierProfile: undefined;
  CourierDeliveryHistory: undefined;

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
};

export type TabParamList = {
  Home: undefined
  Orders: undefined
  Profile: undefined
  Wallet: undefined;
  Notifications: undefined;
}

export type CourierTabParamList = {
  Home: undefined
  Deliveries: undefined
  Earnings: undefined
  Profile: undefined
  Dashboard: undefined;
  Collaborative: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}