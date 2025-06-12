
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import math

from ..models.delivery import Delivery, DeliveryStatus
from ..models.user import User, UserRole
from ..services.geolocation import calculate_distance

class MatchingService:
    @staticmethod
    def find_best_couriers(
        db: Session,
        delivery: Delivery,
        max_distance_km: float = 10.0,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Trouve les meilleurs coursiers pour une livraison
        """
        # Coursiers en ligne dans un rayon donné
        online_couriers = db.query(User).filter(
            User.role == UserRole.courier,
            User.is_online == True,
            User.is_verified == True,
            User.current_lat.isnot(None),
            User.current_lng.isnot(None)
        ).all()

        # Calcul de score pour chaque coursier
        courier_scores = []
        
        for courier in online_couriers:
            # Distance du coursier au point de collecte
            distance = calculate_distance(
                courier.current_lat, courier.current_lng,
                delivery.pickup_lat, delivery.pickup_lng
            )
            
            if distance > max_distance_km:
                continue
                
            # Calcul du score composite
            score = MatchingService._calculate_courier_score(
                db, courier, delivery, distance
            )
            
            courier_scores.append({
                'courier_id': courier.id,
                'courier': courier,
                'distance': distance,
                'score': score,
                'eta_minutes': int(distance * 3)  # Estimation 3 min/km
            })
        
        # Trier par score décroissant
        courier_scores.sort(key=lambda x: x['score'], reverse=True)
        
        return courier_scores[:limit]
    
    @staticmethod
    def _calculate_courier_score(
        db: Session,
        courier: User,
        delivery: Delivery,
        distance: float
    ) -> float:
        """
        Calcule un score composite pour un coursier
        """
        # Facteurs de scoring
        distance_score = max(0, 10 - distance)  # Plus proche = meilleur
        
        # Rating moyen du coursier
        rating_query = db.query(func.avg(models.Rating.rating)).filter(
            models.Rating.rated_user_id == courier.id
        )
        avg_rating = rating_query.scalar() or 3.0
        rating_score = avg_rating * 2
        
        # Taux de completion
        total_deliveries = db.query(Delivery).filter(
            Delivery.courier_id == courier.id
        ).count()
        
        completed_deliveries = db.query(Delivery).filter(
            Delivery.courier_id == courier.id,
            Delivery.status == DeliveryStatus.completed
        ).count()
        
        completion_rate = completed_deliveries / max(total_deliveries, 1)
        completion_score = completion_rate * 5
        
        # Activité récente
        recent_deliveries = db.query(Delivery).filter(
            Delivery.courier_id == courier.id,
            Delivery.created_at >= datetime.utcnow() - timedelta(days=7)
        ).count()
        
        activity_score = min(recent_deliveries * 0.5, 3)
        
        # Score composite
        total_score = (
            distance_score * 0.3 +
            rating_score * 0.3 +
            completion_score * 0.25 +
            activity_score * 0.15
        )
        
        return round(total_score, 2)
    
    @staticmethod
    def auto_assign_delivery(db: Session, delivery_id: int) -> Optional[int]:
        """
        Assigne automatiquement la livraison au meilleur coursier
        """
        delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
        if not delivery:
            return None
            
        best_couriers = MatchingService.find_best_couriers(db, delivery, limit=1)
        
        if best_couriers:
            best_courier = best_couriers[0]
            delivery.courier_id = best_courier['courier_id']
            delivery.status = DeliveryStatus.accepted
            delivery.accepted_at = datetime.utcnow()
            db.commit()
            
            return best_courier['courier_id']
            
        return None
