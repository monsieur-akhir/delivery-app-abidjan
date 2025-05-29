# This is a standalone utility function that can be imported directly
# from the app.core.dependencies module

from fastapi import WebSocket, HTTPException, status
from sqlalchemy.orm import Session
from jose import jwt
from ..models.user import User
from .config import settings

async def get_current_user_ws(
    websocket: WebSocket,
    db: Session
) -> User:
    """
    Authenticate a user via WebSocket using JWT token passed in Authorization header or query parameter.
    This is a standalone version of the function that can be imported directly.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
    )
    auth_header = websocket.headers.get("Authorization") or ""
    token = None
    
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
            detail="Inactive account",
        )
    
    return user
