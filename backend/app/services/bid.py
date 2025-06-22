from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime
from typing import List, Optional
import logging

from ..models.delivery import Delivery
from ..models.bid import Bid
from ..models.counter_offer import CounterOffer
from ..models.user import User

logger = logging.getLogger(__name__)

def get_bid(db: Session, bid_id: int) -> Optional[Bid]:
    """Récupérer une enchère par son ID"""
    return db.query(Bid).filter(Bid.id == bid_id).first()

def get_accepted_bid(db: Session, delivery_id: int) -> Optional[Bid]:
    """Récupérer l'enchère acceptée pour une livraison"""
    return db.query(Bid).filter(
        and_(
            Bid.delivery_id == delivery_id,
            Bid.status == 'accepted'
        )
    ).first()

def create_counter_offer(
    db: Session,
    original_bid_id: int,
    new_price: float,
    message: str,
    client_id: int
) -> CounterOffer:
    """Créer une contre-offre"""
    counter_offer = CounterOffer(
        original_bid_id=original_bid_id,
        new_price=new_price,
        message=message,
        status='pending',
        created_at=datetime.utcnow()
    )
    
    db.add(counter_offer)
    db.commit()
    db.refresh(counter_offer)
    
    return counter_offer

def get_counter_offer(db: Session, counter_offer_id: int) -> Optional[CounterOffer]:
    """Récupérer une contre-offre par son ID"""
    return db.query(CounterOffer).filter(CounterOffer.id == counter_offer_id).first()

def respond_to_counter_offer(
    db: Session,
    counter_offer_id: int,
    response_type: str,
    new_price: Optional[float] = None,
    message: str = "",
    courier_id: int = None
) -> CounterOffer:
    """Répondre à une contre-offre"""
    counter_offer = get_counter_offer(db, counter_offer_id)
    if not counter_offer:
        raise ValueError("Contre-offre non trouvée")
    
    counter_offer.status = response_type
    counter_offer.responded_at = datetime.utcnow()
    counter_offer.response_type = response_type
    counter_offer.courier_response_message = message
    
    if response_type == 'counter' and new_price:
        counter_offer.courier_response_price = new_price
    
    if response_type == 'accept':
        # Accepter la contre-offre et mettre à jour l'enchère originale
        original_bid = get_bid(db, counter_offer.original_bid_id)
        if original_bid:
            original_bid.status = 'accepted'
            original_bid.proposed_price = counter_offer.new_price
            original_bid.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(counter_offer)
    
    return counter_offer

def get_counter_offers_for_delivery(db: Session, delivery_id: int) -> List[CounterOffer]:
    """Récupérer toutes les contre-offres pour une livraison"""
    # Récupérer d'abord toutes les enchères de la livraison
    bids = db.query(Bid).filter(Bid.delivery_id == delivery_id).all()
    bid_ids = [bid.id for bid in bids]
    
    # Puis récupérer toutes les contre-offres liées à ces enchères
    counter_offers = db.query(CounterOffer).filter(
        CounterOffer.original_bid_id.in_(bid_ids)
    ).all()
    
    return counter_offers

def get_bids_for_delivery(db: Session, delivery_id: int) -> List[Bid]:
    """Récupérer toutes les enchères pour une livraison"""
    return db.query(Bid).filter(Bid.delivery_id == delivery_id).all()

def create_bid(
    db: Session,
    delivery_id: int,
    courier_id: int,
    proposed_price: float,
    estimated_duration: int = 30,
    message: str = ""
) -> Bid:
    """Créer une nouvelle enchère"""
    bid = Bid(
        delivery_id=delivery_id,
        courier_id=courier_id,
        proposed_price=proposed_price,
        estimated_duration=estimated_duration,
        message=message,
        status='pending',
        created_at=datetime.utcnow()
    )
    
    db.add(bid)
    db.commit()
    db.refresh(bid)
    
    return bid

def accept_bid(db: Session, bid_id: int, delivery_id: int) -> Bid:
    """Accepter une enchère"""
    bid = get_bid(db, bid_id)
    if not bid or bid.delivery_id != delivery_id:
        raise ValueError("Enchère non trouvée")
    
    # Marquer l'enchère comme acceptée
    bid.status = 'accepted'
    bid.updated_at = datetime.utcnow()
    
    # Rejeter toutes les autres enchères pour cette livraison
    other_bids = db.query(Bid).filter(
        and_(
            Bid.delivery_id == delivery_id,
            Bid.id != bid_id,
            Bid.status == 'pending'
        )
    ).all()
    
    for other_bid in other_bids:
        other_bid.status = 'rejected'
        other_bid.updated_at = datetime.utcnow()
    
    # Mettre à jour le statut de la livraison
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if delivery:
        delivery.status = 'accepted'
        delivery.courier_id = bid.courier_id
        delivery.final_price = bid.proposed_price
        delivery.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(bid)
    
    return bid

def decline_bid(db: Session, bid_id: int, delivery_id: int, reason: str = "") -> Bid:
    """Refuser une enchère"""
    bid = get_bid(db, bid_id)
    if not bid or bid.delivery_id != delivery_id:
        raise ValueError("Enchère non trouvée")
    
    bid.status = 'rejected'
    bid.message = reason
    bid.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(bid)
    
    return bid 