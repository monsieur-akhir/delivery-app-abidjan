from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any

from ..db.session import get_db
from ..services.auth import register_user, login_user
from ..schemas.user import UserCreate, UserLogin, Token, UserResponse

router = APIRouter(prefix="/auth", tags=["authentication"])

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
