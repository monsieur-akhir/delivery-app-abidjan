from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from app.models.transport import Vehicle, CourierVehicle, TransportRule, VehicleUsage
from app.models.user import User
from app.schemas.transport import (
    VehicleCreate, VehicleUpdate,
    CourierVehicleCreate, CourierVehicleUpdate,
    TransportRuleCreate, TransportRuleUpdate,
    VehicleRecommendationRequest,
    VehicleUsageCreate, VehicleUsageUpdate,
    DocumentType
)


def create_vehicle(db: Session, vehicle: VehicleCreate) -> Vehicle:
    """Create a new vehicle"""
    db_vehicle = Vehicle(
        name=vehicle.name,
        type=vehicle.type.value,
        custom_type=vehicle.custom_type,
        license_plate=vehicle.license_plate,
        brand=vehicle.brand,
        model=vehicle.model,
        year=vehicle.year,
        color=vehicle.color,
        max_weight=vehicle.max_weight,
        max_volume=vehicle.max_volume,
        max_distance=vehicle.max_distance,
        photo_url=vehicle.photo_url,
        status=vehicle.status.value,
        is_electric=vehicle.is_electric,
        business_id=vehicle.business_id
    )
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


def get_vehicle(db: Session, vehicle_id: int) -> Optional[Vehicle]:
    """Get a vehicle by ID"""
    return db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()


def get_vehicles(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    vehicle_type: Optional[str] = None,
    status: Optional[str] = None,
    business_id: Optional[int] = None
) -> List[Vehicle]:
    """Get vehicles with optional filters"""
    query = db.query(Vehicle)
    
    if vehicle_type:
        query = query.filter(Vehicle.type == vehicle_type)
    
    if status:
        query = query.filter(Vehicle.status == status)
    
    if business_id:
        query = query.filter(Vehicle.business_id == business_id)
    
    return query.offset(skip).limit(limit).all()


def update_vehicle(db: Session, vehicle_id: int, vehicle: VehicleUpdate) -> Vehicle:
    """Update a vehicle"""
    db_vehicle = get_vehicle(db, vehicle_id)
    
    # Update fields if provided
    update_data = vehicle.dict(exclude_unset=True)
    
    # Convert enum values to strings
    if "type" in update_data and update_data["type"]:
        update_data["type"] = update_data["type"].value
    
    if "status" in update_data and update_data["status"]:
        update_data["status"] = update_data["status"].value
    
    for key, value in update_data.items():
        setattr(db_vehicle, key, value)
    
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


def delete_vehicle(db: Session, vehicle_id: int) -> None:
    """Delete a vehicle"""
    db_vehicle = get_vehicle(db, vehicle_id)
    db.delete(db_vehicle)
    db.commit()


def upload_vehicle_document(db: Session, vehicle_id: int, document_type: DocumentType, document_url: str) -> Vehicle:
    """Upload a document for a vehicle"""
    db_vehicle = get_vehicle(db, vehicle_id)
    
    if document_type == DocumentType.REGISTRATION:
        db_vehicle.registration_document_url = document_url
    elif document_type == DocumentType.INSURANCE:
        db_vehicle.insurance_document_url = document_url
    elif document_type == DocumentType.TECHNICAL_INSPECTION:
        db_vehicle.technical_inspection_url = document_url
    
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


def get_courier_vehicle(db: Session, courier_vehicle_id: int) -> Optional[CourierVehicle]:
    """Get a courier vehicle by ID"""
    return db.query(CourierVehicle).filter(CourierVehicle.id == courier_vehicle_id).first()


def get_courier_vehicles(db: Session, courier_id: int) -> List[CourierVehicle]:
    """Get all vehicles for a courier"""
    return db.query(CourierVehicle).filter(CourierVehicle.courier_id == courier_id).all()


