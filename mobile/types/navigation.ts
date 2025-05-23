import type { RouteProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

export type RootStackParamList = {
  // Auth Screens
  Login: undefined
  Register: undefined
  VerifyOTP: { phone: string }
  ForgotPassword: undefined

  // Tab Navigators
  ClientTabs: undefined
  CourierTabs: undefined

  // Client Screens
  ClientHome: undefined
  CreateDelivery: undefined
  Bids: { deliveryId: string }
  TrackDelivery: { deliveryId: string }
  Payment: { deliveryId: string; amount: number }
  Marketplace: undefined
  MerchantDetails: { merchantId: string }
  RateDelivery: { deliveryId: string }
  EnhancedRateDelivery: { deliveryId: string }
  DeliveryDetails: { deliveryId: string }
  DeliveryHistory: undefined
  ClientNotifications: undefined
  ClientProfile: undefined

  // Courier Screens
  CourierHome: undefined
  Bid: { deliveryId: string }
  CourierTrackDelivery: { deliveryId: string }
  CourierEarnings: undefined
  CourierStatus: undefined
  CourierStats: undefined
  CourierDeliveryHistory: undefined
  CollaborativeDeliveries: undefined
  CollaborativeChat: { deliveryId: string }
  Gamification: undefined
  CommunityWallet: undefined
  CourierNotifications: undefined
  CourierProfile: undefined

  // Common Screens
  Settings: undefined
  Support: undefined
  LanguageSettings: undefined
  ChangePassword: undefined
  DeleteAccount: undefined
  TermsOfService: undefined
  PrivacyPolicy: undefined
  ContactSupport: undefined
  CollaborativeDeliveryDetails: { deliveryId: string }
}

export type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">
export type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Register">
export type VerifyOTPScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "VerifyOTP">
export type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "ForgotPassword">

export type ClientHomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "ClientHome">
export type CreateDeliveryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "CreateDelivery">
export type BidsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Bids">
export type TrackDeliveryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "TrackDelivery">
export type PaymentScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Payment">
export type MarketplaceScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Marketplace">
export type MerchantDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "MerchantDetails">
export type RateDeliveryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "RateDelivery">
export type EnhancedRateDeliveryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EnhancedRateDelivery"
>
export type DeliveryDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "DeliveryDetails">
export type DeliveryHistoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "DeliveryHistory">

export type CourierHomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "CourierHome">
export type BidScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Bid">
export type CourierTrackDeliveryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CourierTrackDelivery"
>
export type CourierEarningsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "CourierEarnings">
export type CourierStatusScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "CourierStatus">
export type CourierStatsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "CourierStats">
export type CourierDeliveryHistoryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CourierDeliveryHistory"
>
export type CollaborativeDeliveriesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CollaborativeDeliveries"
>
export type CollaborativeChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "CollaborativeChat">
export type GamificationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Gamification">
export type CommunityWalletScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "CommunityWallet">

export type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Settings">
export type SupportScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Support">
export type LanguageSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "LanguageSettings">

export type BidsScreenRouteProp = RouteProp<RootStackParamList, "Bids">
export type TrackDeliveryScreenRouteProp = RouteProp<RootStackParamList, "TrackDelivery">
export type PaymentScreenRouteProp = RouteProp<RootStackParamList, "Payment">
export type MerchantDetailsScreenRouteProp = RouteProp<RootStackParamList, "MerchantDetails">
export type RateDeliveryScreenRouteProp = RouteProp<RootStackParamList, "RateDelivery">
export type EnhancedRateDeliveryScreenRouteProp = RouteProp<RootStackParamList, "EnhancedRateDelivery">
export type DeliveryDetailsScreenRouteProp = RouteProp<RootStackParamList, "DeliveryDetails">
export type BidScreenRouteProp = RouteProp<RootStackParamList, "Bid">
export type CourierTrackDeliveryScreenRouteProp = RouteProp<RootStackParamList, "CourierTrackDelivery">
export type VerifyOTPScreenRouteProp = RouteProp<RootStackParamList, "VerifyOTP">
export type CollaborativeChatScreenRouteProp = RouteProp<RootStackParamList, "CollaborativeChat">
export type CollaborativeDeliveryDetailsScreenRouteProp = RouteProp<RootStackParamList, "CollaborativeDeliveryDetails">
