export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loading?: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface LoginCredentials {
  email?: string;
  phoneNumber?: string;
  password?: string;
  otp?: string;
}

export interface User {
  id: number
  phone: string
  email?: string
  full_name: string
  role: UserRole
  is_active: boolean
  profile_picture?: string
  created_at: string
  updated_at: string
  language_preference?: 'fr' | 'en' | 'dioula' | 'baoulé'
  commune?: string
  address?: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other'
  verification_status?: 'pending' | 'verified' | 'rejected'
  last_active?: string
  token?: string
  // Additional properties
  avatar?: string
  first_name?: string
  username?: string
  name?: string
  profile_image?: string
  nationality?: string
  city?: string
  country?: string
  vehicle_type?: string
  license_plate?: string
  business_name?: string
  business_address?: string
  wallet_balance?: number
  monthly_earnings?: number
  completed_deliveries?: number
}

export type UserRole = 'client' | 'courier' | 'business' | 'admin'

export const UserRole = {
  CLIENT: 'client' as const,
  COURIER: 'courier' as const,
  BUSINESS: 'business' as const,
  ADMIN: 'admin' as const,
} as const

export interface Delivery {
  id: number
  user_id?: number
  pickup_address: string
  delivery_address: string
  pickup_lat: number
  pickup_lng: number
  delivery_lat: number
  delivery_lng: number
  package_type: string
  package_weight?: number
  package_description?: string
  special_instructions?: string
  proposed_price: number
  final_price?: number
  total_price?: number
  status: DeliveryStatus
  distance: number
  estimated_duration: number
  created_at: string
  updated_at: string
  pickup_time?: string
  delivery_time?: string
  delivered_at?: string
  client_phone?: string
  weather_conditions?: string
  courier?: Courier
  client?: User
  tracking_points?: TrackingPoint[]
  bids?: Bid[]
  is_paid?: any
  payment_method?: any
  price?: number
  pickup_commune?: string
  delivery_commune?: string
  estimated_distance?: number
  pickup_location?: string
  delivery_location?: string
  notes?: string
  description?: string
  is_fragile?: boolean
  rating?: any
  actual_price?: number
  courier_id?: number
}

export type DeliveryStatus = 'pending' | 'bidding' | 'accepted' | 'confirmed' | 'picked_up' | 'in_progress' | 'in_transit' | 'near_destination' | 'delivered' | 'completed' | 'cancelled'

export interface Courier {
  id: number
  user_id: number
  vehicle_type: VehicleType
  license_plate: string
  is_available: boolean
  current_lat?: number
  current_lng?: number
  rating?: number
  rating_count?: number
  total_deliveries?: number
  created_at: string
  updated_at: string
  full_name?: string
  name?: string
  phone?: string
  profile_picture?: string
  user?: User
  avatar?: string
  average_rating?: number
}

export type VehicleType = 'motorcycle' | 'car' | 'bicycle' | 'scooter' | 'van' | 'truck'

export const VehicleType = {
  MOTORCYCLE: 'motorcycle' as const,
  CAR: 'car' as const,
  BICYCLE: 'bicycle' as const,
  SCOOTER: 'scooter' as const,
  VAN: 'van' as const,
  TRUCK: 'truck' as const,
  PICKUP: 'car' as const,
  CUSTOM: 'custom' as const
}

export interface Bid {
  id: number
  delivery_id: number
  courier_id: number
  proposed_price: number
  message?: string
  estimated_pickup_time: string
  status: BidStatus
  created_at: string
  updated_at: string
  courier?: Courier
  amount: number
  estimated_time: number
  estimated_duration?: number
}

export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

export interface TrackingPoint {
  id: number
  delivery_id: number
  lat: number
  lng: number
  timestamp: string
  status?: string
  notes?: string
}

export interface Notification {
  id: string | number
  title: string
  message: string
  type: string
  created_at: string
  read: boolean
  is_read: boolean
  date: string
  user_id?: number
  data?: NotificationData
}

