import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

export type RootStackParamList = {
  Login: undefined
  OTPLogin: undefined
  ClassicLogin: undefined
  Register: undefined
  VerifyOTP: { phone: string }
  ForgotPassword: undefined
  Onboarding: undefined
  ClientMain: undefined
  CourierMain: undefined
  ClientTabs: undefined
  CourierTabs: undefined
  Home: undefined
  CreateDelivery: undefined
  MerchantDetails: { merchantId: string }
  DeliveryDetails: { deliveryId: string }
  Bids: { deliveryId: string }
  TrackDelivery: { deliveryId: string }
  Payment: { deliveryId: string; amount: number }
  RateDelivery: { deliveryId: string }
  EnhancedRateDelivery: { deliveryId: string }
  Bid: { deliveryId: string }
  CourierTrackDelivery: { deliveryId: string }
  CourierStatus: { initialStatus?: boolean } | undefined
  CourierStats: undefined
  CollaborativeDeliveries: undefined
  CollaborativeDeliveryDetails: { deliveryId: string; clientName: string; finalPrice: number }
  JoinCollaborativeDelivery: { deliveryId: string }
  CollaborativeChat: { deliveryId: string }
  Gamification: undefined
  CommunityWallet: undefined
  VehicleManagement: undefined
  CourierProfile: { courierId: string }
  Notifications: undefined
  Support: undefined
  LanguageSettings: undefined
  Main: undefined
  ClientHome: undefined
  Marketplace: { category?: string }
  DeliveryHistory: undefined
  Settings: undefined
  CourierHome: undefined
  CourierEarnings: undefined
  CourierDeliveryHistory: undefined
  WebPayment: { paymentUrl: string; transactionId: string; onComplete: (success: boolean) => void }
  Cart: { merchantId: string }
  Profile: undefined
  NotificationSettings: undefined
  SecuritySettings: undefined
  ChangePassword: undefined
  SecurityQuestions: undefined
  StorageManagementScreen: undefined
  AutoSyncSettingsScreen: undefined
  DataUsageSettingsScreen: undefined
  WeatherScreen: { location: string }
  GamificationScreen: undefined
  AvailableDeliveries: undefined
  KYCVerification: undefined
  PaymentMethods: undefined
  PrivacySettings: undefined
}

export type ClientTabParamList = {
  ClientHome: undefined
  Marketplace: undefined
  DeliveryHistory: undefined
  Settings: undefined
}

export type CourierTabParamList = {
  CourierHome: undefined
  CourierEarnings: undefined
  CourierDeliveryHistory: undefined
  Settings: undefined
}

// Types pour les stacks de livraisons
export type ClientDeliveriesParamList = {
  DeliveriesList: undefined
  CreateDelivery: undefined
  DeliveryDetails: { deliveryId: string }
  Bids: { deliveryId: string }
  TrackDelivery: { deliveryId: string }
  Payment: { deliveryId: string; amount: number }
  RateDelivery: { deliveryId: string }
}

export type CourierDeliveriesParamList = {
  DeliveriesList: undefined
  DeliveryDetails: { deliveryId: string }
  Bid: { deliveryId: string }
  TrackDelivery: { deliveryId: string }
}

export type ClientHomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "ClientHome">
export type CourierHomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "CourierHome">
export type DeliveryDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "DeliveryDetails">
export type BidsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Bids">
export type TrackDeliveryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "TrackDelivery">
export type PaymentScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Payment">
export type RateDeliveryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "RateDelivery">
export type BidScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Bid">
export type CourierTrackDeliveryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CourierTrackDelivery"
>
export type CourierStatusScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "CourierStatus">
export type CourierStatsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "CourierStats">
export type CollaborativeDeliveriesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CollaborativeDeliveries"
>
export type CollaborativeChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "CollaborativeChat">
export type GamificationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Gamification">
export type CommunityWalletScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "CommunityWallet">
export type VehicleManagementScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "VehicleManagement">
export type CourierProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "CourierProfile">
export type NotificationsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Notifications">
export type SupportScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Support">
export type LanguageSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "LanguageSettings">
export type MainScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Main">
export type DeliveryHistoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "DeliveryHistory">
export type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Settings">
export type CourierEarningsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "CourierEarnings">
export type CourierDeliveryHistoryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CourierDeliveryHistory"
>
export type WebPaymentScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "WebPayment">
export type CartScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Cart">
export type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Profile">
export type NotificationSettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "NotificationSettings"
>
export type SecuritySettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "SecuritySettings">
export type ChangePasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "ChangePassword">
export type SecurityQuestionsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "SecurityQuestions">
export type StorageManagementScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "StorageManagementScreen"
>
export type AutoSyncSettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AutoSyncSettingsScreen"
>
export type DataUsageSettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "DataUsageSettingsScreen"
>
export type WeatherScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "WeatherScreen">
