from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import requests
import logging

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

logger = logging.getLogger(__name__)

class KeycloakError(Exception):
    """Exception spécifique pour les erreurs Keycloak"""
    pass

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

def register_user(db: Session, user_data: UserCreate, skip_uniqueness_check: bool = False) -> User:
    """
    Enregistre un nouvel utilisateur avec validation complète.
    Valide toutes les informations avant de créer l'utilisateur.
    Gère proprement les erreurs d'unicité (numéro/email) même en cas de race condition.
    Ajoute des logs détaillés à chaque étape.
    """
    logger.info("[INSCRIPTION] Début du traitement pour %s", user_data.phone)
    # --- VALIDATIONS AVANT TOUTE ÉCRITURE ---
    if not user_data.phone or len(user_data.phone.strip()) == 0:
        logger.warning("[INSCRIPTION] Numéro de téléphone manquant")
        raise ValueError("Le numéro de téléphone est requis")
    phone_clean = user_data.phone.strip().replace(" ", "").replace("-", "").replace(".", "")
    if len(phone_clean) == 10:
        phone_clean = "+225" + phone_clean
    if phone_clean.startswith("00225"):
        phone_clean = "+225" + phone_clean[5:]
    if phone_clean.startswith("225") and not phone_clean.startswith("+225"):
        phone_clean = "+225" + phone_clean[3:]
    logger.info(f"[INSCRIPTION] Numéro nettoyé: {phone_clean}")
    if user_data.email:
        email_clean = user_data.email.strip().lower()
        if not email_clean or "@" not in email_clean or "." not in email_clean:
            logger.warning("[INSCRIPTION] Format d'email invalide: %s", user_data.email)
            raise ValueError("Format d'email invalide")
    else:
        email_clean = None
    logger.info(f"[INSCRIPTION] Email nettoyé: {email_clean}")
    # Désactivation temporaire de la vérification d'unicité
    logger.info("[INSCRIPTION] Vérification d'unicité désactivée temporairement, tentative de création...")
    try:
        # Créer l'utilisateur dans Keycloak (optionnel)
        try:
            keycloak_user = keycloak_auth.create_user(user_data.dict())
            keycloak_id = keycloak_user["id"]
            hashed_password = "keycloak_managed"
            status = UserStatus.active
            logger.info("[INSCRIPTION] Utilisateur créé dans Keycloak: %s", keycloak_id)
        except Exception as e:
            keycloak_id = None
            hashed_password = get_password_hash(user_data.password)
            status = UserStatus.pending_verification
            logger.warning(f"[INSCRIPTION] Création Keycloak échouée, fallback local: {e}")
        db_user = User(
            phone=phone_clean,
            email=email_clean,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            role=user_data.role,
            commune=user_data.commune,
            language_preference=user_data.language_preference,
            status=status,
            keycloak_id=keycloak_id
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        logger.info(f"[INSCRIPTION] Utilisateur créé en base: {db_user.id}")
        from ..models.wallet import Wallet
        wallet = Wallet(user_id=db_user.id)
        db.add(wallet)
        if db_user.role == UserRole.courier:
            from ..models.user import CourierProfile
            from ..models.gamification import CourierPoints
            courier_profile = CourierProfile(user_id=db_user.id)
            db.add(courier_profile)
            courier_points = CourierPoints(courier_id=db_user.id)
            db.add(courier_points)
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
        logger.info(f"[INSCRIPTION] Entités associées créées pour utilisateur {db_user.id}")
        return db_user
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig).lower()
        logger.error(f"[INSCRIPTION] IntegrityError: {error_msg}")
        if 'phone' in error_msg or ('unique constraint' in error_msg and 'phone' in error_msg):
            raise ConflictError("Un utilisateur avec ce numéro de téléphone existe déjà")
        elif 'email' in error_msg or ('unique constraint' in error_msg and 'email' in error_msg):
            raise ConflictError("Un utilisateur avec cette adresse email existe déjà")
        else:
            raise ConflictError("Conflit lors de la création de l'utilisateur (unicité)")
    except Exception as e:
        db.rollback()
        logger.error(f"[INSCRIPTION] Exception inattendue: {e}")
        raise ValueError(f"Erreur lors de la création utilisateur: {e}")

