from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from ..models.rating import Rating, ModerationStatus
from ..models.user import User, UserRole
from ..models.delivery import Delivery, DeliveryStatus
from ..schemas.rating import RatingCreate, RatingModeration
from ..core.exceptions import NotFoundError, BadRequestError, ForbiddenError

def get_rating(db: Session, rating_id: int) -> Rating:
    rating = db.query(Rating).filter(Rating.id == rating_id).first()
    if not rating:
        raise NotFoundError("Évaluation non trouvée")
    return rating

def get_ratings_for_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Rating]:
    return db.query(Rating).filter(
        Rating.rated_user_id == user_id,
        Rating.moderation_status == ModerationStatus.approved
    ).order_by(desc(Rating.created_at)).offset(skip).limit(limit).all()

def get_ratings_for_delivery(db: Session, delivery_id: int) -> List[Rating]:
    return db.query(Rating).filter(
        Rating.delivery_id == delivery_id,
        Rating.moderation_status == ModerationStatus.approved
    ).all()

def create_rating(db: Session, rating_data: RatingCreate, rater_id: int) -> Rating:
    # Vérifier si la livraison existe et est terminée
    delivery = db.query(Delivery).filter(Delivery.id == rating_data.delivery_id).first()
    if not delivery:
        raise NotFoundError("Livraison non trouvée")
    
    if delivery.status != DeliveryStatus.completed:
        raise BadRequestError("La livraison doit être complétée pour pouvoir laisser une évaluation")
    
    # Vérifier qui évalue qui
    rater = db.query(User).filter(User.id == rater_id).first()
    
    if rater.role == UserRole.client and rater_id == delivery.client_id:
        # Le client évalue le coursier
        if rating_data.rated_user_id != delivery.courier_id:
            raise BadRequestError("Vous ne pouvez évaluer que le coursier de cette livraison")
    
    elif rater.role == UserRole.courier and rater_id == delivery.courier_id:
        # Le coursier évalue le client
        if rating_data.rated_user_id != delivery.client_id:
            raise BadRequestError("Vous ne pouvez évaluer que le client de cette livraison")
    
    else:
        raise ForbiddenError("Vous n'êtes pas autorisé à créer cette évaluation")
    
    # Vérifier si une évaluation existe déjà
    existing_rating = db.query(Rating).filter(
        Rating.delivery_id == rating_data.delivery_id,
        Rating.rater_id == rater_id
    ).first()
    
    if existing_rating:
        raise ConflictError("Vous avez déjà évalué cette livraison")
    
    # Créer l'évaluation
    db_rating = Rating(
        delivery_id=rating_data.delivery_id,
        rater_id=rater_id,
        rated_user_id=rating_data.rated_user_id,
        score=rating_data.score,
        comment=rating_data.comment,
        voice_comment_url=rating_data.voice_comment_url,
        moderation_status=ModerationStatus.pending
    )
    
    db.add(db_rating)
    db.commit()
    db.refresh(db_rating)
    
    # Si c'est une évaluation 5 étoiles pour un coursier, mettre à jour ses points
    if rating_data.score == 5 and db.query(User).filter(
        User.id == rating_data.rated_user_id,
        User.role == UserRole.courier
    ).first():
        from ..services.gamification import add_points_for_rating
        add_points_for_rating(db, rating_data.rated_user_id)
    
    # Notifier l'utilisateur évalué (implémenté dans le service de notification)
    
    return db_rating

def moderate_rating(db: Session, rating_id: int, moderation_data: RatingModeration) -> Rating:
    rating = get_rating(db, rating_id)
    
    rating.moderation_status = moderation_data.moderation_status
    rating.moderation_note = moderation_data.moderation_note
    
    db.commit()
    db.refresh(rating)
    
    return rating

def get_average_rating(db: Session, user_id: int) -> float:
    result = db.query(func.avg(Rating.score)).filter(
        Rating.rated_user_id == user_id,
        Rating.moderation_status == ModerationStatus.approved
    ).scalar()
    
    return float(result) if result else 0.0

def get_rating_counts(db: Session, user_id: int) -> Dict[int, int]:
    counts = {}
    for i in range(1, 6):
        count = db.query(func.count(Rating.id)).filter(
            Rating.rated_user_id == user_id,
            Rating.score == i,
            Rating.moderation_status == ModerationStatus.approved
        ).scalar()
        counts[i] = count
    
    return counts
