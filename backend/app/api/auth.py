from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any

from ..db.session import get_db
from ..services.auth import register_user, login_user, enable_two_factor, refresh_token
from ..services.otp_service import OTPService
from ..schemas.user import UserCreate, UserLogin, Token, UserResponse, PasswordChangeRequest, PasswordResetRequest, PasswordResetConfirm
from ..schemas.otp import OTPRequest, OTPVerification, OTPResend, OTPResponse, OTPVerificationResponse
from ..core.security import get_current_user
from ..models.user import User
from ..models.otp import OTPType

router = APIRouter(tags=["authentication"])

@router.post("/register", response_model=UserResponse)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """
    Inscription d'un nouvel utilisateur.
    """
    return register_user(db, user_data)

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
    otp_service = OTPService(db)
    success, otp = otp_service.verify_otp(verification)
    
    response = OTPVerificationResponse(
        success=success,
        message="Code OTP vérifié avec succès"
    )
    
    # If it's a login OTP, generate access token
    if otp.otp_type == OTPType.LOGIN and otp.user:
        from ..core.security import create_access_token, get_token_expiration
        access_token = create_access_token(
            data={"sub": otp.user.phone, "role": otp.user.role}
        )
        response.token = access_token
        response.user = UserResponse.model_validate(otp.user, from_attributes=True).model_dump()
    
    return response

@router.post("/resend-otp", response_model=OTPResponse)
def resend_otp(
    request: OTPResend,
    db: Session = Depends(get_db)
) -> Any:
    """
    Renvoyer un code OTP.
    """
    otp_service = OTPService(db)
    return otp_service.resend_otp(request.phone, request.otp_type)

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
    from ..core.security import get_password_hash
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
@router.post("/logout", response_model=dict)
def logout(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Déconnecter l'utilisateur.
    """
    # For JWT tokens, logout is handled client-side by removing the token
    # Here we could add token blacklisting if needed
    return {"message": "Déconnexion réussie"}

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
    from ..core.security import verify_password, get_password_hash
    
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
