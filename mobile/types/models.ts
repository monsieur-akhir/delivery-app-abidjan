import { ReactNode } from "react"
import { Double } from "react-native/Libraries/Types/CodegenTypes"

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
  id: string
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
  deliveryId: string
  deliveryStatus: string
  deliveryType: string
  createdAt: string
  updatedAt: string
  deliveryPrice: number
  id: string
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
  id: string
  delivery_id: string
  user_id: string
  message: string
  timestamp: string
  createdAt: string
  userId: string
  userName: string
  userRole: string
  userAvatar?: string
  // Add other properties as needed
}

export interface EarningsDistribution {
  id: string
  delivery_id: string
  user_id: string
  amount: number
  percentage: number
  // Add other properties as needed
}

export type CollaboratorRole = "primary" | "secondary" | "support"
export type UserRole = "client" | "coursier" | "vendeur" | "collaborator"
export interface Collaborator {
  courierName: any
  profilePicture: any
  id: string
  user_id: string
  delivery_id: string
  role: CollaboratorRole
  sharePercentage: number
  status: string
  notes?: string
  joined_at: string
}

export interface Vehicle {
  id: string
  name: string
  licensePlate?: string
  license_plate?: string
  maxWeight?: number
  max_weight?: number
  maxDistance?: number
  isElectric?: boolean
  type?: "car" | "motorcycle" | "bicycle" | "truck"
  status?: "active" | "maintenance" | "inactive" | "pending_verification"
  customType?: string
}

export interface VehicleDocument {
  id: string
  // Add other properties as needed
}

// Déprécié : Utilisez l'interface Weather à la place
/*
export interface WeatherData {
  current: {
    temperature: number
    condition: string
    humidity: number
    wind_speed: number
  }
  forecast?: {
    forecastday: {
      date: string
      day: {
        maxtemp_c: number
        mintemp_c: number
        condition: string
      }
    }[]
  }
}
*/
export enum VehicleType {
  BICYCLE = "bicycle",
  MOTORCYCLE = "motorcycle",
  CAR = "car",
  VAN = "van",
  TRUCK = "truck",
  ON_FOOT = "on_foot",
  CUSTOM = "custom",
  SCOOTER = "scooter",
  PICKUP = "pickup",
  KIA_TRUCK = "kia_truck",
  MOVING_TRUCK = "moving_truck",
}

export interface MaintenanceRecord {
  id: string
  // Add other properties as needed
}

export interface TransportRule {
  id: string
  name: string
  description: string
  // Add other properties as needed
}

export interface UserProfile {
  user_id: string
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
  id: string
  user_id: string
  title: string | null
  message: string | null
  read: boolean
  date: string | null
  data?: {
    type?: string | number
    deliveryId?: string
    paymentId?: string
    // Other data properties...
  }
  // Other existing properties...
}

// This is a legacy interface, renamed to avoid conflicts
export interface CollaboratorOld {
  id: string
  user_id: string
  delivery_id: string
  role: string
  status: string
  notes?: string // Add this property
  // Other existing properties...
}

export interface PendingOperation {
  id: string
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
  delivery_id?: string // Added to support tracking data
  status?: DeliveryStatus // Added to support status updates
  timestamp?: Date | string // Make timestamp optional since it can be added automatically
}

export interface ProfileUpdateData {
  user_id: string
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

export interface TrackingData {
  delivery_id: string
  latitude: number
  longitude: number
  status?: DeliveryStatus
  timestamp: string
  notes?: string
}

export interface SupportRequestData {
  user_id: string
  subject: string
  message: string
  type: string
  related_id?: string
  attachments?: string[]
}

export enum LanguageCode {
  EN = "en",
  FR = "fr",
  ES = "es",
}

export type DeliveryStatus =
  | "pending"
  | "accepted"
  | "picked_up"
  | "in_progress"
  | "delivered"
  | "completed"
  | "cancelled"
  | "bidding"

export interface Delivery {
  is_paid: any
  payment_method: any
  price: number | undefined
  pickup_location: ReactNode
  delivery_location: ReactNode
  final_price: number
  id: string
  user_id: string
  user_name: string
  user_phone: string
  user_email: string
  user?: User
  client_id?: string
  client?: User
  delivery_id?: string
  delivery_type?: string
  delivery_name?: string
  delivery_phone?: string
  delivery_email?: string
  courier_id?: string
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
  id: string
  name: string
  email: string
  phone?: string
  role?: string // Add role property to match backend User model
  status?: "online" | "offline"; // Added status property
  profile_image?: string
  created_at: string
  updated_at: string
  address?: string
  city?: string
  country?: string
  commune?: string
  vehicle_type?: string
  license_plate?: string
  business_name?: string
  business_address?: string
  profile_picture?: string
  full_name?: string
  is_online?: boolean;
}

export interface Merchant {
  business_name: string | undefined
  category: string | undefined
  logo_url: any
  id: string
  name: string
  logo: string
  cover_image?: string
  image_url?: string
  description: string
  address: string
  commune: string
  lat: number
  lng: number
  categories: string[]
  rating: number
  review_count: number
  is_open: boolean
  opening_hours: string
  phone?: string
  website?: string
  social_media?: {
    facebook?: string
    instagram?: string
    twitter?: string
  }
  created_at: string
  updated_at: string
  featured?: boolean
  promotion?: string
  delivery_time?: string
}
export interface DeliveryRequest {
  pickup_address: string
  pickup_lat: number
  pickup_lng: number
  delivery_address: string
  delivery_lat: number
  delivery_lng: number
  description?: string
  package_size?: string
  is_fragile?: boolean
  is_urgent?: boolean
  proposed_price?: number
  actual_price?: number
  status?: DeliveryStatus
  scheduled_pickup_time?: string
  notes?: string
  cargo_category?: string // Added to support cargo categories
  required_vehicle_type?: string // Added to support required vehicle types     
  delivery_id?: string // Added to support delivery ID
  delivery_commune?: string // Added to support delivery commune
  pickup_commune?: string // Added to support pickup commune
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
  id: string
  delivery_id: string
  courier_id: string
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
  id: string
  name: string
  phone: string
  email: string
  photo_url?: string
  profile_picture?: string // Added for TrackDeliveryScreen
  full_name?: string      // Added for TrackDeliveryScreen
  rating?: number
  rating_count?: number   // Added for TrackDeliveryScreen
  total_deliveries?: number
  vehicle_type?: string
  license_plate?: string
  commune?: string
  is_available?: boolean
  created_at: string
  updated_at: string
}

export interface Rating {
  id: string
  rating: number
  comment?: string
  delivery_id: string
  courier_id: string
  created_at: string
}

export interface Badge {
  id: string;
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