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
    auth_header = websocket.headers.get("Authorization") or ""
    token = None

    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
    else:
        token = websocket.query_params.get("token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token manquant",
        )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        phone: str = payload.get("sub")
        exp = payload.get("exp")

        if phone is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide - phone manquant",
            )

        # Vérifier l'expiration explicitement
        if exp is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide - expiration manquante",
            )

        import time
        if exp < time.time():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expiré",
            )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expiré",
        )
    except jwt.JWTError as e:
        print(f"JWT Error in WebSocket auth: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None
    except Exception as e:
        print(f"Unexpected error in WebSocket auth: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None

    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non trouvé",
        )

    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte inactif",
        )

    return user