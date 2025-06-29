from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Any, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
import logging
import os

from ..db.session import get_db
from ..services.auth import register_user, login_user, enable_two_factor, refresh_token, register_user_no_check
from ..services.otp_service import OTPService, OTPRequest
from ..schemas.user import UserCreate, UserLogin, Token, UserResponse, PasswordChangeRequest, PasswordResetRequest, PasswordResetConfirm
from ..schemas.otp import OTPRequest, OTPVerification, OTPResend, OTPResponse, OTPVerificationResponse, RegisterWithOTPRequest, RegisterWithOTPResponse
from ..core.security import get_current_user, verify_password, get_password_hash
from ..models.user import User
from ..models.otp import OTPType
from ..core.config import settings
from ..websockets.tracking import manager
from ..core.exceptions import ConflictError

router = APIRouter(tags=["authentication"])
logger = logging.getLogger(__name__)

@router.post("/register", response_model=UserResponse)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """
    Inscription d'un nouvel utilisateur.
    """
    try:
        # Validation préliminaire des données
        if not user_data.phone or len(user_data.phone.strip()) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le numéro de téléphone est requis"
            )
        if user_data.email and (not user_data.email.strip() or "@" not in user_data.email or "." not in user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Format d'email invalide"
            )
        # Désactivation temporaire de la vérification d'unicité
        return register_user(db, user_data, skip_uniqueness_check=True)
    except ConflictError as e:
        # En cas de conflit (numéro ou email déjà existant)
        logger.warning(f"Conflit lors de l'inscription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except ValueError as e:
        # Erreur de validation des données
        logger.warning(f"Erreur de validation lors de l'inscription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # En cas d'erreur générale
        logger.error(f"Erreur lors de l'inscription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'inscription. Veuillez réessayer."
        )

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

@router.post("/register-with-otp", response_model=RegisterWithOTPResponse)
def register_with_otp(
    user_data: RegisterWithOTPRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Inscription d'un nouvel utilisateur avec envoi automatique d'OTP.
    """
    logger.info("🚀 ENDPOINT: Début register-with-otp")
    logger.info(f"[REGISTER-WITH-OTP] user_data reçu: {user_data}")
    logger.info(f"📱 Numéro reçu: {user_data.phone}")
    logger.info(f"📧 Email reçu: {user_data.email}")

    try:
        # Validation des champs
        if not user_data.phone or len(user_data.phone.strip()) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le numéro de téléphone est requis"
            )
        if user_data.email and (not user_data.email.strip() or "@" not in user_data.email or "." not in user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Format d'email invalide"
            )
        # Désactivation temporaire de la vérification d'unicité
        logger.info("👤 Création de l'utilisateur...")
        user = register_user(db, user_data, skip_uniqueness_check=True)
        logger.info(f"✅ Utilisateur créé ID={user.id}, phone={user.phone}, email={user.email}")
        # Envoi OTP
        otp_service = OTPService(db)
        otp_request = OTPRequest(
            phone=user.phone,
            email=user_data.email,
            otp_type=OTPType.REGISTRATION
        )
        logger.info(f"[REGISTER-WITH-OTP] OTPRequest: {otp_request}")
        otp_response = otp_service.send_otp_no_check(otp_request, user_id=user.id)
        logger.info(f"[REGISTER-WITH-OTP] OTP envoyé: success={otp_response.success}, otp_id={otp_response.otp_id}, channels={otp_response.channels_used}, code={getattr(otp_response, 'dev_otp_code', None)}")
        return RegisterWithOTPResponse(
            success=True,
            message="Inscription réussie et OTP envoyé",
            user_id=user.id,
            otp_sent_to=user.phone,
            expires_at=otp_response.expires_at
        )
    except HTTPException:
        raise  # Laisse passer les HTTPException telles quelles
    except Exception as e:
        logger.exception(f"💥 Erreur interne register-with-otp: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur serveur. Veuillez réessayer."
        )

def normalize_phone(phone: str) -> str:
    """Garantit le format +225XXXXXXXXX"""
    digits = ''.join(c for c in phone if c.isdigit())
    
    if not digits:
        raise ValueError("Numéro invalide")
    
    if len(digits) == 10:
        return f"+225{digits}"
    elif digits.startswith("225") and len(digits) == 12:
        return f"+{digits}"
    else:
        raise ValueError("Format de numéro non supporté")

def mask_phone(phone: str) -> str:
    """Masque partiellement le numéro"""
    return f"{phone[:4]}****{phone[-2:]}" if phone else ""


@router.post("/login", response_model=Token)
def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
) -> Any:
    """
    Authentification d'un utilisateur existant.
    """
    return login_user(db, login_data)

@router.post("/login/oauth", response_model=Token)
def login_oauth(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """
    Authentification OAuth2 (pour les clients tiers).
    """
    login_data = UserLogin(
        phone=form_data.username,
        password=form_data.password
    )
    return login_user(db, login_data)

# OTP Endpoints
@router.post("/send-otp", response_model=OTPResponse)
def send_otp(
    request: OTPRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Envoyer un code OTP.
    """
    otp_service = OTPService(db)
    return otp_service.send_otp(request)

@router.post("/verify-otp", response_model=OTPVerificationResponse)
def verify_otp(
    verification: OTPVerification,
    db: Session = Depends(get_db)
) -> Any:
    """
    Vérifier un code OTP.
    """
    phone = verification.phone.strip().replace(" ", "").replace("-", "").replace(".", "")
    if len(phone) == 10:
        phone = "+225" + phone
    if phone.startswith("00225"):
        phone = "+225" + phone[5:]
    if phone.startswith("225") and not phone.startswith("+225"):
        phone = "+225" + phone[3:]
    # Contrôle numéro trop court
    if len(phone) < 13:
        logger.error(f"[OTP VERIFY] Numéro trop court reçu: {phone} (longueur={len(phone)})")
        raise HTTPException(
            status_code=400,
            detail="Numéro de téléphone incomplet ou invalide pour la vérification OTP."
        )
    verification.phone = phone
    otp_service = OTPService(db)
    success, otp = otp_service.verify_otp(verification)
    response = OTPVerificationResponse(
        success=success,
        message="Code OTP vérifié avec succès"
    )
    # Générer un token pour LOGIN et REGISTRATION
    if otp.otp_type in [OTPType.LOGIN, OTPType.REGISTRATION] and otp.user:
        from ..core.security import create_access_token, get_token_expiration
        access_token = create_access_token(
            data={"sub": otp.user.phone, "role": otp.user.role}
        )
        response.token = access_token
        response.user = UserResponse.model_validate(otp.user, from_attributes=True).model_dump()
    return response

@router.post("/resend-otp", response_model=dict)
def resend_otp(
    request: OTPResend,
    db: Session = Depends(get_db)
) -> Any:
    """
    Renvoyer un code OTP. Retourne le code OTP et l'email dans la réponse si DEBUG_OTP_IN_RESPONSE est à true.
    """
    # Formatage du numéro avec indicatif +225
    phone = request.phone.strip().replace(" ", "").replace("-", "").replace(".", "")
    if len(phone) == 10:
        phone = "+225" + phone
    if phone.startswith("00225"):
        phone = "+225" + phone[5:]
    if phone.startswith("225") and not phone.startswith("+225"):
        phone = "+225" + phone[3:]
    otp_service = OTPService(db)
    otp_response = otp_service.resend_otp(phone, request.otp_type)
    # Log du code OTP envoyé (pour debug/test)
    from ..models.otp import OTP
    last_otp = db.query(OTP).filter(OTP.phone == phone, OTP.otp_type == request.otp_type).order_by(OTP.created_at.desc()).first()
    otp_code = last_otp.code if last_otp else None
    email = last_otp.email if last_otp else None
    logger.info(f"[OTP-RESEND] Code OTP envoyé: {otp_code} | Email: {email}")
    debug_otp = os.getenv("DEBUG_OTP_IN_RESPONSE", "false").lower() == "true"
    response = otp_response.model_dump() if hasattr(otp_response, 'model_dump') else otp_response.__dict__
    if debug_otp:
        if otp_code:
            response["otp_code"] = otp_code
        if email:
            response["email"] = email
    return response

# Password Reset Endpoints
@router.post("/forgot-password", response_model=OTPResponse)
def forgot_password(
    request: PasswordResetRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Demander la réinitialisation du mot de passe.
    """
    # Find user by email or phone
    user = None
    if request.email:
        user = db.query(User).filter(User.email == request.email).first()
    elif request.phone:
        user = db.query(User).filter(User.phone == request.phone).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    # Send password reset OTP
    otp_service = OTPService(db)
    otp_request = OTPRequest(
        phone=user.phone,
        email=user.email,
        otp_type=OTPType.PASSWORD_RESET
    )
    return otp_service.send_otp(otp_request)

@router.post("/reset-password", response_model=dict)
def reset_password(
    request: PasswordResetConfirm,
    db: Session = Depends(get_db)
) -> Any:
    """
    Réinitialiser le mot de passe avec le code OTP.
    """
    # Verify OTP first
    otp_service = OTPService(db)
    verification = OTPVerification(
        phone=request.phone,
        code=request.code,
        otp_type=OTPType.PASSWORD_RESET
    )
    
    success, otp = otp_service.verify_otp(verification)
    if not success or not otp.user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code OTP invalide ou expiré"
        )
    
    # Update password
    otp.user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    
    return {"message": "Mot de passe réinitialisé avec succès"}

@router.post("/verify-reset-token", response_model=dict)
def verify_reset_token(
    token_data: dict = Body(...),
    db: Session = Depends(get_db)
) -> Any:
    """
    Vérifier un token de réinitialisation.
    """
    # For OTP-based system, we don't use tokens, just return success
    return {"valid": True, "message": "Token valide"}

# User Profile Endpoints
@router.get("/user", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Récupérer les informations de l'utilisateur connecté.
    """
    return current_user

@router.get("/profile", response_model=UserResponse)
def get_user_profile(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Récupérer le profil complet de l'utilisateur connecté.
    """
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_user_profile(
    profile_data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Mettre à jour le profil utilisateur.
    """
    # Update allowed fields
    allowed_fields = ["full_name", "email", "commune", "language_preference"]
    for field in allowed_fields:
        if field in profile_data:
            setattr(current_user, field, profile_data[field])
    
    db.commit()
    db.refresh(current_user)
    return current_user

# Security Endpoints
@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Déconnecter l'utilisateur et fermer tous ses WebSockets"""
    try:
        # Déconnecter l'utilisateur de tous ses WebSockets
        await manager.disconnect_user(current_user.id)
        
        logger.info(f"Utilisateur {current_user.id} déconnecté avec succès")
        
        return {
            "success": True,
            "message": "Déconnexion réussie",
            "user_id": current_user.id
        }
    except Exception as e:
        logger.error(f"Erreur lors de la déconnexion: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la déconnexion"
        )

@router.post("/refresh", response_model=Token)
def refresh_access_token(
    refresh_data: dict = Body(...),
    db: Session = Depends(get_db)
) -> Any:
    """
    Rafraîchir le token d'authentification.
    """
    refresh_token_str = refresh_data.get("refresh_token")
    if not refresh_token_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token de rafraîchissement requis"
        )
    
    return refresh_token(db, refresh_token_str)

@router.post("/change-password", response_model=dict)
def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Changer le mot de passe de l'utilisateur.
    """
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mot de passe actuel incorrect"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Mot de passe modifié avec succès"}

# Two-Factor Authentication
@router.post("/2fa/enable", response_model=dict)
def enable_two_factor_auth(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Activer l'authentification à deux facteurs.
    """
    return enable_two_factor(db, current_user.id)

@router.post("/2fa/verify", response_model=dict)
def verify_two_factor_code(
    code_data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Vérifier le code d'authentification à deux facteurs.
    """
    code = code_data.get("code")
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code 2FA requis"
        )
    
    # Send 2FA OTP
    otp_service = OTPService(db)
    verification = OTPVerification(
        phone=current_user.phone,
        code=code,
        otp_type=OTPType.TWO_FACTOR
    )
    
    success, _ = otp_service.verify_otp(verification)
    return {"success": success}

@router.get("/websocket-status")
async def get_websocket_status(current_user: User = Depends(get_current_user)):
    """Vérifier l'état des connexions WebSocket de l'utilisateur"""
    try:
        user_connections = []
        
        for delivery_id, connections in manager.user_connections.items():
            user_conns = [
                {
                    "delivery_id": delivery_id,
                    "connected_at": conn["connected_at"].isoformat(),
                    "user_role": conn["user_role"]
                }
                for conn in connections 
                if conn["user_id"] == current_user.id
            ]
            user_connections.extend(user_conns)
        
        return {
            "success": True,
            "user_id": current_user.id,
            "active_connections": len(user_connections),
            "connections": user_connections
        }
    except Exception as e:
        logger.error(f"Erreur lors de la vérification du statut WebSocket: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la vérification du statut"
        )

@router.post("/register-no-check", response_model=dict)
def register_no_check(
    user_data: UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """
    Inscription d'un nouvel utilisateur SANS aucune vérification d'unicité (usage test/debug).
    Envoie aussi un OTP (SMS/email) et logue le code OTP généré.
    Retourne le code OTP dans la réponse HTTP si DEBUG_OTP_IN_RESPONSE est à true.
    """
    from ..services.auth import register_user_no_check
    from ..services.otp_service import OTPService, OTPRequest
    from ..models.otp import OTPType
    try:
        if not user_data.phone or len(user_data.phone.strip()) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le numéro de téléphone est requis"
            )
        if user_data.email and (not user_data.email.strip() or "@" not in user_data.email or "." not in user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Format d'email invalide"
            )
        user = register_user_no_check(db, user_data)
        # Envoi OTP sans vérification
        otp_service = OTPService(db)
        otp_request = OTPRequest(
            phone=user.phone,
            email=user.email,
            otp_type=OTPType.REGISTRATION,
            user_id=user.id
        )
        otp_response = otp_service.send_otp_no_check(otp_request, user_id=user.id)
        # Log du code OTP envoyé (pour debug/test)
        if hasattr(otp_response, 'dev_otp_code'):
            logger.info(f"[OTP-NO-CHECK] Code OTP envoyé (dev): {otp_response.dev_otp_code}")
            otp_code = otp_response.dev_otp_code
        else:
            from ..models.otp import OTP
            last_otp = db.query(OTP).filter(OTP.phone == user.phone, OTP.otp_type == OTPType.REGISTRATION).order_by(OTP.created_at.desc()).first()
            otp_code = last_otp.code if last_otp else None
            if otp_code:
                logger.info(f"[OTP-NO-CHECK] Code OTP envoyé: {otp_code}")
        # Contrôle via variable d'environnement
        debug_otp = os.getenv("DEBUG_OTP_IN_RESPONSE", "false").lower() == "true"
        response = {"success": True, "user": UserResponse.model_validate(user, from_attributes=True).model_dump()}
        if debug_otp and otp_code:
            response["otp_code"] = otp_code
        return response
    except ConflictError as e:
        logger.warning(f"Conflit lors de l'inscription (no-check): {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except ValueError as e:
        logger.warning(f"Erreur de validation lors de l'inscription (no-check): {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Erreur lors de l'inscription (no-check): {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'inscription. Veuillez réessayer."
        )
