from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Generator, Optional

from .security import get_current_user, get_current_active_user, get_current_manager
from ..db.session import get_db
from ..models.user import User, UserRole

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
