from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from ..models.delivery import Delivery, DeliveryStatus, DeliveryType, Bid, TrackingPoint, CollaborativeDelivery
from ..models.user import User, UserRole
from ..schemas.delivery import DeliveryCreate, DeliveryUpdate, StatusUpdate, BidCreate, TrackingPointCreate, CollaborativeDeliveryCreate, ExpressDeliveryCreate
from ..schemas.transport import VehicleRecommendationRequest, CargoCategory
from ..services.transport_service import TransportService
from ..core.exceptions import NotFoundError, BadRequestError, ForbiddenError, ConflictError
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

def get_delivery(db: Session, delivery_id: int) -> Delivery:
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise NotFoundError("Livraison non trouvée")
    return delivery

def get_deliveries(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[DeliveryStatus] = None,
    commune: Optional[str] = None,
    delivery_type: Optional[DeliveryType] = None
) -> List[Delivery]:
    query = db.query(Delivery)
    
    if status:
        query = query.filter(Delivery.status == status)
    
    if commune:
        query = query.filter(
            (Delivery.pickup_commune == commune) | (Delivery.delivery_commune == commune)
        )
    
    if delivery_type:
        query = query.filter(Delivery.delivery_type == delivery_type)
    
    return query.order_by(desc(Delivery.created_at)).offset(skip).limit(limit).all()

def get_deliveries_by_client(
    db: Session, 
    client_id: int, 
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[DeliveryStatus] = None
) -> List[Delivery]:
    query = db.query(Delivery).filter(Delivery.client_id == client_id)
    
    if status:
        query = query.filter(Delivery.status == status)
    
    return query.order_by(desc(Delivery.created_at)).offset(skip).limit(limit).all()

def get_deliveries_by_courier(
    db: Session, 
    courier_id: int, 
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[DeliveryStatus] = None
) -> List[Delivery]:
    query = db.query(Delivery).filter(Delivery.courier_id == courier_id)
    
    if status:
        query = query.filter(Delivery.status == status)
    
    return query.order_by(desc(Delivery.created_at)).offset(skip).limit(limit).all()

def create_delivery(db: Session, delivery_data: DeliveryCreate, client_id: int) -> Delivery:
    """
    Créer une nouvelle livraison.
    """
    # Vérifier si le prix proposé est supérieur au minimum
    if delivery_data.proposed_price < settings.MIN_DELIVERY_PRICE:
        raise BadRequestError(f"Le prix proposé doit être d'au moins {settings.MIN_DELIVERY_PRICE} FCFA")
    
    # Recommander un véhicule si nécessaire
    if delivery_data.cargo_category and not delivery_data.required_vehicle_type:
        try:
            transport_service = TransportService(db)
            recommendation_data = VehicleRecommendationRequest(
                cargo_category=delivery_data.cargo_category,
                distance=delivery_data.estimated_distance or 10,  # Valeur par défaut si non fournie
                weight=delivery_data.package_weight,
                is_fragile=delivery_data.is_fragile or False
            )
            recommendation = transport_service.recommend_vehicle(recommendation_data)
            
            # Appliquer le multiplicateur de prix
            delivery_data.proposed_price = delivery_data.proposed_price * recommendation["price_multiplier"]
            
            # Définir le type de véhicule requis
            delivery_data.required_vehicle_type = recommendation["recommended_vehicle"].type
        except Exception as e:
            # En cas d'erreur, continuer sans recommandation
            logger.error(f"Erreur lors de la recommandation de véhicule: {str(e)}")
    
    # Créer la livraison
    db_delivery = Delivery(
        client_id=client_id,
        **delivery_data.dict()
    )
    
    db.add(db_delivery)
    db.commit()
    db.refresh(db_delivery)
    
    # Notifier les coursiers disponibles (implémenté dans le service de notification)
    
    return db_delivery

def update_delivery(db: Session, delivery_id: int, delivery_data: DeliveryUpdate, user_id: int) -> Delivery:
    delivery = get_delivery(db, delivery_id)
    
    # Vérifier les autorisations
    if delivery.client_id != user_id and not db.query(User).filter(User.id == user_id, User.role == UserRole.manager).first():
        raise ForbiddenError("Vous n'êtes pas autorisé à modifier cette livraison")
    
    # Vérifier si la livraison peut être modifiée
    if delivery.status not in [DeliveryStatus.pending, DeliveryStatus.bidding]:
        raise BadRequestError("Cette livraison ne peut plus être modifiée")
    
    # Mettre à jour les champs fournis
    for key, value in delivery_data.dict(exclude_unset=True).items():
        setattr(delivery, key, value)
    
    db.commit()
    db.refresh(delivery)
    return delivery

