from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..db.session import get_db
from ..core.dependencies import get_current_user, get_current_active_user
from ..schemas.gamification import (
    CourierPointsResponse, PointTransactionResponse, RewardCreate, RewardResponse,
    LeaderboardEntry
)
from ..schemas.user import UserResponse
from ..services.gamification import (
    get_courier_points, get_point_transactions, create_reward,
    get_rewards, get_leaderboard
)
from ..services.notification import send_reward_notification
from ..models.user import UserRole

router = APIRouter()

@router.get("/points/{courier_id}", response_model=CourierPointsResponse)
async def read_courier_points(
    courier_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les points d'un coursier.
    """
    # Vérifier les permissions
    if current_user.role != UserRole.manager and current_user.id != courier_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès aux points de ce coursier"
        )
    
    points = get_courier_points(db, courier_id)
    if not points:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Points du coursier non trouvés"
        )
    
    return points

@router.get("/points/{courier_id}/transactions", response_model=List[PointTransactionResponse])
async def read_point_transactions(
    courier_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les transactions de points d'un coursier.
    """
    # Vérifier les permissions
    if current_user.role != UserRole.manager and current_user.id != courier_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès aux transactions de ce coursier"
        )
    
    return get_point_transactions(db, courier_id, skip=skip, limit=limit)

@router.post("/rewards", response_model=RewardResponse, status_code=status.HTTP_201_CREATED)
async def create_new_reward(
    reward: RewardCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Créer une nouvelle récompense.
    Seuls les coursiers peuvent créer des récompenses pour eux-mêmes.
    """
    if current_user.role != UserRole.courier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les coursiers peuvent créer des récompenses"
        )
    
    # Créer la récompense
    db_reward = create_reward(db, current_user.id, reward)
    
    # Envoyer une notification
    background_tasks.add_task(
        send_reward_notification,
        db=db,
        reward_id=db_reward.id,
        user_id=current_user.id
    )
    
    return db_reward

@router.get("/rewards", response_model=List[RewardResponse])
async def read_rewards(
    courier_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer la liste des récompenses.
    """
    if current_user.role == UserRole.manager:
        # Les gestionnaires peuvent voir toutes les récompenses
        return get_rewards(db, courier_id=courier_id, status=status, skip=skip, limit=limit)
    elif current_user.role == UserRole.courier:
        # Les coursiers ne voient que leurs propres récompenses
        return get_rewards(db, courier_id=current_user.id, status=status, skip=skip, limit=limit)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès aux récompenses"
        )

@router.get("/rankings", response_model=List[LeaderboardEntry])
async def read_leaderboard(
    commune: Optional[str] = None,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer le classement des coursiers.
    """
    return get_leaderboard(db, commune=commune, limit=limit)
