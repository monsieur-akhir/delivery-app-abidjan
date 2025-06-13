import { ReactNode } from "react"

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Weather {
  location: ReactNode
  current: {
    temperature: number
    condition: string
    humidity: number
    wind_speed: number
    pressure?: number
    visibility?: number
    uv_index?: number
    feels_like?: number
    icon?: string
  }
  forecast?: WeatherForecastDay[]
  alerts?: WeatherAlert[]
  last_updated_epoch: number
  last_updated: string
  feelslike: number
  is_day: number
  wind_mph: number
  wind_kph: number
  wind_degree: number
  wind_dir: string
  pressure_mb: number
  pressure_in: number
  precip_mm: number
  precip_in: number
  cloud: number
  vis_km: number
  vis_miles: number
}

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

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface CollaborativeDelivery {
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
  description: string
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
  // Add other properties as needed
}

export interface EarningsDistribution {
  id: number
  delivery_id: number
  user_id: number
  amount: number
  percentage: number
  // Add other properties as needed
}

export type CollaboratorRole = "primary" | "secondary" | "support"
export type UserRole = "client" | "coursier" | "vendeur" | "collaborator"
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

export enum VehicleStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  MAINTENANCE = "maintenance",
  RETIRED = "retired"
}

export enum VehicleType {
  SCOOTER = "scooter",
  BICYCLE = "bicycle", 
  MOTORCYCLE = "motorcycle",
  VAN = "van",
  PICKUP = "pickup",
  KIA_TRUCK = "kia_truck",
  MOVING_TRUCK = "moving_truck",
  CUSTOM = "custom"
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  PENDING_VERIFICATION = "pending_verification"
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

export interface Vehicle {
  id: number
  user_id: number
  type: string
  model: string
  brand?: string
  license_plate: string
  color: string
  capacity: number
  status: string
  is_active?: boolean
  insurance_expiry?: string
  technical_inspection_expiry?: string
  created_at: string
  updated_at: string
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

export interface UserProfile {
  user_id: number
  full_name?: string
  address: string
  city: string
  country: string
  phone?: string // Add this property
  email?: string // Add this property
  role?: string // Add this property
  commune?: string // Add this property
  vehicle_type?: string // Add this property
  license_plate?: string // Add this property
  business_name?: string // Add this property
  business_address?: string // Add this property
  profile_picture?: string // Add this property
  created_at?: string
  // Other existing properties...
}

export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  type?: string
  is_read?: boolean
  data?: {
    type?: string | number
    deliveryId?: number
    delivery_id?: number
    paymentId?: number
    transaction_id?: number
  }
  read_at?: string
  created_at: string
}

export enum NotificationType {
  DELIVERY_UPDATE = 'delivery_update',
  PAYMENT = 'payment',
  PROMOTION = 'promotion',
  SYSTEM = 'system'
}

// This is a legacy interface, renamed to avoid conflicts
export interface CollaboratorOld {
  id: number
  user_id: number
  delivery_id: number
  role: string
  status: string
  notes?: string // Add this property
  // Other existing properties...
}

export interface PendingOperation {
  id: number
  type:
    | "create_delivery"
    | "submit_rating"
    | "bid"
    | "tracking"
    | "update_profile"
    | "support_request"
    | "profile_image"
    | "profile_update"
    | "support_ticket"
    | "ticket_reply"
    | "payment"
    | "collaborative_delivery"
    |"register"
  data: any // Consider replacing with a more specific type later
  delivery_id?: number // Added to support tracking data
  status?: DeliveryStatus // Added to support status updates
  timestamp?: Date | string // Make timestamp optional since it can be added automatically
}

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

export enum LanguageCode {
  EN = "en",
  FR = "fr",
  ES = "es",
}

export enum DeliveryStatus {
  PENDING = 'pending',
  BIDDING = 'bidding',
  ACCEPTED = 'accepted',
  CONFIRMED = 'confirmed',
  PICKED_UP = 'picked_up',
  IN_PROGRESS = 'in_progress',
  IN_TRANSIT = 'in_transit',
  NEAR_DESTINATION = 'near_destination',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Delivery {
  is_paid: any
  payment_method: any
  price: number | undefined
  pickup_location: ReactNode
  delivery_location: ReactNode
  final_price: number
  id: number
  user_id: number
  user_name: string
  user_phone: string
  user_email: string
  user?: User
  client_id?: number
  client?: User
  delivery_id?: number
  delivery_type?: string
  delivery_name?: string
  delivery_phone?: string
  delivery_email?: string
  courier_id?: number
  courier?: Courier
  pickup_address: string
  pickup_commune: string
  pickup_lat: number
  pickup_lng: number
  delivery_address: string
  delivery_commune: string
  delivery_lat: number
  delivery_lng: number
  description: string
  package_size: string
  package_type?: string
  is_fragile: boolean
  is_urgent: boolean
  proposed_price: number
  actual_price?: number
  status: DeliveryStatus
  created_at: string
  updated_at: string
  estimated_distance?: number
  distance?: number
  estimated_duration?: number
  notes?: string
  cargo_category?: string
  required_vehicle_type?: string
  scheduled_pickup_time?: string
  actual_pickup_time?: string
  estimated_delivery_time?: string
  actual_delivery_time?: string
  rating?: number | Rating
  feedback?: string
}

export interface User {
  id: number
  full_name: string
  first_name?: string
  phone: string
  email?: string
  role: UserRole
  status: UserStatus
  commune?: string
  avatar?: string
  token?: string
  created_at: string
  updated_at: string
  kyc_status?: string
  is_verified?: boolean
}

export interface Merchant {
  id: number
  name: string
  business_name?: string
  address: string
  commune: string
  lat: number
  lng: number
  phone: string
  email?: string
  description?: string
  categories?: string[]
  rating?: number
  status: string
  created_at: string
  updated_at: string
}

export interface DeliveryRequest {
  pickup_address: string
  pickup_commune: string
  pickup_lat: number
  pickup_lng: number
  delivery_address: string
  delivery_commune: string
  delivery_lat: number
  delivery_lng: number
  package_description?: string
  package_weight?: number
  proposed_price: number
  is_fragile?: boolean
  is_express?: boolean
  cargo_category?: string
}

export interface DeliveryCreateRequest extends DeliveryRequest {}

export interface DeliveryUpdateRequest {
  package_description?: string
  package_weight?: number
  proposed_price?: number
  is_fragile?: boolean
  is_express?: boolean
  cargo_category?: string
}

export interface TrackingUpdate {
  lat: number
  lng: number
  timestamp?: string
}

export interface TrackingData {
  lat: number
  lng: number
  timestamp?: string
}

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

export interface Bid {
  id: number
  delivery_id: number
  courier_id: number
  amount: number
  price?: number // Pour la compatibilité avec l'ancien code
  note?: string
  status: "pending" | "accepted" | "rejected"
  created_at: string
  estimated_time?: number
  courier?: Courier & {
    full_name?: string
    profile_picture?: string
    rating_count?: number
    vehicle_type?: string
  }
}

export interface Courier {
  id: number
  user_id: number
  vehicle_type: string
  license_number: string
  is_available: boolean
  current_lat?: number
  current_lng?: number
  rating?: number
  average_rating?: number
  total_deliveries: number
  avatar?: string
  user: User
}

export interface Rating {
  id: number
  rating: number
  comment?: string
  delivery_id: number
  courier_id: number
  created_at: string
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon?: string;
  earned_at?: string;
}

export interface CourierStats {
  averageRating: number;
  deliveriesCompleted: number;
  totalEarnings: number;
  totalDistance: number;
  level: number;
  experience: number;
  nextLevelExperience: number;
  badges: Badge[];
}

// Added FeatherIconName type for better type safety
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

export interface VehicleRecommendation {
  vehicle_type: VehicleType;
  confidence_score: number;
  reasons: string[];
  estimated_efficiency: number;
  cost_analysis: {
    fuel_cost: number;
    maintenance_cost: number;
    total_cost: number;
  };
  environmental_impact: {
    carbon_footprint: number;
    emission_level: string;
  };
}

export interface VehicleUsage {
  id: number;
  courier_vehicle_id: number;
  delivery_id: number;
  distance_km: number;
  fuel_consumed: number;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleStats {
  total_distance: number;
  total_deliveries: number;
  average_efficiency: number;
  maintenance_cost: number;
  fuel_cost: number;
  uptime_percentage: number;
  last_maintenance_date?: string;
  next_maintenance_due?: string;
}

// Request/Response Types
export interface CourierVehicleCreateRequest {
  vehicle_id: number;
  documents?: {
    type: DocumentType;
    document_url: string;
    expiry_date?: string;
  }[];
}

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

// Stats and Analytics Types
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

// === TYPES MANQUANTS POUR LES HOOKS ===

// Types pour l'authentification
export interface LoginCredentials {
  email: string;
  password: string;
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

// Types pour les livraisons avancées
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
    vehicle_type: string;
    profile_picture?: string;
  };
  real_time_updates: boolean;
}

export interface ExpressDelivery extends Delivery {
  express_priority: 'standard' | 'urgent' | 'emergency'
  estimated_pickup_time: string
  guaranteed_delivery_time: string
  express_fee: number
  auto_assignment: boolean
}

export interface DeliveryEstimate {
  estimated_price: number
  estimated_duration: number; // minutes
  estimated_distance: number; // km
  pricing_breakdown: {
    base_price: number;
    distance_fee: number;
    time_fee: number;
    size_fee: number;
    urgency_fee: number;
    total: number;
  };
  vehicle_recommendations: VehicleRecommendation[];
}

// Types KYC
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

// Types utilisateur étendus
export interface UserType {
  client: 'client';
  courier: 'courier';
  business: 'business';
  manager: 'manager';
}

export interface NotificationSettings {
  push_notifications: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  marketing_emails: boolean;
  delivery_updates: boolean;
  delivery_notifications: boolean;
  promotional_notifications: boolean;
  bid_notifications: boolean;
  promotion_alerts: boolean;
  security_alerts: boolean;
}

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

// Profile spécialisé pour les hooks
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

// Missing profile types for services
export interface CourierProfile {
  id: number;
  user_id: number;
  vehicle_type: VehicleType;
  license_plate?: string;
  id_card_number?: string;
  id_card_url?: string;
  driving_license_url?: string;
  insurance_url?: string;
  is_online: boolean;
  last_location_lat?: number;
  last_location_lng?: number;
  last_location_updated?: string;
  created_at: string;
  updated_at?: string;
}

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

// Missing KYC types
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

// Types pour les filtres de livraison
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

// Type for tracking points during delivery
export interface TrackingPoint {
  id: number
  delivery_id: number
  latitude: number
  longitude: number
  accuracy?: number
  speed?: number
  bearing?: number
  timestamp: string
  created_at: string
}

// Courier Earnings and Wallet Types
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

export interface DeliveryEstimate {
  estimated_price: number
  distance_km: number
  estimated_time_minutes: number
  price_breakdown?: any
  applicable_promotions?: Promotion[]
  zone_info?: Zone
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

export interface VehicleCreateRequest {
  type: string
  model: string
  brand?: string
  license_plate: string
  color: string
  capacity: number
  maxWeight?: number
}