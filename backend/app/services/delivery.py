from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from ..models.delivery import Delivery, DeliveryStatus, DeliveryType, Bid, TrackingPoint
from ..models.collaborative_delivery import CollaborativeDelivery
from ..models.user import User, UserRole
from ..schemas.delivery import DeliveryCreate, DeliveryUpdate, StatusUpdate, BidCreate, TrackingPointCreate, CollaborativeDeliveryCreate, ExpressDeliveryCreate
from ..schemas.transport import VehicleRecommendationRequest, CargoCategory
from ..services.transport_service import TransportService
from ..core.exceptions import NotFoundError, BadRequestError, ForbiddenError, ConflictError
from ..core.config import settings
import logging
from app.services.maps import reverse_geocode, get_route_info, geocode_address

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
    Créer une nouvelle livraison avec toutes les données du frontend
    """
    from ..models.delivery import Delivery
    from ..schemas.delivery import DeliveryStatus, DeliveryType

    # Préparer les données pour la création
    delivery_dict = delivery_data.dict(exclude_unset=True)

    # Traitement des champs optionnels
    if not delivery_dict.get('proposed_price'):
        delivery_dict['proposed_price'] = 1000  # Prix par défaut

    # Mapper les types d'urgence
    if delivery_dict.get('urgency_level') == 'express':
        delivery_dict['delivery_type'] = DeliveryType.express
    else:
        delivery_dict['delivery_type'] = DeliveryType.standard

    # Assurer les champs requis
    required_fields = {
        'pickup_commune': delivery_dict.get('pickup_commune', 'Non spécifié'),
        'delivery_commune': delivery_dict.get('delivery_commune', 'Non spécifié'),
        'status': DeliveryStatus.pending
    }

    delivery_dict.update(required_fields)
    delivery_dict['client_id'] = client_id

    # Créer l'objet Delivery
    delivery = Delivery(**delivery_dict)

    db.add(delivery)
    db.commit()
    db.refresh(delivery)

    return delivery

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

def delete_delivery(db: Session, delivery_id: int) -> None:
    from app.models.delivery import Delivery

    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise ValueError("Delivery not found")

    db.delete(delivery)
    db.commit()


def get_user_deliveries(db: Session, user_id: int, role: UserRole, status: Optional[DeliveryStatus] = None) -> List[Delivery]:
    if role == UserRole.client:
        return get_deliveries_by_client(db, user_id, status=status)
    elif role == UserRole.courier:
        return get_deliveries_by_courier(db, user_id, status=status)
    else:
        raise ForbiddenError("Rôle non autorisé pour consulter les livraisons")

def get_user_deliveries_with_filters(
    db: Session, 
    user_id: int, 
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    commune: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
) -> List[Delivery]:
    """Récupérer les livraisons d'un utilisateur avec filtres avancés"""
    query = db.query(Delivery)

    # Filtrer par utilisateur (client ou coursier)
    query = query.filter(
        (Delivery.client_id == user_id) | (Delivery.courier_id == user_id)
    )

    # Filtrer par statut
    if status:
        query = query.filter(Delivery.status == status)

    # Filtrer par date de début
    if date_from:
        try:
            from_date = datetime.strptime(date_from, "%Y-%m-%d")
            query = query.filter(Delivery.created_at >= from_date)
        except ValueError:
            pass  # Ignorer si le format de date est invalide

    # Filtrer par date de fin
    if date_to:
        try:
            to_date = datetime.strptime(date_to, "%Y-%m-%d")
            query = query.filter(Delivery.created_at <= to_date)
        except ValueError:
            pass  # Ignorer si le format de date est invalide

    # Filtrer par commune (pickup ou delivery)
    if commune:
        query = query.filter(
            (Delivery.pickup_commune == commune) | (Delivery.delivery_commune == commune)
        )

    # Trier par date de création (plus récent en premier)
    query = query.order_by(Delivery.created_at.desc())

    # Pagination
    query = query.offset(skip).limit(limit)

    return query.all()