def update_delivery_status(db: Session, delivery_id: int, status_data: StatusUpdate, user_id: int) -> Delivery:
    delivery = get_delivery(db, delivery_id)
    user = db.query(User).filter(User.id == user_id).first()
    
    # Vérifier les autorisations selon le rôle
    if user.role == UserRole.courier:
        if delivery.courier_id != user_id:
            raise ForbiddenError("Vous n'êtes pas le coursier assigné à cette livraison")
        
        # Vérifier les transitions d'état valides pour un coursier
        valid_transitions = {
            DeliveryStatus.accepted: [DeliveryStatus.in_progress],
            DeliveryStatus.in_progress: [DeliveryStatus.delivered],
        }
        
        if delivery.status not in valid_transitions or status_data.status not in valid_transitions.get(delivery.status, []):
            raise BadRequestError("Transition d'état non valide")
    
    elif user.role == UserRole.client:
        if delivery.client_id != user_id:
            raise ForbiddenError("Vous n'êtes pas le client de cette livraison")
        
        # Vérifier les transitions d'état valides pour un client
        valid_transitions = {
            DeliveryStatus.delivered: [DeliveryStatus.completed],
            DeliveryStatus.pending: [DeliveryStatus.cancelled],
            DeliveryStatus.bidding: [DeliveryStatus.cancelled],
        }
        
        if delivery.status not in valid_transitions or status_data.status not in valid_transitions.get(delivery.status, []):
            raise BadRequestError("Transition d'état non valide")
    
    elif user.role == UserRole.manager:
        # Les gestionnaires peuvent effectuer toutes les transitions
        pass
    
    else:
        raise ForbiddenError("Rôle non autorisé")
    
    # Mettre à jour le statut
    delivery.status = status_data.status
    
    # Mettre à jour les horodatages en fonction du statut
    if status_data.status == DeliveryStatus.accepted:
        delivery.accepted_at = datetime.utcnow()
    elif status_data.status == DeliveryStatus.in_progress:
        delivery.pickup_at = datetime.utcnow()
    elif status_data.status == DeliveryStatus.delivered:
        delivery.delivered_at = datetime.utcnow()
    elif status_data.status == DeliveryStatus.completed:
        delivery.completed_at = datetime.utcnow()
        
        # Calculer la durée réelle
        if delivery.pickup_at:
            delivery.actual_duration = int((datetime.utcnow() - delivery.pickup_at).total_seconds() / 60)
        
        # Mettre à jour les points du coursier (implémenté dans le service de gamification)
        
    elif status_data.status == DeliveryStatus.cancelled:
        delivery.cancelled_at = datetime.utcnow()
    
    db.commit()
    db.refresh(delivery)
    
    # Envoyer des notifications (implémenté dans le service de notification)
    
    return delivery

def create_bid(db: Session, delivery_id: int, courier_id: int, bid_data: BidCreate) -> Bid:
    delivery = get_delivery(db, delivery_id)
    
    # Vérifier si la livraison est disponible pour enchérir
    if delivery.status not in [DeliveryStatus.pending, DeliveryStatus.bidding]:
        raise BadRequestError("Cette livraison n'est plus disponible pour enchérir")
    
    # Vérifier si le coursier a déjà enchéri
    existing_bid = db.query(Bid).filter(
        Bid.delivery_id == delivery_id,
        Bid.courier_id == courier_id
    ).first()
    
    if existing_bid:
        # Mettre à jour l'enchère existante
        existing_bid.amount = bid_data.amount
        existing_bid.note = bid_data.note
        db.commit()
        db.refresh(existing_bid)
        bid = existing_bid
    else:
        # Créer une nouvelle enchère
        bid = Bid(
            delivery_id=delivery_id,
            courier_id=courier_id,
            amount=bid_data.amount,
            note=bid_data.note
        )
        db.add(bid)
        
        # Mettre à jour le statut de la livraison si c'est la première enchère
        if delivery.status == DeliveryStatus.pending:
            delivery.status = DeliveryStatus.bidding
            db.commit()
        
        db.commit()
        db.refresh(bid)
    
    # Notifier le client (implémenté dans le service de notification)
    
    return bid

def get_bids_for_delivery(db: Session, delivery_id: int) -> List[Bid]:
    delivery = get_delivery(db, delivery_id)
    return db.query(Bid).filter(Bid.delivery_id == delivery_id).all()

