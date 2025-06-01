from fastapi import Depends, HTTPException, status, WebSocket
from sqlalchemy.orm import Session
from typing import Generator, Optional
from jose import jwt

from .security import get_current_user, get_current_active_user, get_current_manager
from ..db.session import get_db
from ..models.user import User, UserRole
from .config import settings

async def get_current_client(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if current_user.role != UserRole.client:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux clients",
        )
    return current_user

async def get_current_courier(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if current_user.role != UserRole.courier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux coursiers",
        )
    return current_user

async def get_current_business(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if current_user.role != UserRole.business:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux entreprises",
        )
    return current_user

async def get_current_client_or_manager(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if current_user.role not in [UserRole.client, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux clients ou gestionnaires",
        )
    return current_user

async def get_current_courier_or_manager(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if current_user.role not in [UserRole.courier, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux coursiers ou gestionnaires",
        )
    return current_user

async def get_current_business_or_manager(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if current_user.role not in [UserRole.business, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux entreprises ou gestionnaires",
        )
    return current_user

async def get_current_user_ws(
    websocket: WebSocket,
    db: Session
) -> User:
    """
    Authentifier un utilisateur via WebSocket en utilisant un token JWT passé en header Authorization ou paramètre de requête.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Identifiants invalides",
    )
    auth_header = websocket.headers.get("Authorization") or ""
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
    else:
        token = websocket.query_params.get("token")
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        phone: str = payload.get("sub")
        if phone is None:
            raise credentials_exception
    except jwt.JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        raise credentials_exception
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte inactif",
        )
    return user
