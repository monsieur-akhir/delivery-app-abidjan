from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union

from jose import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .config import settings
from ..db.session import get_db
from ..models.user import User

# Configuration de la sécurité
# Handle bcrypt version issue by suppressing the warning
import logging
logging.getLogger("passlib").setLevel(logging.ERROR)

# Using bcrypt with no compatibility warnings
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

logger = logging.getLogger("auth")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_token_expiration() -> datetime:
    return datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    # En mode développement, si Keycloak est désactivé, retourner un utilisateur de test
    if settings.ENVIRONMENT == "development" and getattr(settings, "DISABLE_KEYCLOAK", False):
        test_user = db.query(User).filter(User.phone == "test@example.com").first()
        if test_user:
            logger.info(f"[AUTH] Utilisateur de test retourné: {test_user.phone} (id={test_user.id}, role={test_user.role})")
            return test_user
        # Créer un utilisateur de test si nécessaire
        test_user = User(
            phone="test@example.com",
            email="test@example.com",
            hashed_password=get_password_hash("test123"),
            role="client",
            status="active"
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        logger.info(f"[AUTH] Utilisateur de test créé: {test_user.phone} (id={test_user.id}, role={test_user.role})")
        return test_user

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Identifiants invalides",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        phone: str = payload.get("sub")
        if phone is None:
            logger.warning(f"[AUTH] Token sans 'sub' (phone). Token: {token}")
            raise credentials_exception
    except jwt.JWTError as e:
        logger.warning(f"[AUTH] JWTError lors du décodage du token: {str(e)} | Token: {token}")
        raise credentials_exception
        
    user = db.query(User).filter(User.phone == phone).first()
    if user is None:
        logger.warning(f"[AUTH] Aucun utilisateur trouvé pour phone={phone}")
        raise credentials_exception
    if user.status == "suspended":
        logger.warning(f"[AUTH] Compte suspendu: user_id={user.id}, phone={user.phone}, role={user.role}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte suspendu. Veuillez contacter le support.",
        )
    logger.info(f"[AUTH] Authentification réussie: user_id={user.id}, phone={user.phone}, role={user.role}, status={user.status}")
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.status != "active":
        logger.warning(f"[AUTH] Compte inactif: user_id={current_user.id}, phone={current_user.phone}, role={current_user.role}, status={current_user.status}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte inactif. Veuillez vérifier votre compte.",
        )
    logger.info(f"[AUTH] Utilisateur actif: user_id={current_user.id}, phone={current_user.phone}, role={current_user.role}")
    return current_user

async def get_current_manager(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux gestionnaires",
        )
    return current_user