def register_user_admin(db: Session, user_data: UserCreate) -> User:
    """
    Enregistre un nouvel utilisateur via l'interface d'administration.
    Les utilisateurs créés par les administrateurs sont automatiquement actifs.
    """
    # Validation du numéro de téléphone
    if not user_data.phone or len(user_data.phone.strip()) == 0:
        raise ValueError("Le numéro de téléphone est requis")
    
    # Nettoyer et valider le format du numéro de téléphone
    phone_clean = user_data.phone.strip().replace(" ", "").replace("-", "").replace(".", "")
    if not phone_clean.startswith("+225") and not phone_clean.startswith("225"):
        phone_clean = "+225" + phone_clean.lstrip("0")
    
    # Vérifier si l'utilisateur existe déjà avec ce numéro
    existing_user_phone = db.query(User).filter(User.phone == phone_clean).first()
    if existing_user_phone:
        raise ConflictError("Un utilisateur avec ce numéro de téléphone existe déjà")
    
    # Validation de l'email si fourni
    if user_data.email:
        email_clean = user_data.email.strip().lower()
        if not email_clean or "@" not in email_clean or "." not in email_clean:
            raise ValueError("Format d'email invalide")
        
        # Vérifier si l'utilisateur existe déjà avec cet email
        existing_user_email = db.query(User).filter(User.email == email_clean).first()
        if existing_user_email:
            raise ConflictError("Un utilisateur avec cette adresse email existe déjà")
    else:
        email_clean = None
    
    # Créer l'utilisateur avec un statut actif (bypass Keycloak pour les admins)
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        phone=phone_clean,
        email=email_clean,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role,
        commune=user_data.commune,
        language_preference=user_data.language_preference,
        status=UserStatus.active  # Toujours actif pour les créations admin
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
        response.raise_for_status()
        
        token_data = response.json()
        
        # Récupérer les informations de l'utilisateur à partir du nouveau token
        user_info = keycloak_auth.verify_token(token_data["access_token"])
        
        # Récupérer l'utilisateur local
        user = db.query(User).filter(User.phone == user_info["phone_number"]).first()
        if not user:
            raise UnauthorizedError("Utilisateur non trouvé")
        
        return Token(
            access_token=token_data["access_token"],
            token_type="bearer",
            expires_at=datetime.now() + timedelta(seconds=token_data["expires_in"]),
            refresh_token=token_data.get("refresh_token"),
            user=UserResponse.model_validate(user, from_attributes=True)
        )
        
    except Exception as e:
        raise UnauthorizedError(f"Erreur lors du rafraîchissement du token: {str(e)}")

def register_user_no_check(db: Session, user_data: UserCreate) -> User:
    """
    Enregistre un nouvel utilisateur sans aucune vérification d'unicité (ni numéro, ni email, ni OTP).
    Idéal pour des tests ou des imports massifs.
    """
    logger.info("[INSCRIPTION-NO-CHECK] Début du traitement pour %s", user_data.phone)
    if not user_data.phone or len(user_data.phone.strip()) == 0:
        logger.warning("[INSCRIPTION-NO-CHECK] Numéro de téléphone manquant")
        raise ValueError("Le numéro de téléphone est requis")
    phone_clean = user_data.phone.strip().replace(" ", "").replace("-", "").replace(".", "")
    if len(phone_clean) == 10:
        phone_clean = "+225" + phone_clean
    if phone_clean.startswith("00225"):
        phone_clean = "+225" + phone_clean[5:]
    if phone_clean.startswith("225") and not phone_clean.startswith("+225"):
        phone_clean = "+225" + phone_clean[3:]
    logger.info(f"[INSCRIPTION-NO-CHECK] Numéro nettoyé: {phone_clean}")
    if user_data.email:
        email_clean = user_data.email.strip().lower()
        if not email_clean or "@" not in email_clean or "." not in email_clean:
            logger.warning("[INSCRIPTION-NO-CHECK] Format d'email invalide: %s", user_data.email)
            raise ValueError("Format d'email invalide")
    else:
        email_clean = None
    logger.info(f"[INSCRIPTION-NO-CHECK] Email nettoyé: {email_clean}")
    logger.info("[INSCRIPTION-NO-CHECK] Création directe sans vérification d'unicité...")
    try:
        # Création Keycloak optionnelle
        try:
            keycloak_user = keycloak_auth.create_user(user_data.dict())
            keycloak_id = keycloak_user["id"]
            hashed_password = "keycloak_managed"
            status = UserStatus.active
            logger.info("[INSCRIPTION-NO-CHECK] Utilisateur créé dans Keycloak: %s", keycloak_id)
        except Exception as e:
            keycloak_id = None
            hashed_password = get_password_hash(user_data.password)
            status = UserStatus.pending_verification
            logger.warning(f"[INSCRIPTION-NO-CHECK] Création Keycloak échouée, fallback local: {e}")
        db_user = User(
            phone=phone_clean,
            email=email_clean,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            role=user_data.role,
            commune=user_data.commune,
            language_preference=user_data.language_preference,
            status=status,
            keycloak_id=keycloak_id
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        logger.info(f"[INSCRIPTION-NO-CHECK] Utilisateur créé en base: {db_user.id}")
        from ..models.wallet import Wallet
        wallet = Wallet(user_id=db_user.id)
        db.add(wallet)
        if db_user.role == UserRole.courier:
            from ..models.user import CourierProfile
            from ..models.gamification import CourierPoints
            courier_profile = CourierProfile(user_id=db_user.id)
            db.add(courier_profile)
            courier_points = CourierPoints(courier_id=db_user.id)
            db.add(courier_points)
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
        logger.info(f"[INSCRIPTION-NO-CHECK] Entités associées créées pour utilisateur {db_user.id}")
        return db_user
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig).lower()
        logger.error(f"[INSCRIPTION-NO-CHECK] IntegrityError: {error_msg}")
        raise ConflictError("Conflit lors de la création de l'utilisateur (unicité en base)")
    except Exception as e:
        db.rollback()
        logger.error(f"[INSCRIPTION-NO-CHECK] Exception inattendue: {e}")
        raise ValueError(f"Erreur lors de la création utilisateur: {e}")