export interface NotificationData {
  delivery_id?: string
  courier_id?: string
  user_id?: string
  type?: string
  action?: string
}

export type NotificationType = 'delivery' | 'payment' | 'system' | 'promotion' | 'delivery_update' | 'message'

export interface PendingOperation {
  id: string
  timestamp: string
  type: 'delivery' | 'bid' | 'tracking' | 'rating' | 'support_ticket' | 'ticket_reply' | 'register' | 'profile_image' | 'profile_update'
  retries: number
  data: any
}

export type PendingOperationCreate = Omit<PendingOperation, 'id' | 'timestamp'>

export interface NetworkContextType {
  isConnected: boolean
  isOnline: boolean
  pendingUploads: PendingOperation[]
  pendingDownloads: PendingOperation[]
  addPendingUpload: (type: PendingOperation['type'], data: any) => void
  syncPendingOperations: () => Promise<void>
}

export interface Address {
  id: string
  name: string
  description: string
  commune: string
  latitude: number
  longitude: number
  type: string
}

export interface WeatherCurrent {
  temperature: number
  condition: string
  humidity: number
  wind_speed: number
}

export interface WeatherAlert {
  title: string
  description: string
  message: string
}

export interface Weather {
  temperature: number
  condition: string
  humidity: number
  wind_speed: number
  feels_like: number
  location?: string
  current?: WeatherCurrent
  forecast?: any[]
  alerts?: WeatherAlert[]
  is_day?: number
  wind_mph?: number
  wind_kph?: number
  wind_degree?: number
  wind_dir?: string
  pressure_mb?: number
  pressure_in?: number
  precip_mm?: number
  precip_in?: number
  cloud?: number
  vis_km?: number
  vis_miles?: number
}

export interface WeatherData {
  current: WeatherCurrent
  forecast?: any[]
  alerts?: string[]
}

export interface Merchant {
  id: number
  name: string
  description?: string
  address: string
  phone?: string
  email?: string
  category?: string
  categories?: string[]
  rating?: number
  review_count?: number
  cover_image?: string
  opening_hours?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: number
  user_id: number
  type: VehicleType
  license_plate: string
  is_available: boolean
  rating?: number
  rating_count?: number
  total_deliveries?: number
  created_at: string
  updated_at: string
  insurance_expiry?: string
}

export interface UserProfile {
  user_id: number
  full_name: string
  phone: string
  email: string
  address: string
  city: string
  country: string
  date_of_birth?: string
  nationality?: string
  profile_picture?: string
  role: string
  vehicle_type?: string
  license_plate?: string
  business_name?: string
  business_address?: string
}

export interface CourierProfile {
  user_id: number
  full_name: string
  phone: string
  email: string
  vehicle_type: VehicleType
  license_plate: string
  is_available: boolean
  rating: number
  total_deliveries: number
}

export interface CourierStats {
  total_deliveries: number
  completed_deliveries: number
  cancelled_deliveries: number
  average_rating: number
  total_earnings: number
  total_distance?: number
  daily_deliveries?: number
  totalDistance?: number
  badges?: string[]
}

export interface SupportTicket {
  id: number;
  user_id: number;
  user?: User;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;
  messages?: SupportMessage[];
  assigned_to?: number;
  resolution?: string;
}

export interface SupportMessage {
  id: number;
  ticket_id: number;
  sender_id: number;
  message: string;
  is_from_support: boolean;
  created_at: string;
}

// Types pour les données de prix et recommandations
export interface PriceEstimateData {
  pickup_address: string
  delivery_address: string
  package_weight?: number
  vehicle_type?: string
  delivery_type?: string
}

export interface VehicleRecommendationData {
  package_weight: number
  package_size: string
  is_fragile: boolean
  distance: number
}

export interface VehicleRecommendation {
  recommended_type: string
  recommended_vehicle: string
  reasoning: string
  reason: string
  alternatives: string[]
}

// Missing types for screens
export interface Product {
  id: number
  name: string
  description?: string
  price: number
  category?: string
  image_url?: string
}

