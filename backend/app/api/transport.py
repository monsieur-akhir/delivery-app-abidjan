from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.core.dependencies import get_current_user, get_current_active_user, get_current_manager
from app.models.user import User
from app.schemas.transport import (
    Vehicle, VehicleCreate, VehicleUpdate,
    CourierVehicle, CourierVehicleCreate, CourierVehicleUpdate,
    TransportRule, TransportRuleCreate, TransportRuleUpdate,
    VehicleRecommendationRequest, VehicleRecommendation,
    VehicleUsage, VehicleUsageCreate, VehicleUsageUpdate,
    DocumentUpload, VehicleType, CargoCategory, VehicleStatus, DocumentType
)
from app.services.transport_service import (
    create_vehicle, get_vehicle, get_vehicles, update_vehicle, delete_vehicle,
    get_courier_vehicle, get_courier_vehicles, assign_vehicle_to_courier, update_courier_vehicle, remove_courier_vehicle, set_primary_vehicle,
    create_transport_rule, get_transport_rule, get_transport_rules, update_transport_rule, delete_transport_rule,
    get_vehicle_recommendation,
    create_vehicle_usage, get_vehicle_usage, update_vehicle_usage,
    upload_vehicle_document, upload_courier_vehicle_document,
    get_vehicle_usage_stats, get_vehicle_performance_stats, get_vehicle_environmental_stats
)
from app.services.storage import upload_file

router = APIRouter(tags=["transport"])

