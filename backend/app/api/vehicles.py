from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Body
from typing import List, Optional
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.transport import Vehicle, VehicleDocument, MaintenanceRecord, TransportRule
from app.schemas.transport import (
    VehicleCreate, VehicleUpdate, VehicleResponse, 
    VehicleDocumentCreate, VehicleDocumentUpdate, VehicleDocumentResponse,
    MaintenanceRecordCreate, MaintenanceRecordUpdate, MaintenanceRecordResponse,
    TransportRuleCreate, TransportRuleUpdate, TransportRuleResponse
)
from app.services.transport_service import (
    create_vehicle, get_vehicle, get_vehicles, update_vehicle, delete_vehicle,
    create_vehicle_document, get_vehicle_document, get_vehicle_documents, update_vehicle_document, delete_vehicle_document,
    create_maintenance_record, get_maintenance_record, get_maintenance_records, update_maintenance_record, delete_maintenance_record,
    create_transport_rule, get_transport_rule, get_transport_rules, update_transport_rule, delete_transport_rule
)

router = APIRouter()

# Vehicle endpoints
@router.post("/vehicles", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle_endpoint(
    vehicle: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new vehicle"""
    if current_user.role not in ["admin", "manager", "business"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return create_vehicle(db=db, vehicle=vehicle, user_id=current_user.id)

@router.get("/vehicles", response_model=List[VehicleResponse])
def read_vehicles(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    type: Optional[str] = None,
    is_electric: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all vehicles with optional filtering"""
    if current_user.role not in ["admin", "manager", "business", "courier"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Apply business filtering if user is a business
    business_id = current_user.business_id if current_user.role == "business" else None
    
    return get_vehicles(
        db=db, 
        skip=skip, 
        limit=limit, 
        status=status,
        type=type,
        is_electric=is_electric,
        search=search,
        business_id=business_id
    )

@router.get("/vehicles/{vehicle_id}", response_model=VehicleResponse)
def read_vehicle(
    vehicle_id: str = Path(..., title="The ID of the vehicle to get"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific vehicle by ID"""
    if current_user.role not in ["admin", "manager", "business", "courier"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    vehicle = get_vehicle(db=db, vehicle_id=vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    # Check if user has access to this vehicle
    if current_user.role == "business" and vehicle.business_id != current_user.business_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this vehicle"
        )
    
    return vehicle

@router.put("/vehicles/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle_endpoint(
    vehicle_id: str = Path(..., title="The ID of the vehicle to update"),
    vehicle: VehicleUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a vehicle"""
    if current_user.role not in ["admin", "manager", "business"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    existing_vehicle = get_vehicle(db=db, vehicle_id=vehicle_id)
    if not existing_vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    # Check if user has access to this vehicle
    if current_user.role == "business" and existing_vehicle.business_id != current_user.business_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update this vehicle"
        )
    
    return update_vehicle(db=db, vehicle_id=vehicle_id, vehicle=vehicle)

@router.delete("/vehicles/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle_endpoint(
    vehicle_id: str = Path(..., title="The ID of the vehicle to delete"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a vehicle"""
    if current_user.role not in ["admin", "manager", "business"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    existing_vehicle = get_vehicle(db=db, vehicle_id=vehicle_id)
    if not existing_vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    # Check if user has access to this vehicle
    if current_user.role == "business" and existing_vehicle.business_id != current_user.business_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this vehicle"
        )
    
    delete_vehicle(db=db, vehicle_id=vehicle_id)
    return None

# Vehicle Document endpoints
@router.post("/vehicles/{vehicle_id}/documents", response_model=VehicleDocumentResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle_document_endpoint(
    vehicle_id: str = Path(..., title="The ID of the vehicle"),
    document: VehicleDocumentCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new document for a vehicle"""
    if current_user.role not in ["admin", "manager", "business"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    vehicle = get_vehicle(db=db, vehicle_id=vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    # Check if user has access to this vehicle
    if current_user.role == "business" and vehicle.business_id != current_user.business_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to add documents to this vehicle"
        )
    
    return create_vehicle_document(db=db, vehicle_id=vehicle_id, document=document)

@router.get("/vehicles/{vehicle_id}/documents", response_model=List[VehicleDocumentResponse])
def read_vehicle_documents(
    vehicle_id: str = Path(..., title="The ID of the vehicle"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all documents for a vehicle"""
    if current_user.role not in ["admin", "manager", "business", "courier"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    vehicle = get_vehicle(db=db, vehicle_id=vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    # Check if user has access to this vehicle
    if current_user.role == "business" and vehicle.business_id != current_user.business_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to view documents for this vehicle"
        )
    
    return get_vehicle_documents(db=db, vehicle_id=vehicle_id, skip=skip, limit=limit)

# Maintenance Record endpoints
@router.post("/vehicles/{vehicle_id}/maintenance", response_model=MaintenanceRecordResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance_record_endpoint(
    vehicle_id: str = Path(..., title="The ID of the vehicle"),
    record: MaintenanceRecordCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new maintenance record for a vehicle"""
    if current_user.role not in ["admin", "manager", "business"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    vehicle = get_vehicle(db=db, vehicle_id=vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    # Check if user has access to this vehicle
    if current_user.role == "business" and vehicle.business_id != current_user.business_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to add maintenance records to this vehicle"
        )
    
    return create_maintenance_record(db=db, vehicle_id=vehicle_id, record=record)

@router.get("/vehicles/{vehicle_id}/maintenance", response_model=List[MaintenanceRecordResponse])
def read_maintenance_records(
    vehicle_id: str = Path(..., title="The ID of the vehicle"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all maintenance records for a vehicle"""
    if current_user.role not in ["admin", "manager", "business", "courier"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    vehicle = get_vehicle(db=db, vehicle_id=vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    # Check if user has access to this vehicle
    if current_user.role == "business" and vehicle.business_id != current_user.business_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to view maintenance records for this vehicle"
        )
    
    return get_maintenance_records(db=db, vehicle_id=vehicle_id, skip=skip, limit=limit)

# Transport Rule endpoints
@router.post("/transport-rules", response_model=TransportRuleResponse, status_code=status.HTTP_201_CREATED)
def create_transport_rule_endpoint(
    rule: TransportRuleCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new transport rule"""
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return create_transport_rule(db=db, rule=rule)

@router.get("/transport-rules", response_model=List[TransportRuleResponse])
def read_transport_rules(
    skip: int = 0,
    limit: int = 100,
    vehicle_id: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all transport rules with optional filtering"""
    if current_user.role not in ["admin", "manager", "business"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return get_transport_rules(
        db=db, 
        skip=skip, 
        limit=limit, 
        vehicle_id=vehicle_id,
        is_active=is_active
    )

@router.put("/transport-rules/{rule_id}", response_model=TransportRuleResponse)
def update_transport_rule_endpoint(
    rule_id: str = Path(..., title="The ID of the transport rule to update"),
    rule: TransportRuleUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a transport rule"""
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    existing_rule = get_transport_rule(db=db, rule_id=rule_id)
    if not existing_rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transport rule not found"
        )
    
    return update_transport_rule(db=db, rule_id=rule_id, rule=rule)

@router.delete("/transport-rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transport_rule_endpoint(
    rule_id: str = Path(..., title="The ID of the transport rule to delete"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a transport rule"""
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    existing_rule = get_transport_rule(db=db, rule_id=rule_id)
    if not existing_rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transport rule not found"
        )
    
    delete_transport_rule(db=db, rule_id=rule_id)
    return None