export interface Order {
  id: number
  user_id: number
  status: OrderStatus
  total_amount: number
  created_at: string
  items: OrderItem[]
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  quantity: number
  unit_price: number
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

export interface PaymentMethod {
  id: string
  type: 'card' | 'mobile_money' | 'cash'
  name: string
  is_default: boolean
}

export type TransactionType = 'payment' | 'refund' | 'withdrawal' | 'deposit'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled'

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  language: string
  notifications_enabled: boolean
}

export interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp?: number
}

export interface RouteData {
  coordinates: LocationData[]
  distance: number
  duration: number
}

export interface NetworkState {
  isConnected: boolean
  isInternetReachable: boolean
  type: string
}

export interface Theme {
  colors: Record<string, string>
  spacing: Record<string, number>
  typography: Record<string, any>
}

export type ThemeMode = 'light' | 'dark' | 'auto'

export interface Address {
  id: string
  name: string
  description: string
  commune: string
  latitude: number
  longitude: number
  type: string
}

export interface Weather {
  temperature: number
  condition: string
  humidity: number
  wind_speed: number
  feels_like: number
  location?: string
  current?: WeatherCurrent
  forecast?: any[]
  alerts?: WeatherAlert[]
  is_day?: number
  wind_mph?: number
  wind_kph?: number
  wind_degree?: number
  wind_dir?: string
  pressure_mb?: number
  pressure_in?: number
  precip_mm?: number
  precip_in?: number
  cloud?: number
  vis_km?: number
  vis_miles?: number
}

export interface AvailableDelivery {
  distance: number
  score?: number
  eta_minutes?: number
}

export interface DeliverySearchParams {
  commune?: string
  max_distance?: number
  min_price?: number
  max_price?: number
  vehicle_type?: string
  limit?: number
}

// Types pour les requêtes API
export interface DeliveryCreateRequest {
  pickup_address: string
  pickup_commune: string
  pickup_lat?: number
  pickup_lng?: number
  pickup_contact_name?: string
  pickup_contact_phone?: string
  delivery_address: string
  delivery_commune: string
  delivery_lat?: number
  delivery_lng?: number
  delivery_contact_name?: string
  delivery_contact_phone?: string
  package_description?: string
  package_size?: string
  package_weight?: number
  is_fragile?: boolean
  proposed_price: number
  delivery_type?: string
}

export interface DeliveryUpdateRequest {
  pickup_address?: string
  pickup_commune?: string
  delivery_address?: string
  delivery_commune?: string
  package_description?: string
  proposed_price?: number
}

export interface BidCreateRequest {
  delivery_id: number
  proposed_price: number
  estimated_duration?: number
  message?: string
}

export interface TrackingPointRequest {
  delivery_id: number
  lat: number
  lng: number
  accuracy?: number
  speed?: number
  heading?: number
}

export interface VehicleCreateRequest {
  type: VehicleType
  make: string
  model: string
  year: number
  license_plate: string
  color?: string
  capacity?: number
  maxDistance?: number
  customType?: string
}

export interface CourierVehicleCreateRequest extends VehicleCreateRequest {
  courier_id: string
}

export interface VehicleUsage {
  total_distance: number
  total_deliveries: number
  fuel_consumption?: number
  maintenance_cost?: number
}

// Weather Types
export interface WeatherForecastDay {
  day: string
  date: string
  condition: string
  max_temp: number
  min_temp: number
  humidity: number
  wind_speed: number
  chance_of_rain: number
  icon?: string
}

export interface WeatherAlert {
  message: string
  id: number
  type: string
  severity: "low" | "medium" | "high"
  title: string
  description: string
  start_time: string
  end_time: string
  affected_communes: string[]
  precautions?: string[]
  source?: string
}

