from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
import requests

from ..core.security import verify_password, get_password_hash, create_access_token, get_token_expiration
from ..core.keycloak import keycloak_auth
from ..core.config import settings
from ..models.user import User, UserRole, UserStatus
from ..models.otp import OTP, OTPType, OTPStatus
from ..schemas.user import UserCreate, UserLogin, Token, UserResponse
from ..schemas.otp import (
    RegisterWithOTPRequest, RegisterWithOTPResponse,
    LoginWithOTPRequest, LoginWithOTPResponse,
    OTPVerification, OTPVerificationResponse,
    OTPRequest, OTPResend
)
from ..core.exceptions import UnauthorizedError, BadRequestError, ConflictError, ForbiddenError
from .otp_service import OTPService

def authenticate_user(db: Session, phone: str, password: str) -> Optional[User]:
    """
    Authentifie un utilisateur avec son numéro de téléphone et son mot de passe.
    Vérifie d'abord dans Keycloak si activé, puis dans la base de données locale.
    """
    # Récupérer l'utilisateur local
    user = db.query(User).filter(User.phone == phone).first()
    
    # Si Keycloak est activé, essayer d'abord l'authentification Keycloak
    if settings.USE_KEYCLOAK:
        try:
            # Essayer d'authentifier via Keycloak
            keycloak_response = keycloak_auth.login(phone, password)
            
            # Si l'authentification Keycloak réussit, récupérer ou créer l'utilisateur local
            if not user:
                # L'utilisateur existe dans Keycloak mais pas dans la base locale
                # Créer l'utilisateur local à partir des informations Keycloak
                token_info = keycloak_auth.verify_token(keycloak_response["access_token"])
                
                user = User(
                    phone=phone,
                    email=token_info.get("email", ""),
                    hashed_password="keycloak_managed",  # Mot de passe géré par Keycloak
                    full_name=f"{token_info.get('given_name', '')} {token_info.get('family_name', '')}".strip(),
                    role=token_info.get("realm_access", {}).get("roles", [])[0],
                    commune=token_info.get("commune", ""),
                    language_preference=token_info.get("language_preference", "fr"),
                    status=UserStatus.active,
                    keycloak_id=token_info.get("sub", "")
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            
            return user
        except Exception as e:
            # Si l'authentification Keycloak échoue, continuer avec l'authentification locale
            pass
    
    # Authentification locale
    if not user:
        return None
    
    # Si l'utilisateur a un keycloak_id et que Keycloak est activé, il doit s'authentifier via Keycloak
    if settings.USE_KEYCLOAK and user.keycloak_id:
        return None
    
    # Vérifier le mot de passe local
    if not verify_password(password, user.hashed_password):
        return None
    
    return user

def register_user(db: Session, user_data: UserCreate) -> User:
    """
    Enregistre un nouvel utilisateur.
    Crée l'utilisateur dans Keycloak puis dans la base de données locale.
    """
    # Vérifier si l'utilisateur existe déjà
    existing_user = db.query(User).filter(User.phone == user_data.phone).first()
    if existing_user:
        raise ConflictError("Un utilisateur avec ce numéro de téléphone existe déjà")
    
    if user_data.email:
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise ConflictError("Un utilisateur avec cette adresse email existe déjà")
    
    try:
        # Créer l'utilisateur dans Keycloak
        keycloak_user = keycloak_auth.create_user(user_data.dict())
        keycloak_id = keycloak_user["id"]
        
        # Créer l'utilisateur dans la base de données locale
        db_user = User(
            phone=user_data.phone,
            email=user_data.email,
            hashed_password="keycloak_managed",  # Mot de passe géré par Keycloak
            full_name=user_data.full_name,
            role=user_data.role,
            commune=user_data.commune,
            language_preference=user_data.language_preference,
            status=UserStatus.active,
            keycloak_id=keycloak_id
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Créer un portefeuille pour l'utilisateur
        from ..models.wallet import Wallet
        wallet = Wallet(user_id=db_user.id)
        db.add(wallet)
        
        # Si c'est un coursier, créer un profil de coursier et des points
        if db_user.role == UserRole.courier:
            from ..models.user import CourierProfile
            from ..models.gamification import CourierPoints
            
            courier_profile = CourierProfile(user_id=db_user.id)
            db.add(courier_profile)
            
            courier_points = CourierPoints(courier_id=db_user.id)
            db.add(courier_points)
        
        # Si c'est une entreprise, créer un profil d'entreprise
        elif db_user.role == UserRole.business:
            from ..models.user import BusinessProfile
            
            business_profile = BusinessProfile(
                user_id=db_user.id,
                business_name=db_user.full_name,
                business_type="other",
                address="",
                commune=db_user.commune or ""
            )
            db.add(business_profile)
        
        db.commit()
        db.refresh(db_user)
        
        return db_user
    except Exception as e:
        # En cas d'erreur avec Keycloak, créer l'utilisateur localement
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            phone=user_data.phone,
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            role=user_data.role,
            commune=user_data.commune,
            language_preference=user_data.language_preference,
            status=UserStatus.pending_verification
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Créer un portefeuille pour l'utilisateur
        from ..models.wallet import Wallet
        wallet = Wallet(user_id=db_user.id)
        db.add(wallet)
        
        # Si c'est un coursier, créer un profil de coursier et des points
        if db_user.role == UserRole.courier:
            from ..models.user import CourierProfile
            from ..models.gamification import CourierPoints
            
            courier_profile = CourierProfile(user_id=db_user.id)
            db.add(courier_profile)
            
            courier_points = CourierPoints(courier_id=db_user.id)
            db.add(courier_points)
        
        # Si c'est une entreprise, créer un profil d'entreprise
        elif db_user.role == UserRole.business:
            from ..models.user import BusinessProfile
            
            business_profile = BusinessProfile(
                user_id=db_user.id,
                business_name=db_user.full_name,
                business_type="other",
                address="",
                commune=db_user.commune or ""
            )
            db.add(business_profile)
        
        db.commit()
        db.refresh(db_user)
        
        return db_user

def login_user(db: Session, login_data: UserLogin) -> Token:
    """
    Authentifie un utilisateur et génère un token.
    Utilise Keycloak si activé, sinon l'authentification locale.
    """
    # Si Keycloak est activé, essayer d'abord l'authentification Keycloak
    if settings.USE_KEYCLOAK:
        try:
            # Essayer d'authentifier via Keycloak
            keycloak_response = keycloak_auth.login(login_data.phone, login_data.password)
            
            # Récupérer l'utilisateur local
            user = db.query(User).filter(User.phone == login_data.phone).first()
            if not user:
                # L'utilisateur existe dans Keycloak mais pas dans la base locale
                # Créer l'utilisateur local à partir des informations Keycloak
                token_info = keycloak_auth.verify_token(keycloak_response["access_token"])
                
                user = User(
                    phone=login_data.phone,
                    email=token_info.get("email", ""),
                    hashed_password="keycloak_managed",  # Mot de passe géré par Keycloak
                    full_name=f"{token_info.get('given_name', '')} {token_info.get('family_name', '')}".strip(),
                    role=token_info.get("realm_access", {}).get("roles", [])[0],
                    commune=token_info.get("commune", ""),
                    language_preference=token_info.get("language_preference", "fr"),
                    status=UserStatus.active,
                    keycloak_id=token_info.get("sub", "")
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            
            # Utiliser le token Keycloak
            return Token(
                access_token=keycloak_response["access_token"],
                token_type="bearer",
                expires_at=datetime.now() + timedelta(seconds=keycloak_response["expires_in"]),
                refresh_token=keycloak_response.get("refresh_token"),
                user=UserResponse.model_validate(user, from_attributes=True)
            )
        except Exception as e:
            # Si l'authentification Keycloak échoue, continuer avec l'authentification locale
            pass
    
    # Authentification locale
    user = authenticate_user(db, login_data.phone, login_data.password)
    if not user:
        raise UnauthorizedError("Numéro de téléphone ou mot de passe incorrect")
    
    if user.status == UserStatus.suspended:
        raise ForbiddenError("Votre compte est suspendu. Veuillez contacter le support.")
    
    access_token = create_access_token(
        data={"sub": user.phone, "role": user.role}
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_at=get_token_expiration(),
        user=UserResponse.model_validate(user, from_attributes=True)
    )

def enable_two_factor(db: Session, user_id: int) -> Dict[str, Any]:
    """
    Active l'authentification à deux facteurs pour un utilisateur.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("Utilisateur non trouvé")
    
    if not user.keycloak_id:
        raise ValueError("L'utilisateur n'est pas géré par Keycloak")
    
    result = keycloak_auth.enable_totp(user.keycloak_id)
    
    # Mettre à jour le statut 2FA dans la base locale
    user.two_factor_enabled = True
    db.commit()
    
    return result

def refresh_token(db: Session, refresh_token: str) -> Token:
    """
    Rafraîchit un token d'accès à l'aide d'un token de rafraîchissement.
    """
    try:
        # Appeler l'API Keycloak pour rafraîchir le token
        url = f"{keycloak_auth.server_url}/realms/{keycloak_auth.realm}/protocol/openid-connect/token"
        payload = {
            "client_id": keycloak_auth.client_id,
            "client_secret": keycloak_auth.client_secret,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token
        }
        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        response = requests.post(url, data=payload, headers=headers)
        if response.status_code != 200:
            raise UnauthorizedError("Token de rafraîchissement invalide ou expiré")
        
        keycloak_response = response.json()
        
        # Vérifier le token pour obtenir les informations utilisateur
        token_info = keycloak_auth.verify_token(keycloak_response["access_token"])
        phone = token_info.get("preferred_username")
        
        # Récupérer l'utilisateur local
        user = db.query(User).filter(User.phone == phone).first()
        if not user:
            raise UnauthorizedError("Utilisateur non trouvé")
        
        return Token(
            access_token=keycloak_response["access_token"],
            token_type="bearer",
            expires_at=datetime.now() + timedelta(seconds=keycloak_response["expires_in"]),
            refresh_token=keycloak_response.get("refresh_token"),
            user=UserResponse.model_validate(user, from_attributes=True)
        )
    except Exception as e:
        raise UnauthorizedError(f"Erreur lors du rafraîchissement du token: {str(e)}")
