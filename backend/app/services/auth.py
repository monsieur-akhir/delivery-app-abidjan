from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
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

def validate_user_uniqueness(db: Session, phone: str, email: Optional[str] = None) -> None:
    """
    Validation atomique de l'unicité du numéro de téléphone et de l'email.
    Vérifie les deux champs en une seule requête pour éviter les conflits.
    """
    # Nettoyer et formater le numéro de téléphone
    phone_clean = phone.strip().replace(" ", "").replace("-", "").replace(".", "")
    if len(phone_clean) == 10:
        phone_clean = "+225" + phone_clean
    if phone_clean.startswith("00225"):
        phone_clean = "+225" + phone_clean[5:]
    if phone_clean.startswith("225") and not phone_clean.startswith("+225"):
        phone_clean = "+225" + phone_clean[3:]
    
    # Nettoyer l'email si fourni
    email_clean = None
    if email:
        email_clean = email.strip().lower()
    
    # Vérification atomique des deux champs
    existing_user = None
    
    if email_clean:
        # Vérifier si un utilisateur existe avec le numéro OU l'email
        existing_user = db.query(User).filter(
            (User.phone == phone_clean) | (User.email == email_clean)
        ).first()
    else:
        # Vérifier seulement le numéro
        existing_user = db.query(User).filter(User.phone == phone_clean).first()
    
    if existing_user:
        # Déterminer quel champ cause le conflit
        if existing_user.phone == phone_clean:
            raise ConflictError("Un utilisateur avec ce numéro de téléphone existe déjà")
        elif email_clean and existing_user.email == email_clean:
            raise ConflictError("Un utilisateur avec cette adresse email existe déjà")
    
    return phone_clean, email_clean

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
    Enregistre un nouvel utilisateur avec validation complète.
    Valide toutes les informations avant de créer l'utilisateur.
    """
    # --- VALIDATIONS AVANT TOUTE ÉCRITURE ---
    # Validation du numéro de téléphone
    if not user_data.phone or len(user_data.phone.strip()) == 0:
        raise ValueError("Le numéro de téléphone est requis")
    
    # Validation atomique de l'unicité (numéro ET email)
    phone_clean, email_clean = validate_user_uniqueness(db, user_data.phone, user_data.email)
    
    # Validation du format de l'email si fourni
    if user_data.email:
        if not email_clean or "@" not in email_clean or "." not in email_clean:
            raise ValueError("Format d'email invalide")
    
    # Vérifier qu'il n'y a pas d'OTP en cours pour ce numéro (éviter les conflits)
    if db.query(OTP).filter(OTP.phone == phone_clean, OTP.status == OTPStatus.PENDING).first():
        raise ConflictError("Un code de vérification est déjà en cours pour ce numéro. Veuillez attendre ou utiliser un autre numéro.")
    # --- FIN DES VALIDATIONS ---
    
    # Si tout est OK, on peut créer l'utilisateur
    try:
        # Créer l'utilisateur dans Keycloak
        keycloak_user = keycloak_auth.create_user(user_data.dict())
        keycloak_id = keycloak_user["id"]
        db_user = User(
            phone=phone_clean,
            email=email_clean,
            hashed_password="keycloak_managed",
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
        return db_user
    except Exception as e:
        logger.error(f"Exception lors de la création utilisateur Keycloak: {e}")
        # En cas d'erreur avec Keycloak, créer l'utilisateur localement
        try:
            logger.info("Tentative de création utilisateur local...")
            db.rollback()  # Rollback de la transaction Keycloak
            
            hashed_password = get_password_hash(user_data.password)
            db_user = User(
                phone=phone_clean,
                email=email_clean,
                hashed_password=hashed_password,
                full_name=user_data.full_name,
                role=user_data.role,
                commune=user_data.commune,
                language_preference=user_data.language_preference,
                status=UserStatus.pending_verification
            )
            db.add(db_user)
            logger.info("Flush DB local...")
            db.flush()  # Flush pour obtenir l'ID sans commit
            logger.info(f"Utilisateur local flushé: {db_user.id}")
            
            # Créer les entités associées
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
            
            logger.info("Commit DB local...")
            db.commit()  # Commit final de toute la transaction
            db.refresh(db_user)
            logger.info(f"Utilisateur local créé et commit: {db_user.id}")
            return db_user
            
        except Exception as local_error:
            logger.error(f"Exception lors de la création utilisateur local: {local_error}")
            db.rollback()  # Rollback de la transaction locale
            logger.info("Rollback local effectué.")
            # Si c'est une erreur de contrainte unique, c'est un vrai conflit
            if "unique" in str(local_error).lower() or "duplicate" in str(local_error).lower():
                raise ConflictError("Un utilisateur avec ce numéro de téléphone ou cet email existe déjà")
            else:
                # Lever une exception Keycloak pour indiquer que c'est un problème de service
                raise KeycloakError(f"Erreur lors de la création utilisateur: {local_error}")

def register_user_admin(db: Session, user_data: UserCreate) -> User:
    """
    Enregistre un nouvel utilisateur via l'interface d'administration.
    Les utilisateurs créés par les administrateurs sont automatiquement actifs.
    """
    # Validation du numéro de téléphone
    if not user_data.phone or len(user_data.phone.strip()) == 0:
        raise ValueError("Le numéro de téléphone est requis")
    
    # Validation atomique de l'unicité (numéro ET email)
    phone_clean, email_clean = validate_user_uniqueness(db, user_data.phone, user_data.email)
    
    # Validation du format de l'email si fourni
    if user_data.email:
        if not email_clean or "@" not in email_clean or "." not in email_clean:
            raise ValueError("Format d'email invalide")
    
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

def register_user_atomic(db: Session, user_data: UserCreate) -> User:
    """
    Enregistre un nouvel utilisateur avec validation atomique.
    Toute l'opération (validation + création) se fait en une seule transaction.
    Ajout de logs détaillés et rollback explicite pour traquer les problèmes.
    """
    # Validation du numéro de téléphone
    if not user_data.phone or len(user_data.phone.strip()) == 0:
        logger.error("Numéro de téléphone manquant")
        raise ValueError("Le numéro de téléphone est requis")
    
    # Nettoyer et formater le numéro de téléphone
    phone_clean = user_data.phone.strip().replace(" ", "").replace("-", "").replace(".", "")
    if len(phone_clean) == 10:
        phone_clean = "+225" + phone_clean
    if phone_clean.startswith("00225"):
        phone_clean = "+225" + phone_clean[5:]
    if phone_clean.startswith("225") and not phone_clean.startswith("+225"):
        phone_clean = "+225" + phone_clean[3:]
    logger.info(f"Numéro nettoyé: {phone_clean}")
    
    # Nettoyer l'email si fourni
    email_clean = None
    if user_data.email:
        email_clean = user_data.email.strip().lower()
        if not email_clean or "@" not in email_clean or "." not in email_clean:
            logger.error("Format d'email invalide")
            raise ValueError("Format d'email invalide")
    logger.info(f"Email nettoyé: {email_clean}")
    
    # Vérifier qu'il n'y a pas d'OTP en cours pour ce numéro
    if db.query(OTP).filter(OTP.phone == phone_clean, OTP.status == OTPStatus.PENDING).first():
        logger.warning(f"OTP déjà en cours pour: {phone_clean}")
        raise ConflictError("Un code de vérification est déjà en cours pour ce numéro. Veuillez attendre ou utiliser un autre numéro.")
    
    # Vérification atomique des deux champs (dans la même transaction)
    existing_user = None
    if email_clean:
        existing_user = db.query(User).filter(
            (User.phone == phone_clean) | (User.email == email_clean)
        ).first()
    else:
        existing_user = db.query(User).filter(User.phone == phone_clean).first()
    
    if existing_user:
        if existing_user.phone == phone_clean:
            logger.warning(f"Conflit numéro: {phone_clean}")
            raise ConflictError("Un utilisateur avec ce numéro de téléphone existe déjà")
        elif email_clean and existing_user.email == email_clean:
            logger.warning(f"Conflit email: {email_clean}")
            raise ConflictError("Un utilisateur avec cette adresse email existe déjà")
    
    # Si tout est OK, créer l'utilisateur dans la même transaction
    try:
        logger.info("Création utilisateur dans Keycloak...")
        keycloak_user = keycloak_auth.create_user(user_data.dict())
        keycloak_id = keycloak_user["id"]
        db_user = User(
            phone=phone_clean,
            email=email_clean,
            hashed_password="keycloak_managed",
            full_name=user_data.full_name,
            role=user_data.role,
            commune=user_data.commune,
            language_preference=user_data.language_preference,
            status=UserStatus.active,
            keycloak_id=keycloak_id
        )
        db.add(db_user)
        logger.info("Flush DB...")
        db.flush()  # Flush pour obtenir l'ID sans commit
        logger.info(f"Utilisateur flushé (pas encore commit): {db_user.id}")
        
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
        logger.info("Commit DB...")
        db.commit()  # Commit final de toute la transaction
        db.refresh(db_user)
        logger.info(f"Utilisateur créé et commit: {db_user.id}")
        return db_user
        
    except Exception as e:
        logger.error(f"Exception lors de la création utilisateur: {e}")
        db.rollback()  # Rollback de la transaction
        logger.info("Rollback effectué.")
        raise ConflictError(f"Erreur lors de la création utilisateur: {e}")