# Vehicle endpoints
@router.post("/vehicles", response_model=Vehicle)
def create_vehicle_endpoint(
    vehicle: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    return create_vehicle(db=db, vehicle=vehicle)


@router.get("/vehicles/{vehicle_id}", response_model=Vehicle)
def get_vehicle_endpoint(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    vehicle = get_vehicle(db=db, vehicle_id=vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.get("/vehicles", response_model=List[Vehicle])
def get_vehicles_endpoint(
    skip: int = 0,
    limit: int = 100,
    vehicle_type: Optional[VehicleType] = None,
    status: Optional[VehicleStatus] = None,
    business_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return get_vehicles(
        db=db, 
        skip=skip, 
        limit=limit, 
        vehicle_type=vehicle_type, 
        status=status, 
        business_id=business_id
    )


@router.put("/vehicles/{vehicle_id}", response_model=Vehicle)
def update_vehicle_endpoint(
    vehicle_id: int,
    vehicle: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    db_vehicle = get_vehicle(db=db, vehicle_id=vehicle_id)
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return update_vehicle(db=db, vehicle_id=vehicle_id, vehicle=vehicle)


@router.delete("/vehicles/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle_endpoint(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    db_vehicle = get_vehicle(db=db, vehicle_id=vehicle_id)
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    delete_vehicle(db=db, vehicle_id=vehicle_id)
    return {"detail": "Vehicle deleted successfully"}


@router.post("/vehicles/{vehicle_id}/documents", response_model=Vehicle)
async def upload_vehicle_document_endpoint(
    vehicle_id: int,
    document_type: DocumentType,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    db_vehicle = get_vehicle(db=db, vehicle_id=vehicle_id)
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Upload file to storage
    folder = f"vehicles/{vehicle_id}/{document_type.value}"
    file_url = await upload_file(file=file, folder=folder)
    
    if not file_url:
        raise HTTPException(status_code=500, detail="Failed to upload file")
    
    # Update vehicle with document URL
    return upload_vehicle_document(db=db, vehicle_id=vehicle_id, document_type=document_type, document_url=file_url)


# Courier Vehicle endpoints
@router.get("/courier/{courier_id}/vehicles", response_model=List[CourierVehicle])
def get_courier_vehicles_endpoint(
    courier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if the user is the courier or a manager
    if current_user.id != courier_id and current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Not authorized to access this resource")
    
    return get_courier_vehicles(db=db, courier_id=courier_id)


@router.post("/courier/{courier_id}/vehicles", response_model=CourierVehicle)
def assign_vehicle_to_courier_endpoint(
    courier_id: int,
    vehicle: CourierVehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if the user is the courier or a manager
    if current_user.id != courier_id and current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Not authorized to access this resource")
    
    return assign_vehicle_to_courier(db=db, courier_id=courier_id, vehicle=vehicle)


@router.put("/courier/vehicles/{courier_vehicle_id}", response_model=CourierVehicle)
def update_courier_vehicle_endpoint(
    courier_vehicle_id: int,
    vehicle: CourierVehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get the courier vehicle
    db_courier_vehicle = get_courier_vehicle(db=db, courier_vehicle_id=courier_vehicle_id)
    if not db_courier_vehicle:
        raise HTTPException(status_code=404, detail="Courier vehicle not found")
    
    # Check if the user is the courier or a manager
    if current_user.id != db_courier_vehicle.courier_id and current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Not authorized to access this resource")
    
    return update_courier_vehicle(db=db, courier_vehicle_id=courier_vehicle_id, vehicle=vehicle)


@router.delete("/courier/vehicles/{courier_vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_courier_vehicle_endpoint(
    courier_vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get the courier vehicle
    db_courier_vehicle = get_courier_vehicle(db=db, courier_vehicle_id=courier_vehicle_id)
    if not db_courier_vehicle:
        raise HTTPException(status_code=404, detail="Courier vehicle not found")
    
    # Check if the user is the courier or a manager
    if current_user.id != db_courier_vehicle.courier_id and current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Not authorized to access this resource")
    
    remove_courier_vehicle(db=db, courier_vehicle_id=courier_vehicle_id)
    return {"detail": "Courier vehicle removed successfully"}


@router.put("/courier/vehicles/{courier_vehicle_id}/primary", response_model=CourierVehicle)
def set_primary_vehicle_endpoint(
    courier_vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get the courier vehicle
    db_courier_vehicle = get_courier_vehicle(db=db, courier_vehicle_id=courier_vehicle_id)
    if not db_courier_vehicle:
        raise HTTPException(status_code=404, detail="Courier vehicle not found")
    
    # Check if the user is the courier or a manager
    if current_user.id != db_courier_vehicle.courier_id and current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Not authorized to access this resource")
    
    return set_primary_vehicle(db=db, courier_vehicle_id=courier_vehicle_id)


@router.post("/courier/vehicles/{courier_vehicle_id}/documents", response_model=CourierVehicle)
async def upload_courier_vehicle_document_endpoint(
    courier_vehicle_id: int,
    document_type: DocumentType,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get the courier vehicle
    db_courier_vehicle = get_courier_vehicle(db=db, courier_vehicle_id=courier_vehicle_id)
    if not db_courier_vehicle:
        raise HTTPException(status_code=404, detail="Courier vehicle not found")
    
    # Check if the user is the courier or a manager
    if current_user.id != db_courier_vehicle.courier_id and current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Not authorized to access this resource")
    
    # Upload file to storage
    folder = f"courier_vehicles/{courier_vehicle_id}/{document_type.value}"
    file_url = await upload_file(file=file, folder=folder)
    
    if not file_url:
        raise HTTPException(status_code=500, detail="Failed to upload file")
    
    # Update courier vehicle with document URL
    return upload_courier_vehicle_document(db=db, courier_vehicle_id=courier_vehicle_id, document_type=document_type, document_url=file_url)


# Transport Rule endpoints
@router.post("/rules", response_model=TransportRule)
def create_transport_rule_endpoint(
    rule: TransportRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    return create_transport_rule(db=db, rule=rule)


@router.get("/rules/{rule_id}", response_model=TransportRule)
def get_transport_rule_endpoint(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    rule = get_transport_rule(db=db, rule_id=rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Transport rule not found")
    return rule


@router.get("/rules", response_model=List[TransportRule])
def get_transport_rules_endpoint(
    skip: int = 0,
    limit: int = 100,
    vehicle_id: Optional[int] = None,
    cargo_category: Optional[CargoCategory] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return get_transport_rules(
        db=db, 
        skip=skip, 
        limit=limit, 
        vehicle_id=vehicle_id, 
        cargo_category=cargo_category, 
        is_active=is_active
    )


@router.put("/rules/{rule_id}", response_model=TransportRule)
def update_transport_rule_endpoint(
    rule_id: int,
    rule: TransportRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    db_rule = get_transport_rule(db=db, rule_id=rule_id)
    if not db_rule:
        raise HTTPException(status_code=404, detail="Transport rule not found")
    return update_transport_rule(db=db, rule_id=rule_id, rule=rule)


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transport_rule_endpoint(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    db_rule = get_transport_rule(db=db, rule_id=rule_id)
    if not db_rule:
        raise HTTPException(status_code=404, detail="Transport rule not found")
    delete_transport_rule(db=db, rule_id=rule_id)
    return {"detail": "Transport rule deleted successfully"}


# Vehicle Recommendation endpoint
@router.post("/recommend", response_model=VehicleRecommendation)
def get_vehicle_recommendation_endpoint(
    request: VehicleRecommendationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return get_vehicle_recommendation(db=db, request=request)


# Vehicle Usage endpoints
@router.post("/usage", response_model=VehicleUsage)
def create_vehicle_usage_endpoint(
    usage: VehicleUsageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return create_vehicle_usage(db=db, usage=usage)


@router.put("/usage/{usage_id}", response_model=VehicleUsage)
def update_vehicle_usage_endpoint(
    usage_id: int,
    usage: VehicleUsageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_usage = get_vehicle_usage(db=db, usage_id=usage_id)
    if not db_usage:
        raise HTTPException(status_code=404, detail="Vehicle usage not found")
    return update_vehicle_usage(db=db, usage_id=usage_id, usage=usage)


# Statistics endpoints
@router.get("/stats/usage")
def get_vehicle_usage_stats_endpoint(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    vehicle_type: Optional[VehicleType] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    return get_vehicle_usage_stats(db=db, start_date=start_date, end_date=end_date, vehicle_type=vehicle_type)


@router.get("/stats/performance")
def get_vehicle_performance_stats_endpoint(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    vehicle_type: Optional[VehicleType] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    return get_vehicle_performance_stats(db=db, start_date=start_date, end_date=end_date, vehicle_type=vehicle_type)


@router.get("/stats/environmental")
def get_vehicle_environmental_stats_endpoint(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    vehicle_type: Optional[VehicleType] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    return get_vehicle_environmental_stats(db=db, start_date=start_date, end_date=end_date, vehicle_type=vehicle_type)