def assign_vehicle_to_courier(db: Session, courier_id: int, vehicle: CourierVehicleCreate) -> CourierVehicle:
    """Assign a vehicle to a courier"""
    # Check if the courier exists
    courier = db.query(User).filter(User.id == courier_id).first()
    if not courier:
        raise ValueError("Courier not found")
    
    # Create a new vehicle if it doesn't exist
    db_vehicle = Vehicle(
        name=f"{vehicle.brand or ''} {vehicle.model or ''}".strip() or f"Vehicle {vehicle.license_plate}",
        type=vehicle.vehicle_type.value,
        license_plate=vehicle.license_plate,
        brand=vehicle.brand,
        model=vehicle.model,
        is_electric=vehicle.is_electric,
        status="active"
    )
    db.add(db_vehicle)
    db.flush()  # Get the vehicle ID without committing
    
    # Check if this is the first vehicle for the courier
    is_primary = not db.query(CourierVehicle).filter(CourierVehicle.courier_id == courier_id).first()
    
    # Create the courier-vehicle association
    db_courier_vehicle = CourierVehicle(
        courier_id=courier_id,
        vehicle_id=db_vehicle.id,
        is_primary=is_primary
    )
    db.add(db_courier_vehicle)
    db.commit()
    db.refresh(db_courier_vehicle)
    return db_courier_vehicle


def update_courier_vehicle(db: Session, courier_vehicle_id: int, vehicle: CourierVehicleUpdate) -> CourierVehicle:
    """Update a courier vehicle"""
    db_courier_vehicle = get_courier_vehicle(db, courier_vehicle_id)
    
    # Update the vehicle
    db_vehicle = db_courier_vehicle.vehicle
    
    if vehicle.license_plate:
        db_vehicle.license_plate = vehicle.license_plate
    
    if vehicle.brand:
        db_vehicle.brand = vehicle.brand
    
    if vehicle.model:
        db_vehicle.model = vehicle.model
    
    if vehicle.is_electric is not None:
        db_vehicle.is_electric = vehicle.is_electric
    
    # Update the vehicle name based on brand and model
    db_vehicle.name = f"{db_vehicle.brand or ''} {db_vehicle.model or ''}".strip() or f"Vehicle {db_vehicle.license_plate}"
    
    db.commit()
    db.refresh(db_courier_vehicle)
    return db_courier_vehicle


def remove_courier_vehicle(db: Session, courier_vehicle_id: int) -> None:
    """Remove a vehicle from a courier"""
    db_courier_vehicle = get_courier_vehicle(db, courier_vehicle_id)
    
    # If this was the primary vehicle, set another one as primary
    if db_courier_vehicle.is_primary:
        # Find another vehicle for this courier
        other_vehicle = db.query(CourierVehicle).filter(
            CourierVehicle.courier_id == db_courier_vehicle.courier_id,
            CourierVehicle.id != courier_vehicle_id
        ).first()
        
        if other_vehicle:
            other_vehicle.is_primary = True
    
    db.delete(db_courier_vehicle)
    db.commit()


def set_primary_vehicle(db: Session, courier_vehicle_id: int) -> CourierVehicle:
    """Set a vehicle as the primary vehicle for a courier"""
    db_courier_vehicle = get_courier_vehicle(db, courier_vehicle_id)
    
    # Reset all vehicles for this courier
    db.query(CourierVehicle).filter(
        CourierVehicle.courier_id == db_courier_vehicle.courier_id
    ).update({"is_primary": False})
    
    # Set this vehicle as primary
    db_courier_vehicle.is_primary = True
    
    db.commit()
    db.refresh(db_courier_vehicle)
    return db_courier_vehicle


def upload_courier_vehicle_document(
    db: Session, 
    courier_vehicle_id: int, 
    document_type: DocumentType, 
    document_url: str
) -> CourierVehicle:
    """Upload a document for a courier vehicle"""
    db_courier_vehicle = get_courier_vehicle(db, courier_vehicle_id)
    
    if document_type == DocumentType.REGISTRATION:
        db_courier_vehicle.registration_document_url = document_url
    elif document_type == DocumentType.INSURANCE:
        db_courier_vehicle.insurance_document_url = document_url
    elif document_type == DocumentType.TECHNICAL_INSPECTION:
        db_courier_vehicle.technical_inspection_url = document_url
    
    db.commit()
    db.refresh(db_courier_vehicle)
    return db_courier_vehicle


