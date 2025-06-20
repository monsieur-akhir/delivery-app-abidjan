from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..models.transport import Vehicle, CourierVehicle
from ..models.user import User, UserRole
from ..schemas.business import BusinessVehicleCreate, BusinessVehicleUpdate
from ..core.exceptions import NotFoundError, ForbiddenError

def create_business_vehicle(db: Session, business_id: int, vehicle_data: BusinessVehicleCreate) -> Vehicle:
    """
    Créer un nouveau véhicule pour l'entreprise
    """
    # Vérifier que la plaque n'existe pas déjà
    existing_vehicle = db.query(Vehicle).filter(
        Vehicle.license_plate == vehicle_data.license_plate
    ).first()
    
    if existing_vehicle:
        raise ForbiddenError("Un véhicule avec cette plaque d'immatriculation existe déjà")
    
    vehicle = Vehicle(
        business_id=business_id,
        **vehicle_data.dict()
    )
    
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    
    return vehicle

def get_business_vehicles(db: Session, business_id: int) -> List[Vehicle]:
    """
    Récupérer tous les véhicules d'une entreprise
    """
    return db.query(Vehicle).filter(
        Vehicle.business_id == business_id
    ).all()

def get_business_vehicle(db: Session, business_id: int, vehicle_id: int) -> Vehicle:
    """
    Récupérer un véhicule spécifique d'une entreprise
    """
    vehicle = db.query(Vehicle).filter(
        and_(
            Vehicle.id == vehicle_id,
            Vehicle.business_id == business_id
        )
    ).first()
    
    if not vehicle:
        raise NotFoundError("Véhicule non trouvé")
    
    return vehicle

def update_business_vehicle(
    db: Session, 
    business_id: int, 
    vehicle_id: int, 
    vehicle_data: BusinessVehicleUpdate
) -> Vehicle:
    """
    Mettre à jour un véhicule d'entreprise
    """
    vehicle = get_business_vehicle(db, business_id, vehicle_id)
    
    # Vérifier la plaque si elle est modifiée
    if vehicle_data.license_plate and vehicle_data.license_plate != vehicle.license_plate:
        existing_vehicle = db.query(Vehicle).filter(
            and_(
                Vehicle.license_plate == vehicle_data.license_plate,
                Vehicle.id != vehicle_id
            )
        ).first()
        
        if existing_vehicle:
            raise ForbiddenError("Un véhicule avec cette plaque d'immatriculation existe déjà")
    
    # Mettre à jour les champs
    for field, value in vehicle_data.dict(exclude_unset=True).items():
        setattr(vehicle, field, value)
    
    db.commit()
    db.refresh(vehicle)
    
    return vehicle

def delete_business_vehicle(db: Session, business_id: int, vehicle_id: int) -> bool:
    """
    Supprimer un véhicule d'entreprise
    """
    vehicle = get_business_vehicle(db, business_id, vehicle_id)
    
    # Vérifier qu'aucun coursier n'utilise ce véhicule
    active_assignments = db.query(CourierVehicle).filter(
        CourierVehicle.vehicle_id == vehicle_id
    ).count()
    
    if active_assignments > 0:
        raise ForbiddenError("Ce véhicule est encore assigné à des coursiers")
    
    db.delete(vehicle)
    db.commit()
    
    return True

def assign_vehicle_to_courier(db: Session, business_id: int, vehicle_id: int, courier_id: int) -> CourierVehicle:
    """
    Assigner un véhicule à un coursier
    """
    vehicle = get_business_vehicle(db, business_id, vehicle_id)
    
    # Vérifier que le coursier existe
    courier = db.query(User).filter(
        and_(
            User.id == courier_id,
            User.role == UserRole.courier
        )
    ).first()
    
    if not courier:
        raise NotFoundError("Coursier non trouvé")
    
    # Vérifier qu'il n'y a pas déjà une assignation active
    existing_assignment = db.query(CourierVehicle).filter(
        and_(
            CourierVehicle.courier_id == courier_id,
            CourierVehicle.vehicle_id == vehicle_id,
            CourierVehicle.status == 'active'
        )
    ).first()
    
    if existing_assignment:
        raise ForbiddenError("Ce véhicule est déjà assigné à ce coursier")
    
    assignment = CourierVehicle(
        courier_id=courier_id,
        vehicle_id=vehicle_id,
        status='active'
    )
    
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    
    return assignment

def get_vehicle_assignments(db: Session, business_id: int, vehicle_id: int) -> List[CourierVehicle]:
    """
    Récupérer les assignations d'un véhicule
    """
    vehicle = get_business_vehicle(db, business_id, vehicle_id)
    
    return db.query(CourierVehicle).filter(
        CourierVehicle.vehicle_id == vehicle_id
    ).all()
