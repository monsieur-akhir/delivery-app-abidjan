from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..db.session import get_db
from ..core.dependencies import get_current_user, get_current_active_user
from ..schemas.rating import RatingCreate, RatingResponse, RatingModeration
from ..schemas.user import UserResponse
from ..services.rating import create_rating, get_rating, get_ratings, get_user_ratings, moderate_rating
from ..services.notification import send_rating_notification
from ..services.gamification import add_points_for_rating
from ..models.user import UserRole

router = APIRouter()

@router.post("/", response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
async def create_new_rating(
    rating: RatingCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Créer une nouvelle évaluation.
    """
    # Vérifier si l'utilisateur peut créer cette évaluation
    db_rating = create_rating(db, rating, current_user.id)
    
    # Ajouter des points si c'est une évaluation 5 étoiles pour un coursier
    if rating.score == 5 and db_rating.rated_user.role == UserRole.courier:
        background_tasks.add_task(
            add_points_for_rating,
            db=db,
            courier_id=rating.rated_user_id,
            rating_id=db_rating.id
        )
    
    # Envoyer une notification à l'utilisateur évalué
    background_tasks.add_task(
        send_rating_notification,
        db=db,
        rating_id=db_rating.id,
        user_id=rating.rated_user_id,
        score=rating.score
    )
    
    return db_rating

@router.get("/{rating_id}", response_model=RatingResponse)
async def read_rating(
    rating_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les détails d'une évaluation.
    """
    rating = get_rating(db, rating_id)
    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Évaluation non trouvée"
        )
    
    # Vérifier les permissions
    if current_user.role == UserRole.manager:
        return rating
    elif current_user.id == rating.rater_id or current_user.id == rating.rated_user_id:
        return rating
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès à cette évaluation"
        )

@router.get("/", response_model=List[RatingResponse])
async def read_ratings(
    delivery_id: Optional[int] = None,
    user_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer la liste des évaluations.
    Filtrage par livraison et utilisateur possible.
    """
    if current_user.role == UserRole.manager:
        # Les gestionnaires peuvent voir toutes les évaluations
        return get_ratings(db, delivery_id=delivery_id, user_id=user_id, skip=skip, limit=limit)
    else:
        # Les autres utilisateurs ne voient que les évaluations les concernant
        return get_user_ratings(db, current_user.id, delivery_id=delivery_id, user_id=user_id, skip=skip, limit=limit)

@router.put("/{rating_id}/moderate", response_model=RatingResponse)
async def moderate_rating_endpoint(
    rating_id: int,
    moderation: RatingModeration,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Modérer une évaluation.
    Seuls les gestionnaires peuvent modérer les évaluations.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent modérer les évaluations"
        )
    
    rating = get_rating(db, rating_id)
    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Évaluation non trouvée"
        )
    
    return moderate_rating(db, rating_id, moderation)
