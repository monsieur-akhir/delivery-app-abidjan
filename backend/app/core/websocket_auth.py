# This is a standalone utility function that can be imported directly
# from the app.core.dependencies module

from fastapi import WebSocket, HTTPException, status
from sqlalchemy.orm import Session
from jose import jwt
from ..models.user import User
from .config import settings
import logging

logger = logging.getLogger("ws_auth")

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
        logger.warning(f"[WS_AUTH] Token manquant pour connexion WebSocket")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token manquant",
        )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        phone: str = payload.get("sub")
        exp = payload.get("exp")

        if phone is None:
            logger.warning(f"[WS_AUTH] Token invalide: phone manquant. Token: {token}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide - phone manquant",
            )

        # Vérifier l'expiration explicitement
        if exp is None:
            logger.warning(f"[WS_AUTH] Token invalide: expiration manquante. Token: {token}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide - expiration manquante",
            )

        import time
        if exp < time.time():
            logger.warning(f"[WS_AUTH] Token expiré pour phone={phone}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expiré",
            )

    except jwt.ExpiredSignatureError:
        logger.warning(f"[WS_AUTH] Token expiré (jwt.ExpiredSignatureError)")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expiré",
        )
    except jwt.JWTError as e:
        logger.warning(f"[WS_AUTH] JWTError lors du décodage du token: {str(e)} | Token: {token}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None
    except Exception as e:
        logger.error(f"[WS_AUTH] Unexpected error in WebSocket auth: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None

    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        logger.warning(f"[WS_AUTH] Utilisateur non trouvé pour phone={phone}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non trouvé",
        )

    if user.status != "active":
        logger.warning(f"[WS_AUTH] Compte inactif: user_id={user.id}, phone={user.phone}, role={user.role}, status={user.status}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte inactif",
        )

    logger.info(f"[WS_AUTH] Authentification WS réussie: user_id={user.id}, phone={user.phone}, role={user.role}, status={user.status}")
    return user