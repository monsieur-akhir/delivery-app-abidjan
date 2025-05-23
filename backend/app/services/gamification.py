from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..models.gamification import CourierPoints, PointTransaction, Reward, RewardStatus
from ..models.user import User, UserRole
from ..schemas.gamification import PointTransactionCreate, RewardCreate
from ..core.exceptions import NotFoundError, BadRequestError, ForbiddenError
from ..core.config import settings

def get_courier_points(db: Session, courier_id: int) -> CourierPoints:
    points = db.query(CourierPoints).filter(CourierPoints.courier_id == courier_id).first()
    if not points:
        # Créer un enregistrement de points si aucun n'existe
        points = CourierPoints(courier_id=courier_id)
        db.add(points)
        db.commit()
        db.refresh(points)
    
    return points

def add_points(db: Session, courier_id: int, points: int, reason: str, delivery_id: Optional[int] = None) -> PointTransaction:
    courier_points = get_courier_points(db, courier_id)
    
    # Mettre à jour les points totaux
    courier_points.total_points += points
    
    # Mettre à jour le niveau (1 niveau tous les X points)
    courier_points.level = (courier_points.total_points // settings.POINTS_PER_LEVEL) + 1
    
    # Créer la transaction de points
    transaction = PointTransaction(
        courier_points_id=courier_points.id,
        points=points,
        reason=reason,
        delivery_id=delivery_id
    )
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    db.refresh(courier_points)
    
    return transaction

def add_points_for_delivery(db: Session, courier_id: int, delivery_id: int) -> PointTransaction:
    # Ajouter des points pour une livraison terminée
    return add_points(
        db, 
        courier_id, 
        settings.POINTS_PER_DELIVERY, 
        "Livraison terminée", 
        delivery_id
    )

def add_points_for_rating(db: Session, courier_id: int) -> PointTransaction:
    # Ajouter des points pour une évaluation 5 étoiles
    courier_points = get_courier_points(db, courier_id)
    courier_points.five_star_ratings += 1
    
    return add_points(
        db, 
        courier_id, 
        settings.POINTS_PER_FIVE_STAR, 
        "Évaluation 5 étoiles"
    )

def add_points_for_express(db: Session, courier_id: int, delivery_id: int) -> PointTransaction:
    # Ajouter des points pour une livraison express
    courier_points = get_courier_points(db, courier_id)
    courier_points.express_deliveries += 1
    
    return add_points(
        db, 
        courier_id, 
        15,  # Plus de points pour les livraisons express
        "Livraison express", 
        delivery_id
    )

def add_points_for_collaborative(db: Session, courier_id: int, delivery_id: int) -> PointTransaction:
    # Ajouter des points pour une livraison collaborative
    courier_points = get_courier_points(db, courier_id)
    courier_points.collaborative_deliveries += 1
    
    return add_points(
        db, 
        courier_id, 
        20,  # Plus de points pour les livraisons collaboratives
        "Livraison collaborative", 
        delivery_id
    )

def get_leaderboard(db: Session, commune: Optional[str] = None, limit: int = 10) -> List[Dict]:
    query = db.query(
        CourierPoints.courier_id,
        User.full_name.label("courier_name"),
        User.profile_picture,
        CourierPoints.total_points,
        CourierPoints.level,
        CourierPoints.deliveries_completed,
        User.commune
    ).join(
        User, CourierPoints.courier_id == User.id
    ).filter(
        User.role == UserRole.courier,
        User.status == "active"
    )
    
    if commune:
        query = query.filter(User.commune == commune)
    
    return query.order_by(desc(CourierPoints.total_points)).limit(limit).all()

def create_reward(db: Session, courier_id: int, reward_data: RewardCreate) -> Reward:
    courier_points = get_courier_points(db, courier_id)
    
    # Vérifier si le coursier a assez de points
    if courier_points.total_points < reward_data.points_used:
        raise BadRequestError("Vous n'avez pas assez de points pour cette récompense")
    
    # Créer la récompense
    reward = Reward(
        courier_points_id=courier_points.id,
        reward_type=reward_data.reward_type,
        amount=reward_data.amount,
        points_used=reward_data.points_used,
        phone_number=reward_data.phone_number,
        status=RewardStatus.pending
    )
    
    db.add(reward)
    
    # Déduire les points
    courier_points.total_points -= reward_data.points_used
    
    db.commit()
    db.refresh(reward)
    db.refresh(courier_points)
    
    # Traiter la récompense (par exemple, envoyer du crédit téléphonique)
    # Ceci serait implémenté dans un service externe
    
    return reward

def process_reward(db: Session, reward_id: int, status: RewardStatus, transaction_reference: Optional[str] = None) -> Reward:
    reward = db.query(Reward).filter(Reward.id == reward_id).first()
    if not reward:
        raise NotFoundError("Récompense non trouvée")
    
    reward.status = status
    reward.transaction_reference = transaction_reference
    reward.processed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(reward)
    
    return reward

def get_rewards(db: Session, courier_id: int) -> List[Reward]:
    courier_points = get_courier_points(db, courier_id)
    return db.query(Reward).filter(Reward.courier_points_id == courier_points.id).order_by(desc(Reward.created_at)).all()