def create_transport_rule(db: Session, rule: TransportRuleCreate) -> TransportRule:
    """Create a new transport rule"""
    db_rule = TransportRule(
        vehicle_id=rule.vehicle_id,
        cargo_category=rule.cargo_category.value,
        custom_category=rule.custom_category,
        min_distance=rule.min_distance,
        max_distance=rule.max_distance,
        min_weight=rule.min_weight,
        max_weight=rule.max_weight,
        min_volume=rule.min_volume,
        max_volume=rule.max_volume,
        priority=rule.priority,
        price_multiplier=rule.price_multiplier,
        is_active=rule.is_active
    )
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule


def get_transport_rule(db: Session, rule_id: int) -> Optional[TransportRule]:
    """Get a transport rule by ID"""
    return db.query(TransportRule).filter(TransportRule.id == rule_id).first()


def get_transport_rules(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    vehicle_id: Optional[int] = None,
    cargo_category: Optional[str] = None,
    is_active: Optional[bool] = None
) -> List[TransportRule]:
    """Get transport rules with optional filters"""
    query = db.query(TransportRule)
    
    if vehicle_id:
        query = query.filter(TransportRule.vehicle_id == vehicle_id)
    
    if cargo_category:
        query = query.filter(TransportRule.cargo_category == cargo_category)
    
    if is_active is not None:
        query = query.filter(TransportRule.is_active == is_active)
    
    return query.offset(skip).limit(limit).all()


def update_transport_rule(db: Session, rule_id: int, rule: TransportRuleUpdate) -> TransportRule:
    """Update a transport rule"""
    db_rule = get_transport_rule(db, rule_id)
    
    # Update fields if provided
    update_data = rule.dict(exclude_unset=True)
    
    # Convert enum values to strings
    if "cargo_category" in update_data and update_data["cargo_category"]:
        update_data["cargo_category"] = update_data["cargo_category"].value
    
    for key, value in update_data.items():
        setattr(db_rule, key, value)
    
    db.commit()
    db.refresh(db_rule)
    return db_rule


def delete_transport_rule(db: Session, rule_id: int) -> None:
    """Delete a transport rule"""
    db_rule = get_transport_rule(db, rule_id)
    db.delete(db_rule)
    db.commit()


def get_vehicle_recommendation(db: Session, request: VehicleRecommendationRequest) -> Dict[str, Any]:
    """Get a vehicle recommendation based on delivery requirements"""
    # Get all active vehicles
    vehicles = db.query(Vehicle).filter(Vehicle.status == "active").all()
    
    if not vehicles:
        raise ValueError("No active vehicles available")
    
    # Get all active transport rules
    rules = db.query(TransportRule).filter(
        TransportRule.is_active == True,
        TransportRule.cargo_category == request.cargo_category.value
    ).all()
    
    # If no specific rules for this cargo category, get all active rules
    if not rules:
        rules = db.query(TransportRule).filter(TransportRule.is_active == True).all()
    
    # Filter rules based on delivery requirements
    matching_rules = []
    for rule in rules:
        # Check distance constraints
        if (rule.min_distance is not None and request.distance < rule.min_distance) or \
           (rule.max_distance is not None and request.distance > rule.max_distance):
            continue
        
        # Check weight constraints if provided
        if request.weight is not None and (
            (rule.min_weight is not None and request.weight < rule.min_weight) or
            (rule.max_weight is not None and request.weight > rule.max_weight)
        ):
            continue
        
        # Check volume constraints if provided
        if request.volume is not None and (
            (rule.min_volume is not None and request.volume < rule.min_volume) or
            (rule.max_volume is not None and request.volume > rule.max_volume)
        ):
            continue
        
        matching_rules.append(rule)
    
    # If no matching rules, use all vehicles
    if not matching_rules:
        # Default recommendation: use the first vehicle
        recommended_vehicle = vehicles[0]
        price_multiplier = 1.0
        reason = "No specific transport rules match your requirements. Using default vehicle."
        
        # Prepare alternatives
        alternatives = [
            {
                "id": v.id,
                "type": v.type,
                "name": v.name,
                "price_multiplier": 1.0
            }
            for v in vehicles[1:3]  # Limit to 2 alternatives
        ]
    else:
        # Sort matching rules by priority (descending)
        matching_rules.sort(key=lambda r: r.priority, reverse=True)
        
        # Get the highest priority rule
        top_rule = matching_rules[0]
        
        # Get the vehicle for this rule
        recommended_vehicle = db.query(Vehicle).filter(Vehicle.id == top_rule.vehicle_id).first()
        price_multiplier = top_rule.price_multiplier
        
        # Prepare reason
        reason = f"This vehicle is recommended based on your {request.cargo_category.value} cargo"
        if request.is_fragile:
            reason += ", fragile items"
        if request.is_urgent:
            reason += ", urgent delivery"
            # Increase price for urgent deliveries
            price_multiplier *= 1.2
        
        # Adjust for weather conditions if provided
        if request.weather_condition:
            # Weather codes: 2xx (Thunderstorm), 5xx (Rain), 6xx (Snow), 7xx (Atmosphere)
            if request.weather_condition >= 200 and request.weather_condition < 800:
                reason += f", and current weather conditions (code: {request.weather_condition})"
                # Increase price for bad weather
                price_multiplier *= 1.15
        
        # Prepare alternatives from other matching rules
        alternatives = []
        for rule in matching_rules[1:3]:  # Limit to 2 alternatives
            vehicle = db.query(Vehicle).filter(Vehicle.id == rule.vehicle_id).first()
            if vehicle and vehicle.id != recommended_vehicle.id:
                alternatives.append({
                    "id": vehicle.id,
                    "type": vehicle.type,
                    "name": vehicle.name,
                    "price_multiplier": rule.price_multiplier
                })
    
    return {
        "recommended_vehicle": {
            "id": recommended_vehicle.id,
            "type": recommended_vehicle.type,
            "name": recommended_vehicle.name
        },
        "reason": reason,
        "price_multiplier": price_multiplier,
        "alternatives": alternatives
    }


