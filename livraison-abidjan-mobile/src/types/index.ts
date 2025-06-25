// Re-export types with explicit disambiguation
export type {
  User,
  UserRole,
  UserProfile,
  Delivery,
  DeliveryStatus,
  DeliveryEstimate,
  TrackingPoint,
  Bid,
  Vehicle,
  VehicleType,
  VehicleCreateRequest,
  VehicleUpdateRequest,

  CourierProfile,
  CourierStats,
  Merchant,
  Product,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  Transaction,
  TransactionType,
  TransactionStatus,
  WalletTransaction,
  NotificationData,
  NotificationSettings,
  AppSettings,
  LocationData,
  RouteData,
  NetworkState,
  PendingOperation,
  Theme,
  ThemeMode,
  ExpressDelivery,
  CollaborativeDelivery,
  Notification,
  AvailableDelivery,
  DeliveryFilters,
  DeliverySearchParams,
  DeliveryCreateRequest,
  DeliveryUpdateRequest,
  BidCreateRequest,
  TrackingPointRequest,
  PriceEstimateData,
  VehicleRecommendationData,
  VehicleRecommendation,
  ExpressDeliveryRequest,
  CollaborativeDeliveryRequest,
  Address,
  Weather
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