// CollaborativeDelivery Types
export interface CollaborativeDelivery extends Delivery {
  max_participants: number
  contribution_amount: number
  description: string
  participants?: User[]
  pickupAddress: string
  deliveryAddress: string
  estimatedDistance: string
  estimatedDuration: string
  packageDescription: string
  packageWeight: string
  packageSize: string
  isFragile: boolean
  acceptedAt?: string
  cancelledAt?: string
  createdBy: string
  deliveryId: number
  deliveryStatus: string
  deliveryType: string
  createdAt: string
  updatedAt: string
  deliveryPrice: number
  id: number
  title: string
  status: string
  pickupCommune: string
  deliveryCommune: string
  proposedPrice?: number
  collaborators: Collaborator[]
  pickupAt?: string
  deliveredAt?: string
  completedAt?: string
  clientName: string
  finalPrice?: number
}

export interface Collaborator {
  courierName: any
  profilePicture: any
  id: number
  user_id: number
  delivery_id: number
  role: CollaboratorRole
  sharePercentage: number
  status: string
  notes?: string
  joined_at: string
}

export type CollaboratorRole = "primary" | "secondary" | "support"

// ChatMessage and EarningsDistribution Types
export interface ChatMessage {
  id: number
  delivery_id: number
  user_id: number
  message: string
  timestamp: string
  createdAt: string
  userId: number
  userName: string
  userRole: string
  userAvatar?: string
}

export interface EarningsDistribution {
  id: number
  delivery_id: number
  user_id: number
  amount: number
  percentage: number
}

// Vehicle and Document Types
export enum VehicleStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  MAINTENANCE = "maintenance",
  RETIRED = "retired"
}

export enum DocumentType {
  INSURANCE = "insurance",
  REGISTRATION = "registration",
  PERMIT = "permit",
  LICENSE = "license",
  INSPECTION = "inspection"
}

export enum DocumentStatus {
  PENDING = "pending",
  VERIFIED = "verified",
  REJECTED = "rejected",
  EXPIRED = "expired"
}

