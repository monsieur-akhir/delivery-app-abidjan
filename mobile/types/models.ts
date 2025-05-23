// Ajouter ces types au fichier existant

export type VehicleType =
  | "scooter"
  | "bicycle"
  | "motorcycle"
  | "van"
  | "pickup"
  | "kia_truck"
  | "moving_truck"
  | "custom"

export type CargoCategory =
  | "documents"
  | "small_packages"
  | "medium_packages"
  | "large_packages"
  | "fragile"
  | "food"
  | "electronics"
  | "furniture"
  | "appliances"
  | "construction"
  | "custom"

export interface CourierVehicle {
  id: number
  courier_id: number
  vehicle_type: VehicleType
  license_plate: string
  brand?: string
  model?: string
  is_electric: boolean
  is_primary: boolean
  registration_document_url?: string
  insurance_document_url?: string
  technical_inspection_url?: string
  created_at: string
  updated_at: string
}

export interface TransportRule {
  id: number
  vehicle_id: number
  vehicle: {
    id: number
    name: string
    type: VehicleType
  }
  cargo_category: CargoCategory
  custom_category?: string
  min_distance?: number
  max_distance?: number
  min_weight?: number
  max_weight?: number
  min_volume?: number
  max_volume?: number
  priority: number
  price_multiplier: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface VehicleRecommendation {
  recommended_vehicle: {
    id: number
    type: VehicleType
    name: string
  }
  reason: string
  price_multiplier: number
  alternatives: Array<{
    id: number
    type: VehicleType
    name: string
    price_multiplier: number
  }>
}