def create_vehicle_usage(db: Session, usage: VehicleUsageCreate) -> VehicleUsage:
    """Create a new vehicle usage record"""
    db_usage = VehicleUsage(
        courier_vehicle_id=usage.courier_vehicle_id,
        delivery_id=usage.delivery_id,
        start_time=usage.start_time,
        end_time=usage.end_time,
        distance_traveled=usage.distance_traveled,
        fuel_consumed=usage.fuel_consumed,
        co2_emissions=usage.co2_emissions
    )
    db.add(db_usage)
    db.commit()
    db.refresh(db_usage)
    return db_usage


def get_vehicle_usage(db: Session, usage_id: int) -> Optional[VehicleUsage]:
    """Get a vehicle usage record by ID"""
    return db.query(VehicleUsage).filter(VehicleUsage.id == usage_id).first()


def update_vehicle_usage(db: Session, usage_id: int, usage: VehicleUsageUpdate) -> VehicleUsage:
    """Update a vehicle usage record"""
    db_usage = get_vehicle_usage(db, usage_id)
    
    # Update fields if provided
    update_data = usage.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_usage, key, value)
    
    db.commit()
    db.refresh(db_usage)
    return db_usage


def get_vehicle_usage_stats(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    vehicle_type: Optional[str] = None
) -> Dict[str, Any]:
    """Get vehicle usage statistics"""
    # Default to last 30 days if no dates provided
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)
    
    if not end_date:
        end_date = datetime.now()
    
    # Base query
    query = db.query(
        Vehicle.type,
        func.count(VehicleUsage.id).label("usage_count"),
        func.sum(VehicleUsage.distance_traveled).label("total_distance"),
        func.avg(VehicleUsage.distance_traveled).label("avg_distance_per_trip")
    ).join(
        CourierVehicle, CourierVehicle.vehicle_id == Vehicle.id
    ).join(
        VehicleUsage, VehicleUsage.courier_vehicle_id == CourierVehicle.id
    ).filter(
        VehicleUsage.start_time >= start_date,
        VehicleUsage.start_time <= end_date
    )
    
    if vehicle_type:
        query = query.filter(Vehicle.type == vehicle_type)
    
    # Group by vehicle type
    query = query.group_by(Vehicle.type)
    
    # Execute query
    results = query.all()
    
    # Format results
    stats = {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "by_vehicle_type": [
            {
                "type": result.type,
                "usage_count": result.usage_count,
                "total_distance": result.total_distance or 0,
                "avg_distance_per_trip": result.avg_distance_per_trip or 0
            }
            for result in results
        ]
    }
    
    # Calculate totals
    total_usage = sum(item["usage_count"] for item in stats["by_vehicle_type"])
    total_distance = sum(item["total_distance"] for item in stats["by_vehicle_type"])
    
    stats["totals"] = {
        "total_usage": total_usage,
        "total_distance": total_distance,
        "avg_distance_per_trip": total_distance / total_usage if total_usage > 0 else 0
    }
    
    return stats


