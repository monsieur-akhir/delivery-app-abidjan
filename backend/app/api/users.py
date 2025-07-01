from fastapi import APIRouter, Depends, HTTPException, status, Body, UploadFile, File, Form, Path, Query
from sqlalchemy.orm import Session
from typing import Any, List, Optional

from ..db.session import get_db
from ..core.dependencies import get_current_user, get_current_active_user, get_current_manager
from ..services.user import (
    get_user, get_users, update_user, update_user_status, update_user_kyc,
    upload_profile_picture, upload_kyc_document, get_business_profile,
    create_business_profile, update_business_profile, get_courier_profile,
    create_courier_profile, update_courier_profile, update_courier_location,
    update_kyc_status
)
from ..services.auth import register_user, register_user_admin
from ..models.user import User, UserRole
from ..schemas.user import (
    UserResponse, UserCreate, UserUpdate, UserStatusUpdate, KYCUpdate,
    BusinessProfileCreate, BusinessProfileUpdate, BusinessProfileResponse,
    CourierProfileCreate, CourierProfileUpdate, CourierProfileResponse
)

router = APIRouter(tags=["users"])

@router.get("/me", response_model=UserResponse)
def read_current_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    user = db.query(User).filter(User.id == current_user.id).first()
    user_response = UserResponse.from_orm(user)
    user_response_dict = user_response.dict()
    user_response_dict["kyc_documents"] = user.kyc_documents
    return user_response_dict

@router.put("/me", response_model=UserResponse)
def update_user_me(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Mettre à jour le profil de l'utilisateur connecté.
    """
    return update_user(db, current_user.id, user_data)

@router.post("/me/profile-picture", response_model=UserResponse)
def upload_user_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Télécharger une photo de profil.
    """
    return upload_profile_picture(db, current_user.id, file)

@router.get("/{user_id}", response_model=UserResponse)
def read_user(
    user_id: int = Path(..., title="ID de l'utilisateur"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Récupérer le profil d'un utilisateur par son ID.
    """
    # Vérifier les autorisations (seul l'utilisateur lui-même ou un gestionnaire peut voir le profil)
    if current_user.id != user_id and current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé"
        )
    
    return get_user(db, user_id)

@router.get("/", response_model=List[UserResponse])
def read_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    role: Optional[UserRole] = Query(None, title="Filtrer par rôle"),
    status: Optional[str] = Query(None, title="Filtrer par statut"),
    commune: Optional[str] = Query(None, title="Filtrer par commune"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
) -> Any:
    """
    Récupérer la liste des utilisateurs (gestionnaires uniquement).
    """
    return get_users(db, skip, limit, role, status, commune)

@router.put("/{user_id}/status", response_model=UserResponse)
def update_user_status_endpoint(
    status_data: UserStatusUpdate,
    user_id: int = Path(..., title="ID de l'utilisateur"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
) -> Any:
    """
    Mettre à jour le statut d'un utilisateur (gestionnaires uniquement).
    """
    return update_user_status(db, user_id, status_data)

@router.put("/{user_id}/kyc", response_model=UserResponse)
def update_user_kyc_endpoint(
    kyc_data: KYCUpdate,
    user_id: int = Path(..., title="ID de l'utilisateur"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
) -> Any:
    """
    Mettre à jour le statut KYC d'un utilisateur (gestionnaires uniquement).
    """
    return update_user_kyc(db, user_id, kyc_data)

# Routes pour les profils d'entreprise
@router.get("/business/profile", response_model=BusinessProfileResponse)
def read_business_profile_me(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Récupérer le profil d'entreprise de l'utilisateur connecté.
    """
    if current_user.role != UserRole.business:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux entreprises"
        )
    
    return get_business_profile(db, current_user.id)

@router.post("/business/profile", response_model=BusinessProfileResponse)
def create_business_profile_endpoint(
    profile_data: BusinessProfileCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Créer un profil d'entreprise pour l'utilisateur connecté.
    """
    if current_user.role != UserRole.business:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux entreprises"
        )
    
    return create_business_profile(db, current_user.id, profile_data)

@router.put("/business/profile", response_model=BusinessProfileResponse)
def update_business_profile_endpoint(
    profile_data: BusinessProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Mettre à jour le profil d'entreprise de l'utilisateur connecté.
    """
    if current_user.role != UserRole.business:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux entreprises"
        )
    
    return update_business_profile(db, current_user.id, profile_data)

# Routes pour les profils de coursier
@router.get("/courier/profile", response_model=CourierProfileResponse)
def read_courier_profile_me(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Récupérer le profil de coursier de l'utilisateur connecté.
    """
    if current_user.role != UserRole.courier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux coursiers"
        )
    
    return get_courier_profile(db, current_user.id)

@router.post("/courier/profile", response_model=CourierProfileResponse)
def create_courier_profile_endpoint(
    profile_data: CourierProfileCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Créer un profil de coursier pour l'utilisateur connecté.
    """
    if current_user.role != UserRole.courier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux coursiers"
        )
    
    return create_courier_profile(db, current_user.id, profile_data)

@router.put("/courier/profile", response_model=CourierProfileResponse)
def update_courier_profile_endpoint(
    profile_data: CourierProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Mettre à jour le profil de coursier de l'utilisateur connecté.
    """
    if current_user.role != UserRole.courier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux coursiers"
        )
    
    return update_courier_profile(db, current_user.id, profile_data)

@router.put("/courier/location", response_model=CourierProfileResponse)
def update_courier_location_endpoint(
    lat: float = Body(..., title="Latitude"),
    lng: float = Body(..., title="Longitude"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Mettre à jour la position du coursier.
    """
    if current_user.role != UserRole.courier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux coursiers"
        )
    
    return update_courier_location(db, current_user.id, lat, lng)

# Route pour la création d'utilisateur (admin uniquement)
@router.post("/", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
) -> Any:
    """
    Créer un nouvel utilisateur (gestionnaires uniquement).
    """
    return register_user_admin(db, user_data)

@router.post("/push-token")
def register_push_token(
    token_data: dict = Body(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Enregistrer le token de notification push pour l'utilisateur.
    """
    # Ici vous pouvez sauvegarder le token dans la base de données
    # ou l'envoyer à votre service de notification (OneSignal, Firebase, etc.)
    
    return {
        "message": "Token de notification enregistré avec succès",
        "user_id": current_user.id,
        "token": token_data.get("token")
    }

@router.delete("/push-token")
def unregister_push_token(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Supprimer le token de notification push pour l'utilisateur.
    """
    # Ici vous pouvez supprimer le token de votre service de notification
    
    return {
        "message": "Token de notification supprimé avec succès",
        "user_id": current_user.id
    }

@router.get("/me/kyc-status")
def get_my_kyc_status(
    current_user: User = Depends(get_current_user)  # Utiliser get_current_user au lieu de get_current_active_user
):
    print(f"🔍 [DEBUG] get_my_kyc_status appelé pour user_id={current_user.id}, phone={current_user.phone}, role={current_user.role}, status={current_user.status}")
    return {
        "kyc_status": current_user.kyc_status,
        "kyc_rejection_reason": current_user.kyc_rejection_reason,
        "user_status": current_user.status,  # Ajouter le statut pour debug
    }

@router.post("/users/kyc-submit")
def submit_kyc(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Soumission finale du dossier KYC : met à jour le statut global KYC de l'utilisateur.
    """
    update_kyc_status(current_user.id, db)
    return {"success": True, "message": "Votre dossier KYC a été soumis pour vérification."}