def get_bids(db: Session, delivery_id: Optional[int] = None, courier_id: Optional[int] = None) -> List[Bid]:
    query = db.query(Bid)
    if delivery_id:
        query = query.filter(Bid.delivery_id == delivery_id)
    if courier_id:
        query = query.filter(Bid.courier_id == courier_id)
    return query.all()

def get_bid(db: Session, bid_id: int) -> Bid:
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise NotFoundError("Enchère non trouvée")
    return bid

def get_collaborative_deliveries(db: Session, delivery_id: int) -> List[CollaborativeDelivery]:
    return db.query(CollaborativeDelivery).filter(CollaborativeDelivery.delivery_id == delivery_id).all()

def join_collaborative_delivery(db: Session, delivery_id: int, courier_id: int, share_percentage: float = 0.0) -> CollaborativeDelivery:
    delivery = get_delivery(db, delivery_id)
    if delivery.delivery_type != DeliveryType.collaborative:
        raise BadRequestError("Cette livraison n'est pas de type collaborative")

    existing = db.query(CollaborativeDelivery).filter(
        CollaborativeDelivery.delivery_id == delivery_id,
        CollaborativeDelivery.courier_id == courier_id
    ).first()
    if existing:
        raise ConflictError("Ce coursier a déjà rejoint cette livraison collaborative")

    participant = CollaborativeDelivery(
        delivery_id=delivery_id,
        courier_id=courier_id,
        role="participant",
        share_percentage=share_percentage
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant

def get_collaborative_delivery(db: Session, delivery_id: int, courier_id: int) -> CollaborativeDelivery:
    """
    Récupère une participation spécifique à une livraison collaborative.
    """
    collaborative_delivery = db.query(CollaborativeDelivery).filter(
        CollaborativeDelivery.delivery_id == delivery_id,
        CollaborativeDelivery.courier_id == courier_id
    ).first()
    if not collaborative_delivery:
        raise NotFoundError("Participation à la livraison collaborative non trouvée")
    return collaborative_delivery

def update_collaborative_delivery_status(db: Session, delivery_id: int, courier_id: int, status: str) -> CollaborativeDelivery:
    """
    Met à jour le statut d'un participant à une livraison collaborative.
    """
    collaborative_delivery = get_collaborative_delivery(db, delivery_id, courier_id)

    # TODO: Add validation for allowed status transitions if necessary
    collaborative_delivery.status = status 
    db.commit()
    db.refresh(collaborative_delivery)
    return collaborative_delivery

def calculate_collaborative_earnings(db: Session, delivery_id: int) -> Dict[str, Any]:
    """
    Calcule les gains pour chaque participant à une livraison collaborative.
    """
    delivery = get_delivery(db, delivery_id)
    if delivery.delivery_type != DeliveryType.collaborative:
        raise BadRequestError("Cette livraison n'est pas collaborative.")
    if delivery.status != DeliveryStatus.completed:
        raise BadRequestError("Les gains ne peuvent être calculés que pour les livraisons complétées.")
    if not delivery.final_price:
        raise BadRequestError("Le prix final de la livraison n'est pas défini.")

    participants = db.query(CollaborativeDelivery).filter(
        CollaborativeDelivery.delivery_id == delivery_id,
        CollaborativeDelivery.status == "completed" # Consider only completed participations
    ).all()

    if not participants:
        return {"total_earnings": 0, "participant_earnings": {}, "platform_fee": 0}

    total_share_percentage = sum(p.share_percentage for p in participants if p.share_percentage is not None)

    # If total_share_percentage is 0 or not well-defined, distribute equally or handle as an error
    # For now, let's assume shares are defined. If not, this logic might need adjustment.
    # Or, if shares are not defined, perhaps the earnings are not distributed via this mechanism.

    participant_earnings = {}
    total_distributed_amount = 0

    for p in participants:
        if p.share_percentage is not None and total_share_percentage > 0:
            # Ensure courier_id is a string for the dictionary key, as it might be an int
            participant_earnings[str(p.courier_id)] = (p.share_percentage / total_share_percentage) * delivery.final_price
            total_distributed_amount += participant_earnings[str(p.courier_id)]
        elif total_share_percentage == 0 and len(participants) > 0: # Equal distribution if no shares defined
             participant_earnings[str(p.courier_id)] = delivery.final_price / len(participants)
             total_distributed_amount += participant_earnings[str(p.courier_id)]
        else:
            participant_earnings[str(p.courier_id)] = 0


    # This is a simplified calculation. Platform fees, bonuses, etc., would make this more complex.
    # The current logic assumes the sum of share_percentage might not be 100%, 
    # and distributes proportionally to the defined shares.
    # If share_percentage is intended to be exact, validation for sum=100% should be elsewhere.

    return {
        "delivery_id": delivery_id,
        "total_delivery_price": delivery.final_price,
        "total_share_percentage_defined": total_share_percentage,
        "participant_earnings": participant_earnings,
        "total_distributed_to_participants": total_distributed_amount,
        "remaining_for_platform_or_adjustment": delivery.final_price - total_distributed_amount
    }

def estimate_delivery_price(
    pickup_latitude: float,
    pickup_longitude: float,
    delivery_latitude: float,
    delivery_longitude: float,
    package_weight: Optional[float] = None,
    cargo_category: Optional[str] = None,
    is_fragile: bool = False,
    is_express: bool = False
) -> Dict[str, Any]:
    """
    Estime le prix de livraison basé sur la distance et d'autres facteurs.
    """
    try:
        # Calculer la distance en utilisant la formule de Haversine
        import math

        def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
            """Calcule la distance entre deux points géographiques en kilomètres."""
            R = 6371  # Rayon de la Terre en kilomètres

            lat1_rad = math.radians(lat1)
            lon1_rad = math.radians(lon1)
            lat2_rad = math.radians(lat2)
            lon2_rad = math.radians(lon2)

            dlat = lat2_rad - lat1_rad
            dlon = lon2_rad - lon1_rad

            a = (math.sin(dlat/2)**2 + 
                 math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2)
            c = 2 * math.asin(math.sqrt(a))

            return R * c

        distance_km = haversine_distance(
            pickup_latitude, pickup_longitude,
            delivery_latitude, delivery_longitude
        )

        # Prix de base (FCFA)
        base_price = settings.MIN_DELIVERY_PRICE or 1000  # 1000 FCFA minimum

        # Prix par kilomètre
        price_per_km = 200  # 200 FCFA par km

        # Calcul du prix de base
        estimated_price = base_price + (distance_km * price_per_km)

        # Multiplicateurs selon les caractéristiques
        multipliers = {
            "base": 1.0,
            "weight": 1.0,
            "fragile": 1.0,
            "express": 1.0,
            "cargo_category": 1.0
        }

        # Multiplicateur pour le poids
        if package_weight:
            if package_weight > 20:  # Plus de 20kg
                multipliers["weight"] = 1.5
            elif package_weight > 10:  # Plus de 10kg
                multipliers["weight"] = 1.3
            elif package_weight > 5:  # Plus de 5kg
                multipliers["weight"] = 1.1

        # Multiplicateur pour objets fragiles
        if is_fragile:
            multipliers["fragile"] = 1.2

        # Multiplicateur pour livraison express
        if is_express:
            multipliers["express"] = 1.5

        # Multiplicateur selon la catégorie de cargo
        cargo_multipliers = {
            "FOOD": 1.1,
            "MEDICINE": 1.3,
            "ELECTRONICS": 1.2,
            "DOCUMENTS": 1.0,
            "CLOTHING": 1.0,
            "FURNITURE": 1.4,
            "OTHER": 1.0
        }

        if cargo_category and cargo_category in cargo_multipliers:
            multipliers["cargo_category"] = cargo_multipliers[cargo_category]

        # Appliquer tous les multiplicateurs
        total_multiplier = 1.0
        for key, multiplier in multipliers.items():
            total_multiplier *= multiplier

        final_price = estimated_price * total_multiplier

        # Arrondir au multiple de 50 FCFA supérieur
        final_price = math.ceil(final_price / 50) * 50

        # Estimation du temps de livraison (en minutes)
        # Vitesse moyenne en ville: 25 km/h
        estimated_time_minutes = max(15, int((distance_km / 25) * 60))

        # Ajouter du temps selon les facteurs
        if is_fragile:
            estimated_time_minutes += 10
        if package_weight and package_weight > 10:
            estimated_time_minutes += 5

        return {
            "estimated_price": int(final_price),
            "distance_km": round(distance_km, 2),
            "estimated_time_minutes": estimated_time_minutes,
            "price_breakdown": {
                "base_price": base_price,
                "distance_price": distance_km * price_per_km,
                "multipliers_applied": multipliers,
                "total_multiplier": round(total_multiplier, 2)
            },
            "factors": {
                "weight_kg": package_weight,
                "is_fragile": is_fragile,
                "is_express": is_express,
                "cargo_category": cargo_category
            }
        }

    except Exception as e:
        logger.error(f"Erreur lors de l'estimation du prix: {str(e)}")
        # Retourner un prix par défaut en cas d'erreur
        return {
            "estimated_price": settings.MIN_DELIVERY_PRICE or 1000,
            "distance_km": 0,
            "estimated_time_minutes": 30,
            "error": "Impossible de calculer l'estimation précise",
            "price_breakdown": {},
            "factors": {}
        }

def get_active_deliveries_for_client(db: Session, client_id: int) -> List[Delivery]:
    """
    Récupère toutes les livraisons actives d'un client.
    Les livraisons actives sont celles qui ne sont pas annulées ou complétées.
    """
    active_statuses = [
        DeliveryStatus.PENDING,
        DeliveryStatus.CONFIRMED,
        DeliveryStatus.PICKED_UP,
        DeliveryStatus.IN_TRANSIT,
        DeliveryStatus.NEAR_DESTINATION
    ]

    return db.query(Delivery).filter(
        Delivery.client_id == client_id,
        Delivery.status.in_(active_statuses)
    ).order_by(desc(Delivery.created_at)).all()

def get_courier_deliveries(
    db: Session,
    courier_id: int,
    status: Optional[DeliveryStatus] = None,
    limit: int = 50,
    skip: int = 0
) -> List[Delivery]:
    """
    Récupère les livraisons d'un coursier
    """
    try:
        query = db.query(Delivery).filter(Delivery.courier_id == courier_id)

        if status:
            query = query.filter(Delivery.status == status)

        deliveries = query.order_by(Delivery.created_at.desc()).offset(skip).limit(limit).all()
        return deliveries
    except Exception as e:
        raise Exception(f"Erreur lors de la récupération des livraisons du coursier: {str(e)}")

def get_delivery_analytics(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Récupère les analyses des livraisons
    """
    try:
        query = db.query(Delivery)

        if start_date:
            query = query.filter(Delivery.created_at >= start_date)
        if end_date:
            query = query.filter(Delivery.created_at <= end_date)

        deliveries = query.all()

        total_deliveries = len(deliveries)
        completed_deliveries = len([d for d in deliveries if d.status == DeliveryStatus.completed])
        cancelled_deliveries = len([d for d in deliveries if d.status == DeliveryStatus.cancelled])

        total_revenue = sum([d.final_price or 0 for d in deliveries if d.status == DeliveryStatus.completed])

        return {
            "total_deliveries": total_deliveries,
            "completed_deliveries": completed_deliveries,
            "cancelled_deliveries": cancelled_deliveries,
            "completion_rate": (completed_deliveries / total_deliveries * 100) if total_deliveries > 0 else 0,
            "total_revenue": total_revenue,
            "average_delivery_value": (total_revenue / completed_deliveries) if completed_deliveries > 0 else 0
        }
    except Exception as e:
        raise Exception(f"Erreur lors de la récupération des analyses: {str(e)}")