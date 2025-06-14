// Re-export types with explicit disambiguation
export type { 
  User, 
  Delivery, 
  Courier, 
  Bid, 
  TrackingPoint,
  Notification as NotificationModel,
  NotificationData,
  NotificationType,
  PendingOperation as PendingOp,
  NetworkContextType as NetContextType,
  AuthContextType,
  LoginCredentials,
  RegisterData,
  DeliveryStatus,
  VehicleType,
  BidStatus,
  Address,
  Weather,
  WeatherCurrent,
  WeatherAlert,
  Merchant,
  Vehicle,
  UserProfile,
  CourierProfile,
  CourierStats,
  SupportTicket,
  SupportMessage,
  NotificationSettings,
  UserPreferences,
  UserStats,
  CourierEarningsData,
  WalletTransaction,
  PayoutRequest
} from './models'
export * from './navigation'
export * from './theme'

// Process env types
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL: string;
    }
  }
}

// Additional type exports for common usage
export type { FeatherIconName } from './models'
export type { RootStackParamList, TabParamList } from './navigation'