def accept_bid(db: Session, delivery_id: int, bid_id: int, client_id: int) -> Delivery:
    delivery = get_delivery(db, delivery_id)
    
    # Vérifier les autorisations
    if delivery.client_id != client_id:
        raise ForbiddenError("Vous n'êtes pas autorisé à accepter cette enchère")
    
    # Vérifier si la livraison est en attente d'acceptation
    if delivery.status != DeliveryStatus.bidding:
        raise BadRequestError("Cette livraison n'est plus en attente d'enchères")
    
    # Récupérer l'enchère
    bid = db.query(Bid).filter(Bid.id == bid_id, Bid.delivery_id == delivery_id).first()
    if not bid:
        raise NotFoundError("Enchère non trouvée")
    
    # Mettre à jour la livraison
    delivery.courier_id = bid.courier_id
    delivery.final_price = bid.amount
    delivery.status = DeliveryStatus.accepted
    delivery.accepted_at = datetime.utcnow()
    
    db.commit()
    db.refresh(delivery)
    
    # Notifier le coursier (implémenté dans le service de notification)
    
    return delivery

def add_tracking_point(db: Session, delivery_id: int, courier_id: int, tracking_data: TrackingPointCreate) -> TrackingPoint:
    delivery = get_delivery(db, delivery_id)
    
    # Vérifier les autorisations
    if delivery.courier_id != courier_id:
        raise ForbiddenError("Vous n'êtes pas le coursier assigné à cette livraison")
    
    # Vérifier si la livraison est en cours
    if delivery.status not in [DeliveryStatus.accepted, DeliveryStatus.in_progress]:
        raise BadRequestError("Cette livraison n'est pas en cours")
    
    # Créer le point de tracking
    tracking_point = TrackingPoint(
        delivery_id=delivery_id,
        lat=tracking_data.lat,
        lng=tracking_data.lng
    )
    
    db.add(tracking_point)
    db.commit()
    db.refresh(tracking_point)
    
    # Mettre à jour la position du coursier
    from ..services.user import update_courier_location
    update_courier_location(db, courier_id, tracking_data.lat, tracking_data.lng)
    
    return tracking_point

def get_tracking_points(db: Session, delivery_id: int) -> List[TrackingPoint]:
    delivery = get_delivery(db, delivery_id)
    return db.query(TrackingPoint).filter(TrackingPoint.delivery_id == delivery_id).order_by(TrackingPoint.timestamp).all()

def create_collaborative_delivery(db: Session, delivery_id: int, collaborative_data: CollaborativeDeliveryCreate) -> CollaborativeDelivery:
    delivery = get_delivery(db, delivery_id)
    
    # Vérifier si la livraison est de type collaboratif
    if delivery.delivery_type != DeliveryType.collaborative:
        delivery.delivery_type = DeliveryType.collaborative
    
    # Vérifier si le coursier est déjà associé à cette livraison
    existing = db.query(CollaborativeDelivery).filter(
        CollaborativeDelivery.delivery_id == delivery_id,
        CollaborativeDelivery.courier_id == collaborative_data.courier_id
    ).first()
    
    if existing:
        raise ConflictError("Ce coursier est déjà associé à cette livraison collaborative")
    
    # Créer l'association
    collab_delivery = CollaborativeDelivery(
        delivery_id=delivery_id,
        courier_id=collaborative_data.courier_id,
        role=collaborative_data.role,
        share_percentage=collaborative_data.share_percentage
    )
    
    db.add(collab_delivery)
    db.commit()
    db.refresh(collab_delivery)
    
    return collab_delivery

def create_express_delivery(db: Session, express_data: ExpressDeliveryCreate) -> Delivery:
    delivery = get_delivery(db, express_data.delivery_id)
    
    # Vérifier si la livraison peut être convertie en express
    if delivery.status != DeliveryStatus.pending:
        raise BadRequestError("Seules les livraisons en attente peuvent être converties en express")
    
    # Mettre à jour le type et le prix
    delivery.delivery_type = DeliveryType.express
    delivery.proposed_price += settings.EXPRESS_DELIVERY_SURCHARGE
    
    db.commit()
    db.refresh(delivery)
    
    # Créer une transaction pour le don (implémenté dans le service de portefeuille)
    donation_amount = settings.EXPRESS_DELIVERY_SURCHARGE * (express_data.donation_percentage / 100)
    
    return delivery