export interface VehicleDocument {
  id: number;
  courier_vehicle_id: number;
  type: DocumentType;
  document_url: string;
  expiry_date?: string;
  status: DocumentStatus;
  verified_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRecord {
  id: number;
  courier_vehicle_id: number;
  type: string;
  description: string;
  cost: number;
  date: string;
  next_service_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// TransportRule Type
export interface TransportRule {
  id: number;
  commune: string;
  vehicle_type: VehicleType;
  max_weight: number;
  max_volume: number;
  restricted_hours: string[];
  special_permits_required: boolean;
  environmental_restrictions: boolean;
  created_at: string;
  updated_at: string;
}

// Notification Type and Enum
export enum NotificationType2 {
  DELIVERY_UPDATE = 'delivery_update',
  PAYMENT = 'payment',
  PROMOTION = 'promotion',
  SYSTEM = 'system'
}

// PendingOperation Types
export interface ProfileUpdateData {
  user_id: number
  name?: string
  address?: string
  city?: string
  country?: string
  phone?: string
  email?: string
  commune?: string
  vehicle_type?: string
  license_plate?: string
  business_name?: string
  business_address?: string
  profile_picture?: string
}

export interface SupportRequestData {
  user_id: number
  subject: string
  message: string
  type: string
  related_id?: number
  attachments?: string[]
}

// LanguageCode Enum
export enum LanguageCode {
  EN = "en",
  FR = "fr",
  ES = "es",
}

// CargoCategory Enum
export enum CargoCategory {
  SMALL_PACKAGE = "small_package",
  MEDIUM_PACKAGE = "medium_package",
  LARGE_PACKAGE = "large_package",
  FRAGILE = "fragile",
  REFRIGERATED = "refrigerated",
  DOCUMENTS = "documents",
  FOOD = "food",
  LIQUIDS = "liquids",
  CUSTOM = "custom",
  ELECTRONICS = "electronics",
  FURNITURE = "furniture",
  APPLIANCES = "appliances",
  CONSTRUCTION = "construction",
}

// Courier and Rating Types
export interface Rating {
  id: number
  rating: number
  comment?: string
  delivery_id: number
  courier_id: number
  created_at: string
}

// CourierVehicle Types
export interface Badge {
  id: number;
  name: string;
  description: string;
  icon?: string;
  earned_at?: string;
}

export type FeatherIconName = 'package' | 'tag' | 'credit-card' | 'star' | 'gift' | 'bell' | 'dots-vertical' | 'delete';

export interface CourierVehicle {
  id: number;
  courier_id: number;
  vehicle_id: number;
  is_primary: boolean;
  assigned_at: string;
  status: VehicleStatus;
  vehicle: Vehicle;
  documents: VehicleDocument[];
  maintenance_records: MaintenanceRecord[];
}

// VehicleRecommendation Types
export interface VehicleRecommendationRequest {
  cargo_category: CargoCategory;
  package_weight: number;
  package_volume: number;
  pickup_commune: string;
  delivery_commune: string;
  delivery_time?: string;
  budget_range?: {
    min: number;
    max: number;
  };
}

export interface VehicleUsageCreateRequest {
  courier_vehicle_id: number;
  delivery_id: number;
  distance_km: number;
  fuel_consumed: number;
  duration_minutes: number;
  start_time: string;
  end_time: string;
}

// VehicleStats Types
export interface VehicleUsageStats {
  total_distance: number;
  total_fuel_consumed: number;
  total_duration_hours: number;
  average_speed: number;
  most_used_vehicle_type: VehicleType;
  usage_by_vehicle_type: Record<VehicleType, number>;
  usage_by_time_period: {
    date: string;
    distance: number;
    fuel_consumed: number;
    duration_hours: number;
  }[];
}

export interface VehiclePerformanceStats {
  efficiency_score: number;
  maintenance_cost_per_km: number;
  fuel_efficiency: number;
  uptime_percentage: number;
  delivery_success_rate: number;
  average_delivery_time: number;
  performance_by_vehicle: {
    vehicle_id: number;
    vehicle_type: VehicleType;
    efficiency_score: number;
    total_deliveries: number;
    success_rate: number;
  }[];
}

export interface VehicleEnvironmentalStats {
  total_carbon_emissions: number;
  carbon_per_km: number;
  eco_friendly_percentage: number;
  fuel_consumption_trend: {
    date: string;
    consumption: number;
    emissions: number;
  }[];
  vehicle_environmental_impact: {
    vehicle_type: VehicleType;
    avg_emissions_per_km: number;
    eco_rating: string;
  }[];
}

// Authentication Types
export interface LoginCredentials {
  email?: string;
  phone?: string;
  password?: string;
}

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: UserRole;
  commune?: string;
  phone?: string;
}

export interface ResetPasswordRequest {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qr_code: string;
  backup_codes: string[];
}

// Advanced Delivery Types
export interface DeliveryTracking {
  id: number;
  delivery_id: number;
  current_location: Coordinates;
  estimated_arrival: string;
  status: DeliveryStatus;
  tracking_points: TrackingPoint[];
  courier_info?: {
    name: string;
    phone: string;
    vehicle_type: VehicleType;
    profile_picture?: string;
  };
  real_time_updates: boolean;
}

export interface DeliveryEstimate {
  estimated_price: number
  estimated_duration: number
  distance: number
}

export interface ExpressDelivery extends Delivery {
  is_priority: boolean
  guaranteed_delivery_time?: string
}

export interface CollaborativeDelivery extends Delivery {
  max_participants: number
  contribution_amount: number
  description: string
  participants?: User[]
}

export interface Notification {
  id: string | number
  title: string
  message: string
  type: string
  created_at: string
  read: boolean
  is_read: boolean
  date: string
  user_id?: number
  data?: NotificationData
}

export interface AvailableDelivery extends Delivery {
  distance: number
  score?: number
  eta_minutes?: number
}

export interface DeliveryFilters {
  status?: DeliveryStatus
  date_from?: string
  date_to?: string
  commune?: string
  limit?: number
}

export interface DeliverySearchParams {
  commune?: string
  max_distance?: number
  min_price?: number
  max_price?: number
  vehicle_type?: string
  limit?: number
}

export interface DeliveryCreateRequest {
  pickup_address: string
  pickup_commune: string
  pickup_lat?: number
  pickup_lng?: number
  pickup_contact_name?: string
  pickup_contact_phone?: string
  delivery_address: string
  delivery_commune: string
  delivery_lat?: number
  delivery_lng?: number
  delivery_contact_name?: string
  delivery_contact_phone?: string
  package_description?: string
  package_size?: string
  package_weight?: number
  is_fragile?: boolean
  proposed_price: number
  delivery_type?: string
}

export interface DeliveryUpdateRequest {
  pickup_address?: string
  pickup_commune?: string
  delivery_address?: string
  delivery_commune?: string
  package_description?: string
  proposed_price?: number
}

export interface BidCreateRequest {
  delivery_id: number
  proposed_price: number
  estimated_duration?: number
  message?: string
}

export interface TrackingPointRequest {
  delivery_id: number
  lat: number
  lng: number
  accuracy?: number
  speed?: number
  heading?: number
}

export interface PriceEstimateData {
  pickup_address: string
  delivery_address: string
  package_weight?: number
  vehicle_type?: string
  delivery_type?: string
}

export interface VehicleRecommendationData {
  package_weight: number
  package_size: string
  is_fragile: boolean
  distance: number
}

export interface ExpressDeliveryRequest extends DeliveryCreateRequest {
  is_priority: boolean
  guaranteed_delivery_time?: string
}

export interface CollaborativeDeliveryRequest extends DeliveryCreateRequest {
  max_participants: number
  contribution_amount: number
  description: string
}

// KYCDocument Types
export interface KYCDocument {
  id: number;
  user_id: number;
  type: 'id_card' | 'driving_license' | 'vehicle_registration' | 'insurance' | 'business_license';
  document_type: 'id_card' | 'driving_license' | 'vehicle_registration' | 'insurance' | 'business_license';
  document_url: string;
  url: string;
  status: KYCStatus;
  submitted_at: string;
  reviewed_at?: string;
  notes?: string;
}

export interface KYCStatus {
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  documents_required: string[];
  documents_submitted: string[];
  verification_level: 'basic' | 'enhanced' | 'premium';
  last_review_date?: string;
}

// UserType and NotificationSettings Types
export interface NotificationSettings {
  delivery_updates: boolean
  delivery_notifications: boolean
  bid_notifications: boolean
  payment_notifications: boolean
  promotional_offers: boolean
  security_alerts: boolean
  push_notifications: boolean
  email_notifications: boolean
  sms_notifications: boolean
  whatsapp_enabled?: boolean
  sound_enabled?: boolean
  vibration_enabled?: boolean
}

// UserPreferences Type
export interface UserPreferences {
  language: string;
  currency: string;
  theme: 'light' | 'dark' | 'auto';
  notification_settings: NotificationSettings;
  location_sharing: boolean;
  auto_accept_express: boolean;
  auto_accept_bids: boolean;
  prioritize_nearby_couriers: boolean;
  allow_express_delivery: boolean;
  allow_courier_calls: boolean;
  allow_courier_messages: boolean;
  preferred_delivery_time: string;
  preferred_vehicle_types: VehicleType[];
}

// UserStats Type
export interface UserStats {
  total_deliveries: number;
  successful_deliveries: number;
  cancelled_deliveries: number;
  total_earnings: number;
  average_rating: number;
  total_distance: number;
  join_date: string;
  last_active: string;
  completion_rate: number;
  on_time_percentage: number;
}

// UserProfileExtended Types
export interface UserProfileExtended {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  status?: "online" | "offline";
  profile_image?: string;
  created_at: string;
  updated_at: string;
  address?: string;
  city?: string;
  country?: string;
  commune?: string;
  vehicle_type?: string;
  license_plate?: string;
  business_name?: string;
  business_address?: string;
  profile_picture?: string;
  full_name?: string;
  is_online?: boolean;
  user_id: number;
  kyc_status: KYCStatus;
  preferences: UserPreferences;
  stats: UserStats;
  notification_settings: NotificationSettings;
}

// BusinessProfile Types
export interface BusinessProfile {
  id: number;
  user_id: number;
  business_name: string;
  business_type?: string;
  siret?: string;
  kbis_url?: string;
  address: string;
  commune: string;
  lat?: number;
  lng?: number;
  logo_url?: string;
  description?: string;
  commission_rate?: number;
  created_at: string;
  updated_at?: string;
}

// KYCVerification Types
export interface KYCVerification {
  id: number;
  user_id: number;
  document_type: 'id_card' | 'driving_license' | 'vehicle_registration' | 'insurance' | 'business_license';
  document_url: string;
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  submitted_at: string;
  reviewed_at?: string;
  notes?: string;
  documents?: KYCDocument[];
}

// DeliveryFilters Type
export interface DeliveryFilters {
  status?: DeliveryStatus;
  commune?: string;
  date_from?: string;
  date_to?: string;
  min_price?: number;
  max_price?: number;
  vehicle_type?: VehicleType;
  skip?: number;
  limit?: number;
}

// Earnings Types
export interface EarningsSummary {
  total_earnings: number
  available_balance: number
  pending_balance: number
  total_deliveries: number
  total_distance: number
  average_rating: number
}

export interface EarningsHistory {
  date: string
  amount: number
  deliveries: number
}

export interface Transaction {
  id: string
  type: "earning" | "withdrawal" | "bonus" | "fee"
  amount: number
  status: "completed" | "pending" | "failed"
  delivery_id?: string
  description: string
  created_at: string
}

export interface CourierEarningsData {
  summary: EarningsSummary
  history: EarningsHistory[]
  transactions: Transaction[]
}

export interface WalletTransaction extends Transaction {
  reference?: string
  payment_method?: string
  fees?: number
}

export interface PayoutRequest {
  amount: number
  payment_method: string
  account_details?: Record<string, any>
}

export interface Achievement {
  id: number
  title: string
  description: string
  type: string
  points: number
  unlocked_at?: string
  progress?: number
  required_value?: number
}

export interface Leaderboard {
  courier_id: number
  name: string
  profile_picture?: string
  points: number
  deliveries_count: number
  rank: number
}

export interface Challenge {
  id: number
  title: string
  description: string
  type: string
  target_value: number
  current_progress: number
  reward_points: number
  expires_at: string
  is_completed: boolean
}

export interface Promotion {
  id: string
  name: string
  description?: string
  promotion_type: 'discount_percentage' | 'discount_fixed' | 'free_delivery' | 'cashback'
  discount_value: number
  max_discount?: number
  min_order_value?: number
  start_date: string
  end_date: string
  is_active: boolean
  max_uses_per_user?: number
  current_uses: number
  max_uses_total?: number
  target_zones?: number[]
  target_user_types?: string[]
  is_auto_apply: boolean
}

export interface Zone {
  id: string
  name: string
  description?: string
  zone_type: 'city' | 'district' | 'special'
  coordinates?: number[][]
  center_lat: number
  center_lng: number
  radius?: number
  base_price: number
  price_per_km: number
  max_delivery_time?: number
  min_courier_rating?: number
  requires_special_vehicle: boolean
  peak_hour_multiplier: number
  is_active: boolean
}

export interface PromotionUsage {
  id: string
  promotion_id: string
  user_id: string
  delivery_id: string
  discount_applied: number
  cashback_earned: number
  created_at: string
}

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface RegisterRequest {
  full_name: string;
  email?: string;
  phone: string;
  user_password: string;
  role: UserRole;
  commune?: string;
  language_preference?: string;
  vehicle_type?: VehicleType;
  license_plate?: string;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface VTCDeliveryStatus {
  status: 'searching' | 'assigned' | 'pickup' | 'transit' | 'delivered' | 'cancelled'
  eta?: string
  progress: number
}

export type VTCDeliveryStatusType = 'searching' | 'assigned' | 'pickup' | 'transit' | 'delivered' | 'cancelled'