def get_vehicle_performance_stats(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    vehicle_type: Optional[str] = None
) -> Dict[str, Any]:
    """Get vehicle performance statistics"""
    # Default to last 30 days if no dates provided
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)
    
    if not end_date:
        end_date = datetime.now()
    
    # Base query
    query = db.query(
        Vehicle.id,
        Vehicle.name,
        Vehicle.type,
        func.count(VehicleUsage.id).label("usage_count"),
        func.sum(VehicleUsage.distance_traveled).label("total_distance"),
        func.avg(VehicleUsage.distance_traveled).label("avg_distance_per_trip"),
        func.sum(VehicleUsage.fuel_consumed).label("total_fuel_consumed"),
        func.avg(VehicleUsage.fuel_consumed / VehicleUsage.distance_traveled).label("avg_fuel_efficiency")
    ).join(
        CourierVehicle, CourierVehicle.vehicle_id == Vehicle.id
    ).join(
        VehicleUsage, VehicleUsage.courier_vehicle_id == CourierVehicle.id
    ).filter(
        VehicleUsage.start_time >= start_date,
        VehicleUsage.start_time <= end_date
    )
    
    if vehicle_type:
        query = query.filter(Vehicle.type == vehicle_type)
    
    # Group by vehicle
    query = query.group_by(Vehicle.id, Vehicle.name, Vehicle.type)
    
    # Execute query
    results = query.all()
    
    # Format results
    stats = {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "vehicles": [
            {
                "id": result.id,
                "name": result.name,
                "type": result.type,
                "usage_count": result.usage_count,
                "total_distance": result.total_distance or 0,
                "avg_distance_per_trip": result.avg_distance_per_trip or 0,
                "total_fuel_consumed": result.total_fuel_consumed or 0,
                "avg_fuel_efficiency": result.avg_fuel_efficiency or 0
            }
            for result in results
        ]
    }
    
    # Calculate averages by vehicle type
    type_stats = {}
    for vehicle in stats["vehicles"]:
        v_type = vehicle["type"]
        if v_type not in type_stats:
            type_stats[v_type] = {
                "count": 0,
                "total_distance": 0,
                "total_usage": 0,
                "total_fuel": 0
            }
        
        type_stats[v_type]["count"] += 1
        type_stats[v_type]["total_distance"] += vehicle["total_distance"]
        type_stats[v_type]["total_usage"] += vehicle["usage_count"]
        type_stats[v_type]["total_fuel"] += vehicle["total_fuel_consumed"]
    
    stats["by_vehicle_type"] = [
        {
            "type": v_type,
            "vehicle_count": data["count"],
            "total_usage": data["total_usage"],
            "total_distance": data["total_distance"],
            "avg_distance_per_vehicle": data["total_distance"] / data["count"] if data["count"] > 0 else 0,
            "total_fuel_consumed": data["total_fuel"],
            "avg_fuel_efficiency": data["total_fuel"] / data["total_distance"] if data["total_distance"] > 0 else 0
        }
        for v_type, data in type_stats.items()
    ]
    
    return stats


