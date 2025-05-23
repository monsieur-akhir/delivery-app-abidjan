from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from app.models.collaborative_delivery import CollaborativeDelivery, CollaborativeMessage, CollaborativeEarning
from app.models.delivery import Delivery, DeliveryStatus
from app.models.user import User
from app.schemas.collaborative import (
    CollaborativeDeliveryCreate, CollaborativeDeliveryUpdate,
    CollaborativeMessageCreate, CollaborativeEarningCreate,
    JoinDeliveryRequest, CollaborativeRole, CollaborativeStatus
)
from app.core.exceptions import NotFoundError, BadRequestError, ForbiddenError


def get_collaborative_deliveries(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    courier_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    """Récupérer les livraisons collaboratives avec leurs détails"""
    query = db.query(Delivery).filter(Delivery.delivery_type == "collaborative")
    
    if status:
        query = query.filter(Delivery.status == status)
    
    if courier_id:
        query = query.join(CollaborativeDelivery).filter(
            CollaborativeDelivery.courier_id == courier_id
        )
    
    deliveries = query.offset(skip).limit(limit).all()
    
    result = []
    for delivery in deliveries:
        collaborators = db.query(CollaborativeDelivery).filter(
            CollaborativeDelivery.delivery_id == delivery.id
        ).all()
        
        result.append({
            "id": delivery.id,
            "pickup_address": delivery.pickup_address,
            "delivery_address": delivery.delivery_address,
            "status": delivery.status,
            "final_price": delivery.final_price or delivery.proposed_price,
            "created_at": delivery.created_at,
            "collaborators": [
                {
                    "courier_id": c.courier_id,
                    "courier_name": c.courier.full_name if c.courier else "Inconnu",
                    "role": c.role,
                    "share_percentage": c.share_percentage,
                    "status": c.status,
                    "profile_picture": c.courier.profile_picture_url if c.courier else None
                }
                for c in collaborators
            ]
        })
    
    return result


def get_collaborative_delivery_details(db: Session, delivery_id: int) -> Dict[str, Any]:
    """Récupérer les détails complets d'une livraison collaborative"""
    delivery = db.query(Delivery).filter(
        Delivery.id == delivery_id,
        Delivery.delivery_type == "collaborative"
    ).first()
    
    if not delivery:
        raise NotFoundError("Livraison collaborative non trouvée")
    
    # Récupérer les collaborateurs
    collaborators = db.query(CollaborativeDelivery).filter(
        CollaborativeDelivery.delivery_id == delivery_id
    ).all()
    
    # Récupérer les messages
    messages = db.query(CollaborativeMessage).filter(
        CollaborativeMessage.delivery_id == delivery_id
    ).order_by(CollaborativeMessage.created_at.desc()).limit(50).all()
    
    # Récupérer les gains
    earnings = db.query(CollaborativeEarning).filter(
        CollaborativeEarning.delivery_id == delivery_id
    ).all()
    
    return {
        "delivery": {
            "id": delivery.id,
            "pickup_address": delivery.pickup_address,
            "pickup_commune": delivery.pickup_commune,
            "pickup_lat": delivery.pickup_lat,
            "pickup_lng": delivery.pickup_lng,
            "delivery_address": delivery.delivery_address,
            "delivery_commune": delivery.delivery_commune,
            "delivery_lat": delivery.delivery_lat,
            "delivery_lng": delivery.delivery_lng,
            "description": delivery.package_description,
            "status": delivery.status,
            "proposed_price": delivery.proposed_price,
            "final_price": delivery.final_price,
            "created_at": delivery.created_at,
            "estimated_time": delivery.estimated_duration
        },
        "collaborators": [
            {
                "id": c.id,
                "courier_id": c.courier_id,
                "courier_name": c.courier.full_name if c.courier else "Inconnu",
                "role": c.role,
                "share_percentage": c.share_percentage,
                "status": c.status,
                "joined_at": c.joined_at,
                "earnings": c.earnings,
                "profile_picture": c.courier.profile_picture_url if c.courier else None
            }
            for c in collaborators
        ],
        "messages": [
            {
                "id": m.id,
                "courier_id": m.courier_id,
                "courier_name": m.courier.full_name if m.courier else "Inconnu",
                "message": m.message,
                "message_type": m.message_type,
                "created_at": m.created_at,
                "profile_picture": m.courier.profile_picture_url if m.courier else None
            }
            for m in messages
        ],
        "earnings": [
            {
                "id": e.id,
                "courier_id": e.courier_id,
                "courier_name": e.courier.full_name if e.courier else "Inconnu",
                "role": e.role,
                "base_amount": e.base_amount,
                "bonus_amount": e.bonus_amount,
                "penalty_amount": e.penalty_amount,
                "final_amount": e.final_amount,
                "share_percentage": e.share_percentage,
                "payment_status": e.payment_status
            }
            for e in earnings
        ]
    }


def join_collaborative_delivery(
    db: Session,
    delivery_id: int,
    courier_id: int,
    join_request: JoinDeliveryRequest
) -> CollaborativeDelivery:
    """Rejoindre une livraison collaborative"""
    # Vérifier que la livraison existe et est collaborative
    delivery = db.query(Delivery).filter(
        Delivery.id == delivery_id,
        Delivery.delivery_type == "collaborative"
    ).first()
    
    if not delivery:
        raise NotFoundError("Livraison collaborative non trouvée")
    
    if delivery.status not in ["pending", "bidding"]:
        raise BadRequestError("Cette livraison n'accepte plus de nouveaux participants")
    
    # Vérifier que le coursier n'est pas déjà participant
    existing = db.query(CollaborativeDelivery).filter(
        CollaborativeDelivery.delivery_id == delivery_id,
        CollaborativeDelivery.courier_id == courier_id
    ).first()
    
    if existing:
        raise BadRequestError("Vous participez déjà à cette livraison")
    
    # Vérifier les contraintes de rôle
    existing_roles = db.query(CollaborativeDelivery.role).filter(
        CollaborativeDelivery.delivery_id == delivery_id
    ).all()
    existing_roles = [r[0] for r in existing_roles]
    
    if join_request.role == CollaborativeRole.PRIMARY and "primary" in existing_roles:
        raise BadRequestError("Un coursier principal est déjà assigné à cette livraison")
    
    # Vérifier que le total des pourcentages ne dépasse pas 100%
    total_percentage = db.query(func.sum(CollaborativeDelivery.share_percentage)).filter(
        CollaborativeDelivery.delivery_id == delivery_id
    ).scalar() or 0
    
    if total_percentage + join_request.share_percentage > 100:
        raise BadRequestError(f"Le pourcentage total dépasserait 100% (actuellement {total_percentage}%)")
    
    # Créer la participation
    collaboration = CollaborativeDelivery(
        delivery_id=delivery_id,
        courier_id=courier_id,
        role=join_request.role.value,
        share_percentage=join_request.share_percentage,
        notes=join_request.notes,
        status=CollaborativeStatus.PENDING.value
    )
    
    db.add(collaboration)
    db.commit()
    db.refresh(collaboration)
    
    return collaboration


def send_collaborative_message(
    db: Session,
    delivery_id: int,
    courier_id: int,
    message_data: CollaborativeMessageCreate
) -> CollaborativeMessage:
    """Envoyer un message dans le chat collaboratif"""
    # Vérifier que le coursier participe à cette livraison
    collaboration = db.query(CollaborativeDelivery).filter(
        CollaborativeDelivery.delivery_id == delivery_id,
        CollaborativeDelivery.courier_id == courier_id
    ).first()
    
    if not collaboration:
        raise ForbiddenError("Vous ne participez pas à cette livraison")
    
    message = CollaborativeMessage(
        delivery_id=delivery_id,
        courier_id=courier_id,
        message=message_data.message,
        message_type=message_data.message_type.value,
        metadata=message_data.metadata
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    return message


def calculate_collaborative_earnings(db: Session, delivery_id: int) -> Dict[str, Any]:
    """Calculer les gains pour une livraison collaborative"""
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise NotFoundError("Livraison non trouvée")
    
    collaborators = db.query(CollaborativeDelivery).filter(
        CollaborativeDelivery.delivery_id == delivery_id,
        CollaborativeDelivery.status == CollaborativeStatus.COMPLETED.value
    ).all()
    
    if not collaborators:
        raise BadRequestError("Aucun collaborateur n'a terminé cette livraison")
    
    total_amount = delivery.final_price or delivery.proposed_price
    platform_fee = total_amount * 0.1  # 10% de frais de plateforme
    distributable_amount = total_amount - platform_fee
    
    earnings = {}
    total_distributed = 0
    
    for collaborator in collaborators:
        # Calcul de base selon le pourcentage
        base_amount = distributable_amount * (collaborator.share_percentage / 100)
        
        # Bonus selon le rôle
        bonus_amount = 0
        if collaborator.role == "primary":
            bonus_amount = base_amount * 0.1  # 10% de bonus pour le principal
        
        # Pénalités (à implémenter selon les critères)
        penalty_amount = 0
        
        final_amount = base_amount + bonus_amount - penalty_amount
        total_distributed += final_amount
        
        earnings[str(collaborator.courier_id)] = {
            "courier_id": collaborator.courier_id,
            "courier_name": collaborator.courier.full_name if collaborator.courier else "Inconnu",
            "role": collaborator.role,
            "share_percentage": collaborator.share_percentage,
            "base_amount": base_amount,
            "bonus_amount": bonus_amount,
            "penalty_amount": penalty_amount,
            "final_amount": final_amount
        }
    
    return {
        "delivery_id": delivery_id,
        "total_amount": total_amount,
        "platform_fee": platform_fee,
        "distributable_amount": distributable_amount,
        "total_distributed": total_distributed,
        "participant_earnings": earnings
    }


def distribute_collaborative_earnings(db: Session, delivery_id: int) -> bool:
    """Distribuer les gains aux participants"""
    earnings_data = calculate_collaborative_earnings(db, delivery_id)
    
    for courier_id, earning_info in earnings_data["participant_earnings"].items():
        # Créer l'enregistrement des gains
        earning = CollaborativeEarning(
            delivery_id=delivery_id,
            courier_id=int(courier_id),
            role=earning_info["role"],
            base_amount=earning_info["base_amount"],
            bonus_amount=earning_info["bonus_amount"],
            penalty_amount=earning_info["penalty_amount"],
            final_amount=earning_info["final_amount"],
            share_percentage=earning_info["share_percentage"],
            payment_status="pending"
        )
        
        db.add(earning)
        
        # Mettre à jour les gains dans la table collaborative_deliveries
        collaboration = db.query(CollaborativeDelivery).filter(
            CollaborativeDelivery.delivery_id == delivery_id,
            CollaborativeDelivery.courier_id == int(courier_id)
        ).first()
        
        if collaboration:
            collaboration.earnings = earning_info["final_amount"]
    
    db.commit()
    return True


def get_collaborative_stats(db: Session, courier_id: Optional[int] = None) -> Dict[str, Any]:
    """Récupérer les statistiques des livraisons collaboratives"""
    base_query = db.query(Delivery).filter(Delivery.delivery_type == "collaborative")
    
    if courier_id:
        base_query = base_query.join(CollaborativeDelivery).filter(
            CollaborativeDelivery.courier_id == courier_id
        )
    
    total_deliveries = base_query.count()
    active_deliveries = base_query.filter(
        Delivery.status.in_(["pending", "bidding", "accepted", "in_progress"])
    ).count()
    completed_deliveries = base_query.filter(Delivery.status == "completed").count()
    
    # Calcul des gains totaux
    total_earnings = db.query(func.sum(CollaborativeEarning.final_amount)).scalar() or 0
    
    # Taille moyenne des équipes
    avg_team_size = db.query(func.avg(
        db.query(func.count(CollaborativeDelivery.id)).filter(
            CollaborativeDelivery.delivery_id == Delivery.id
        ).scalar_subquery()
    )).filter(Delivery.delivery_type == "collaborative").scalar() or 0
    
    # Taux de succès
    success_rate = (completed_deliveries / total_deliveries * 100) if total_deliveries > 0 else 0
    
    return {
        "total_deliveries": total_deliveries,
        "active_deliveries": active_deliveries,
        "completed_deliveries": completed_deliveries,
        "total_earnings": total_earnings,
        "average_team_size": round(avg_team_size, 1),
        "success_rate": round(success_rate, 1)
    }
