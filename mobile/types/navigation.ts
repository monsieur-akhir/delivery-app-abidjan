import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

export type RootStackParamList = {
  // Auth Stack
  Login: undefined
  OTPLogin: undefined
  ClassicLogin: undefined
  Register: undefined
  ForgotPassword: undefined
  VerifyOTP: { phone: string }
  Onboarding: undefined

  // Client Stack
  ClientHome: undefined
  ClientTabs: undefined
  CreateDelivery: { searchQuery?: string } | undefined
  DeliveryHistory: undefined
  DeliveryDetails: { deliveryId: number }
  TrackDelivery: { deliveryId: number }
  RateDelivery: { deliveryId: number }
  Wallet: undefined
  TransactionHistory: undefined
  Notifications: undefined
  Profile: undefined
  Settings: undefined
  Support: undefined
  BidsScreen: { deliveryId: number }
  PaymentScreen: { deliveryId: number }
  AddFunds: undefined
  Marketplace: { category?: string }
  MerchantDetails: { merchantId: number }
  Bids: { deliveryId: number }
  Payment: { deliveryId: number; amount: number }
  Home: undefined
  EnhancedRateDelivery: { deliveryId: number }
  WebPayment: { paymentUrl: string; transactionId: string; onComplete: (success: boolean) => void }
  Cart: { merchantId: number }
  NotificationSettings: undefined
  SecuritySettings: undefined
  ChangePassword: undefined
  SecurityQuestions: undefined
  StorageManagementScreen: undefined
  AutoSyncSettingsScreen: undefined
  DataUsageSettingsScreen: undefined
  WeatherScreen: { location?: string }
  KYCVerification: undefined
  PaymentMethods: undefined
  PrivacySettings: undefined
  ComplaintsScreen: undefined

  // Courier Stack
  CourierHome: undefined
  CourierTabs: undefined
  AvailableDeliveries: undefined
  CourierDeliveryHistory: undefined
  CourierTrackDelivery: { deliveryId: number }
  BidScreen: { delivery: any }
  VehicleManagement: undefined
  AddVehicleScreen: { vehicleId?: number }
  CourierEarnings: undefined
  CourierStats: undefined
  CourierWallet: undefined
  CourierProfile: undefined
  CourierStatus: { initialStatus?: boolean }
  Bid: { deliveryId: string }
  CollaborativeDeliveries: undefined
  CollaborativeChat: { deliveryId: string }
  Gamification: undefined
  CommunityWallet: undefined
  LanguageSettings: undefined
  Main: undefined
  GamificationScreen: undefined
  CollaborativeDeliveryDetails: { deliveryId: string; clientName: string; finalPrice: number }
  JoinCollaborativeDelivery: { deliveryId: string }
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
  TrackDelivery: undefined
  Payment: { deliveryId: string; amount: number }
  RateDelivery: { deliveryId: string }
}

export type CourierDeliveriesParamList = {
  DeliveriesList: undefined
  DeliveryDetails: { deliveryId: string }
  Bid: { deliveryId: string }
}

// Extensions des types existants pour compatibilité
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

// Navigation Props
export type ClientHomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "ClientHome">
export type CourierHomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "CourierHome">
export type DeliveryDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "DeliveryDetails">
export type BidsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "BidsScreen">
export type TrackDeliveryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "TrackDelivery">
export type PaymentScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "PaymentScreen">
export type RateDeliveryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "RateDelivery">
export type BidScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "BidScreen">
export type CourierTrackDeliveryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "CourierTrackDelivery">
export type CourierStatusScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "CourierStatus">
export type CourierStatsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "CourierStats">
export type CollaborativeDeliveriesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "CollaborativeDeliveries">
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
export type CourierDeliveryHistoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "CourierDeliveryHistory">
export type WebPaymentScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "WebPayment">
export type CartScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Cart">
export type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Profile">
export type NotificationSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "NotificationSettings">
export type SecuritySettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "SecuritySettings">
export type ChangePasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "ChangePassword">
export type SecurityQuestionsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "SecurityQuestions">
export type StorageManagementScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "StorageManagementScreen">
export type AutoSyncSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "AutoSyncSettingsScreen">
export type DataUsageSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "DataUsageSettingsScreen">
export type WeatherScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "WeatherScreen">
export type EnhancedRateDeliveryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "EnhancedRateDelivery">
export type ComplaintsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "ComplaintsScreen">

// Props pour les écrans avec paramètres
export interface BidsScreenProps {
  route: { params: { deliveryId: string } }
  navigation: BidsScreenNavigationProp
}

export interface PaymentScreenProps {
  route: { params: { deliveryId: string; amount: number } }
  navigation: PaymentScreenNavigationProp
}

export interface TrackDeliveryScreenProps {
  route: { params: { deliveryId: string } }
  navigation: TrackDeliveryScreenNavigationProp
}

export interface BidScreenProps {
  route: { params: { delivery: any } }
  navigation: BidScreenNavigationProp
}

export interface EnhancedRateDeliveryScreenProps {
  route: { params: { deliveryId: number } }
  navigation: EnhancedRateDeliveryScreenNavigationProp
}