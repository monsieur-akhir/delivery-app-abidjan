from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, timedelta

from ..models.promotions import Promotion, PromotionUsage, PromotionType, PromotionStatus
from ..models.user import User
from ..models.delivery import Delivery
from ..schemas.promotions import PromotionCreate, PromotionUpdate
from .notification import send_notification

class PromotionService:

    @staticmethod
    def validate_promotion_eligibility(
        db: Session, 
        user: User, 
        promotion: Promotion,
        order_value: float = 0
    ) -> Dict[str, Any]:
        """Valider l'éligibilité d'un utilisateur pour une promotion"""

        # Vérifier si la promotion est active
        if promotion.status != PromotionStatus.active:
            return {"eligible": False, "reason": "Promotion inactive"}

        # Vérifier les dates
        now = datetime.utcnow()
        if now < promotion.start_date or now > promotion.end_date:
            return {"eligible": False, "reason": "Promotion expirée"}

        # Vérifier le type d'utilisateur ciblé
        if promotion.target_user_types and user.role not in promotion.target_user_types:
            return {"eligible": False, "reason": "Type d'utilisateur non éligible"}

        # Vérifier la valeur minimale de commande
        if promotion.min_order_value and order_value < promotion.min_order_value:
            return {"eligible": False, "reason": f"Commande minimum de {promotion.min_order_value} XOF requise"}

        # Vérifier le nombre d'utilisations par utilisateur
        if promotion.max_uses_per_user:
            user_usage_count = db.query(func.count(PromotionUsage.id)).filter(
                and_(
                    PromotionUsage.promotion_id == promotion.id,
                    PromotionUsage.user_id == user.id
                )
            ).scalar()

            if user_usage_count >= promotion.max_uses_per_user:
                return {"eligible": False, "reason": "Limite d'utilisation atteinte"}

        # Vérifier le nombre total d'utilisations
        if promotion.max_uses_total and promotion.current_uses >= promotion.max_uses_total:
            return {"eligible": False, "reason": "Promotion épuisée"}

        return {"eligible": True}

    @staticmethod
    def calculate_discount(promotion: Promotion, order_value: float) -> float:
        """Calculer le montant de la remise"""

        if promotion.promotion_type == PromotionType.discount_percentage:
            discount = (order_value * promotion.discount_value) / 100
            if promotion.max_discount:
                discount = min(discount, promotion.max_discount)
            return discount

        elif promotion.promotion_type == PromotionType.discount_fixed:
            return min(promotion.discount_value, order_value)

        elif promotion.promotion_type == PromotionType.free_delivery:
            # Retourner le coût de livraison (à intégrer avec le service de tarification)
            return 0  # À implémenter selon la logique de tarification

        return 0

    @staticmethod
    def apply_promotion(
        db: Session,
        user: User,
        promotion: Promotion,
        delivery: Delivery,
        order_value: float
    ) -> Dict[str, Any]:
        """Appliquer une promotion à une commande"""

        # Valider l'éligibilité
        eligibility = PromotionService.validate_promotion_eligibility(
            db, user, promotion, order_value
        )

        if not eligibility["eligible"]:
            return {"success": False, "error": eligibility["reason"]}

        # Calculer la remise
        discount = PromotionService.calculate_discount(promotion, order_value)

        # Calculer le cashback si applicable
        cashback = 0
        if promotion.promotion_type == PromotionType.cashback:
            cashback = (order_value * promotion.cashback_percentage) / 100

        # Enregistrer l'utilisation
        usage = PromotionUsage(
            promotion_id=promotion.id,
            user_id=user.id,
            delivery_id=delivery.id,
            discount_applied=discount,
            cashback_earned=cashback
        )

        db.add(usage)

        # Mettre à jour le compteur d'utilisations
        promotion.current_uses += 1

        # Mettre à jour le budget utilisé
        promotion.budget_used += discount + cashback

        db.commit()

        return {
            "success": True,
            "discount_applied": discount,
            "cashback_earned": cashback,
            "final_amount": order_value - discount
        }

    @staticmethod
    def get_applicable_promotions(
        db: Session,
        user: User,
        order_value: float = 0,
        zone_id: Optional[int] = None
    ) -> List[Promotion]:
        """Récupérer les promotions applicables pour un utilisateur"""

        now = datetime.utcnow()

        query = db.query(Promotion).filter(
            and_(
                Promotion.status == PromotionStatus.active,
                Promotion.start_date <= now,
                Promotion.end_date >= now,
                or_(
                    Promotion.max_uses_total.is_(None),
                    Promotion.current_uses < Promotion.max_uses_total
                )
            )
        )

        promotions = query.all()
        applicable = []

        for promotion in promotions:
            eligibility = PromotionService.validate_promotion_eligibility(
                db, user, promotion, order_value
            )
            if eligibility["eligible"]:
                applicable.append(promotion)

        return applicable

    @staticmethod
    def check_auto_apply_promotions(
        db: Session,
        user: User,
        delivery: Delivery,
        order_value: float
    ) -> List[Dict[str, Any]]:
        """Vérifier et appliquer automatiquement les promotions éligibles"""

        auto_promotions = db.query(Promotion).filter(
            and_(
                Promotion.is_auto_apply == True,
                Promotion.status == PromotionStatus.active
            )
        ).all()

        applied_promotions = []

        for promotion in auto_promotions:
            result = PromotionService.apply_promotion(
                db, user, promotion, delivery, order_value
            )
            if result["success"]:
                applied_promotions.append({
                    "promotion": promotion,
                    "result": result
                })

        return applied_promotions