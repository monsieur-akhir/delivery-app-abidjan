
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..db.session import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..schemas.negotiation import (
    NegotiationCreate, CounterOfferCreate, NegotiationResponse, 
    NegotiationDetail, NegotiationHistory
)
from ..services.negotiation import NegotiationService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/negotiations", response_model=NegotiationDetail)
async def create_negotiation(
    negotiation_data: NegotiationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une nouvelle négociation pour une livraison planifiée"""
    
    try:
        # Pour l'instant, on assume que c'est le client qui fait l'offre initiale
        # Le courier_id devra être fourni via les paramètres de la requête
        
        # TODO: Récupérer le courier_id depuis la planification ou les paramètres
        negotiation = NegotiationService.create_initial_negotiation(
            db, current_user.id, 0, negotiation_data  # courier_id à définir
        )
        
        return negotiation
        
    except Exception as e:
        logger.error(f"Erreur création négociation: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/negotiations/{negotiation_id}/counter-offer", response_model=NegotiationDetail)
async def create_counter_offer(
    negotiation_id: int,
    counter_data: CounterOfferCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Faire une contre-offre"""
    
    try:
        counter_data.parent_negotiation_id = negotiation_id
        counter_offer = NegotiationService.create_counter_offer(db, current_user.id, counter_data)
        return counter_offer
        
    except Exception as e:
        logger.error(f"Erreur contre-offre: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/negotiations/{negotiation_id}/respond", response_model=NegotiationDetail)
async def respond_to_negotiation(
    negotiation_id: int,
    response: NegotiationResponse,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Répondre à une négociation (accepter ou refuser)"""
    
    try:
        negotiation = NegotiationService.respond_to_negotiation(
            db, current_user.id, negotiation_id, response
        )
        return negotiation
        
    except Exception as e:
        logger.error(f"Erreur réponse négociation: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/negotiations/pending", response_model=List[NegotiationDetail])
async def get_pending_negotiations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les négociations en attente pour l'utilisateur"""
    
    try:
        negotiations = NegotiationService.get_pending_negotiations_for_user(db, current_user.id)
        return negotiations
        
    except Exception as e:
        logger.error(f"Erreur récupération négociations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/negotiations/history/{scheduled_delivery_id}", response_model=List[NegotiationDetail])
async def get_negotiation_history(
    scheduled_delivery_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer l'historique des négociations pour une livraison planifiée"""
    
    try:
        # Vérifier les permissions (le client ou les coursiers impliqués)
        negotiations = NegotiationService.get_negotiation_history(db, scheduled_delivery_id)
        
        # Filtrer pour ne montrer que celles où l'utilisateur est impliqué
        user_negotiations = [
            n for n in negotiations 
            if n.client_id == current_user.id or n.courier_id == current_user.id
        ]
        
        return user_negotiations
        
    except Exception as e:
        logger.error(f"Erreur historique négociations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/negotiations/expire-old")
async def expire_old_negotiations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Faire expirer les anciennes négociations (admin seulement)"""
    
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Seuls les administrateurs peuvent déclencher l'expiration")
    
    try:
        NegotiationService.expire_old_negotiations(db)
        return {"success": True, "message": "Négociations expirées traitées"}
        
    except Exception as e:
        logger.error(f"Erreur expiration négociations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
