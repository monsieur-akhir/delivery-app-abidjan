from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import UploadFile

from ..models.user import User, UserRole, UserStatus, KYCStatus, BusinessProfile, CourierProfile
from ..schemas.user import UserCreate, UserUpdate, UserStatusUpdate, KYCUpdate, BusinessProfileCreate, BusinessProfileUpdate, CourierProfileCreate, CourierProfileUpdate
from ..core.exceptions import NotFoundError, ConflictError, BadRequestError

def get_user(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("Utilisateur non trouvé")
    return user

def get_user_by_phone(db: Session, phone: str) -> Optional[User]:
    return db.query(User).filter(User.phone == phone).first()

def get_users(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    role: Optional[UserRole] = None,
    status: Optional[UserStatus] = None,
    commune: Optional[str] = None
) -> List[User]:
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    
    if status:
        query = query.filter(User.status == status)
    
    if commune:
        query = query.filter(User.commune == commune)
    
    return query.offset(skip).limit(limit).all()

def update_user(db: Session, user_id: int, user_data: UserUpdate) -> User:
    user = get_user(db, user_id)
    
    # Mettre à jour les champs fournis
    for key, value in user_data.dict(exclude_unset=True).items():
        setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    return user

def update_user_status(db: Session, user_id: int, status_data: UserStatusUpdate) -> User:
    user = get_user(db, user_id)
    user.status = status_data.status
    db.commit()
    db.refresh(user)
    return user

def update_user_kyc(db: Session, user_id: int, kyc_data: KYCUpdate) -> User:
    user = get_user(db, user_id)
    user.kyc_status = kyc_data.kyc_status
    
    if kyc_data.kyc_rejection_reason:
        user.kyc_rejection_reason = kyc_data.kyc_rejection_reason
    
    # Si KYC est vérifié, mettre à jour le statut de l'utilisateur
    if kyc_data.kyc_status == KYCStatus.verified:
        user.status = UserStatus.active
    
    db.commit()
    db.refresh(user)
    return user

def upload_profile_picture(db: Session, user_id: int, file: UploadFile) -> User:
    user = get_user(db, user_id)
    
    # Logique pour sauvegarder l'image et obtenir l'URL
    # Ceci est un exemple simplifié, dans une application réelle,
    # vous utiliseriez un service de stockage comme AWS S3
    file_location = f"uploads/profile_pictures/{user_id}_{file.filename}"
    with open(file_location, "wb+") as file_object:
        file_object.write(file.file.read())
    
    user.profile_picture = file_location
    db.commit()
    db.refresh(user)
    return user

def upload_kyc_document(db: Session, user_id: int, file: UploadFile) -> User:
    user = get_user(db, user_id)
    
    # Logique pour sauvegarder le document et obtenir l'URL
    file_location = f"uploads/kyc_documents/{user_id}_{file.filename}"
    with open(file_location, "wb+") as file_object:
        file_object.write(file.file.read())
    
    user.kyc_document_url = file_location
    user.kyc_status = KYCStatus.pending
    db.commit()
    db.refresh(user)
    return user

# Fonctions pour les profils d'entreprise
def get_business_profile(db: Session, user_id: int) -> BusinessProfile:
    profile = db.query(BusinessProfile).filter(BusinessProfile.user_id == user_id).first()
    if not profile:
        raise NotFoundError("Profil d'entreprise non trouvé")
    return profile

def create_business_profile(db: Session, user_id: int, profile_data: BusinessProfileCreate) -> BusinessProfile:
    # Vérifier si l'utilisateur existe et est une entreprise
    user = get_user(db, user_id)
    if user.role != UserRole.business:
        raise BadRequestError("L'utilisateur n'est pas une entreprise")
    
    # Vérifier si un profil existe déjà
    existing_profile = db.query(BusinessProfile).filter(BusinessProfile.user_id == user_id).first()
    if existing_profile:
        raise ConflictError("Un profil d'entreprise existe déjà pour cet utilisateur")
    
    # Créer le profil
    db_profile = BusinessProfile(
        user_id=user_id,
        **profile_data.dict()
    )
    
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

def update_business_profile(db: Session, user_id: int, profile_data: BusinessProfileUpdate) -> BusinessProfile:
    profile = get_business_profile(db, user_id)
    
    # Mettre à jour les champs fournis
    for key, value in profile_data.dict(exclude_unset=True).items():
        setattr(profile, key, value)
    
    db.commit()
    db.refresh(profile)
    return profile

# Fonctions pour les profils de coursier
def get_courier_profile(db: Session, user_id: int) -> CourierProfile:
    profile = db.query(CourierProfile).filter(CourierProfile.user_id == user_id).first()
    if not profile:
        raise NotFoundError("Profil de coursier non trouvé")
    return profile

def create_courier_profile(db: Session, user_id: int, profile_data: CourierProfileCreate) -> CourierProfile:
    # Vérifier si l'utilisateur existe et est un coursier
    user = get_user(db, user_id)
    if user.role != UserRole.courier:
        raise BadRequestError("L'utilisateur n'est pas un coursier")
    
    # Vérifier si un profil existe déjà
    existing_profile = db.query(CourierProfile).filter(CourierProfile.user_id == user_id).first()
    if existing_profile:
        raise ConflictError("Un profil de coursier existe déjà pour cet utilisateur")
    
    # Créer le profil
    db_profile = CourierProfile(
        user_id=user_id,
        **profile_data.dict()
    )
    
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

def update_courier_profile(db: Session, user_id: int, profile_data: CourierProfileUpdate) -> CourierProfile:
    profile = get_courier_profile(db, user_id)
    
    # Mettre à jour les champs fournis
    for key, value in profile_data.dict(exclude_unset=True).items():
        setattr(profile, key, value)
    
    db.commit()
    db.refresh(profile)
    return profile

def update_courier_location(db: Session, user_id: int, lat: float, lng: float) -> CourierProfile:
    profile = get_courier_profile(db, user_id)
    
    profile.last_location_lat = lat
    profile.last_location_lng = lng
    profile.last_location_updated = datetime.utcnow()
    
    db.commit()
    db.refresh(profile)
    return profile