def get_vehicle_environmental_stats(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    vehicle_type: Optional[str] = None
) -> Dict[str, Any]:
    """Get vehicle environmental statistics"""
    # Default to last 30 days if no dates provided
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)
    
    if not end_date:
        end_date = datetime.now()
    
    # Base query for CO2 emissions
    query = db.query(
        Vehicle.type,
        Vehicle.is_electric,
        func.sum(VehicleUsage.co2_emissions).label("total_co2"),
        func.sum(VehicleUsage.distance_traveled).label("total_distance"),
        func.avg(VehicleUsage.co2_emissions / VehicleUsage.distance_traveled).label("avg_co2_per_km")
    ).join(
        CourierVehicle, CourierVehicle.vehicle_id == Vehicle.id
    ).join(
        VehicleUsage, VehicleUsage.courier_vehicle_id == CourierVehicle.id
    ).filter(
        VehicleUsage.start_time >= start_date,
        VehicleUsage.start_time <= end_date
    )
    
    if vehicle_type:
        query = query.filter(Vehicle.type == vehicle_type)
    
    # Group by vehicle type and electric status
    query = query.group_by(Vehicle.type, Vehicle.is_electric)
    
    # Execute query
    results = query.all()
    
    # Format results
    stats = {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "emissions": [
            {
                "type": result.type,
                "is_electric": result.is_electric,
                "total_co2": result.total_co2 or 0,
                "total_distance": result.total_distance or 0,
                "avg_co2_per_km": result.avg_co2_per_km or 0
            }
            for result in results
        ]
    }
    
    # Calculate electric vs non-electric stats
    electric_stats = {
        "total_distance": sum(item["total_distance"] for item in stats["emissions"] if item["is_electric"]),
        "total_co2": sum(item["total_co2"] for item in stats["emissions"] if item["is_electric"])
    }
    
    non_electric_stats = {
        "total_distance": sum(item["total_distance"] for item in stats["emissions"] if not item["is_electric"]),
        "total_co2": sum(item["total_co2"] for item in stats["emissions"] if not item["is_electric"])
    }
    
    stats["comparison"] = {
        "electric": {
            "total_distance": electric_stats["total_distance"],
            "total_co2": electric_stats["total_co2"],
            "avg_co2_per_km": electric_stats["total_co2"] / electric_stats["total_distance"] if electric_stats["total_distance"] > 0 else 0
        },
        "non_electric": {
            "total_distance": non_electric_stats["total_distance"],
            "total_co2": non_electric_stats["total_co2"],
            "avg_co2_per_km": non_electric_stats["total_co2"] / non_electric_stats["total_distance"] if non_electric_stats["total_distance"] > 0 else 0
        }
    }
    
    # Calculate CO2 savings
    if non_electric_stats["total_distance"] > 0 and electric_stats["total_distance"] > 0:
        non_electric_co2_per_km = non_electric_stats["total_co2"] / non_electric_stats["total_distance"]
        potential_co2 = electric_stats["total_distance"] * non_electric_co2_per_km
        actual_co2 = electric_stats["total_co2"]
        co2_savings = potential_co2 - actual_co2
        
        stats["co2_savings"] = {
            "total": co2_savings,
            "percentage": (co2_savings / potential_co2) * 100 if potential_co2 > 0 else 0
        }
    
    return stats

class TransportService:
    @staticmethod
    def create_vehicle(db, vehicle):
        from app.services import transport_service
        return transport_service.create_vehicle(db, vehicle)

    @staticmethod
    def get_vehicle(db, vehicle_id):
        from app.services import transport_service
        return transport_service.get_vehicle(db, vehicle_id)

    @staticmethod
    def get_vehicle_recommendation(db, request):
        from app.services import transport_service
        return transport_service.get_vehicle_recommendation(db, request)

    @staticmethod
    def assign_vehicle_to_courier(db, courier_id, vehicle):
        from app.services import transport_service
        return transport_service.assign_vehicle_to_courier(db, courier_id, vehicle)

    @staticmethod
    def upload_vehicle_document(db, vehicle_id, document_type, document_url):
        from app.services import transport_service
        return transport_service.upload_vehicle_document(db, vehicle_id, document_type, document_url)

    @staticmethod
    def create_vehicle_usage(db, usage):
        from app.services import transport_service
        return transport_service.create_vehicle_usage(db, usage)

    @staticmethod
    def get_vehicle_usage_stats(db, start_date=None, end_date=None, vehicle_type=None):
        from app.services import transport_service
        return transport_service.get_vehicle_usage_stats(db, start_date, end_date, vehicle_type)

    @staticmethod
    def get_vehicle_performance_stats(db, start_date=None, end_date=None, vehicle_type=None):
        from app.services import transport_service
        return transport_service.get_vehicle_performance_stats(db, start_date, end_date, vehicle_type)

    @staticmethod
    def get_vehicle_environmental_stats(db, start_date=None, end_date=None, vehicle_type=None):
        from app.services import transport_service
        return transport_service.get_vehicle_environmental_stats(db, start_date, end_date, vehicle_type)

