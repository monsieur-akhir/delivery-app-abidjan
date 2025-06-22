
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from ..db.session import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..schemas.multi_destination_delivery import (
    MultiDestinationDeliveryCreate, MultiDestinationDeliveryResponse,
    MultiDestinationBidCreate, MultiDestinationBidResponse,
    StopStatusUpdate, RouteOptimizationResponse
)
from ..services.multi_destination_delivery import MultiDestinationDeliveryService

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/multi-destination-deliveries", response_model=MultiDestinationDeliveryResponse)
async def create_multi_destination_delivery(
    delivery_data: MultiDestinationDeliveryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une nouvelle livraison multi-destinataires"""
    if current_user.role not in ["client", "business"]:
        raise HTTPException(status_code=403, detail="Seuls les clients peuvent créer des livraisons")
    
    try:
        service = MultiDestinationDeliveryService(db)
        delivery = service.create_delivery(delivery_data, current_user.id)
        
        return MultiDestinationDeliveryResponse.from_orm(delivery)
        
    except Exception as e:
        logger.error(f"Erreur création livraison multi-destinataires: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Erreur lors de la création: {str(e)}")

@router.get("/multi-destination-deliveries", response_model=List[MultiDestinationDeliveryResponse])
async def get_multi_destination_deliveries(
    status: Optional[str] = Query(None, description="Filtrer par statut"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les livraisons multi-destinataires de l'utilisateur"""
    try:
        service = MultiDestinationDeliveryService(db)
        deliveries = service.get_user_deliveries(current_user.id, current_user.role)
        
        if status:
            deliveries = [d for d in deliveries if d.status == status]
        
        return [MultiDestinationDeliveryResponse.from_orm(d) for d in deliveries]
        
    except Exception as e:
        logger.error(f"Erreur récupération livraisons: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération")

@router.get("/multi-destination-deliveries/{delivery_id}", response_model=MultiDestinationDeliveryResponse)
async def get_multi_destination_delivery(
    delivery_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer une livraison multi-destinataires par ID"""
    try:
        service = MultiDestinationDeliveryService(db)
        delivery = service.get_delivery(delivery_id)
        
        if not delivery:
            raise HTTPException(status_code=404, detail="Livraison non trouvée")
        
        # Vérifier les permissions
        if current_user.role not in ["admin", "manager"]:
            if delivery.client_id != current_user.id and delivery.courier_id != current_user.id:
                raise HTTPException(status_code=403, detail="Accès non autorisé")
        
        return MultiDestinationDeliveryResponse.from_orm(delivery)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur récupération livraison: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération")

@router.get("/multi-destination-deliveries/available", response_model=List[MultiDestinationDeliveryResponse])
async def get_available_multi_destination_deliveries(
    commune: Optional[str] = Query(None, description="Filtrer par commune"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les livraisons multi-destinataires disponibles pour les coursiers"""
    if current_user.role != "courier":
        raise HTTPException(status_code=403, detail="Seuls les coursiers peuvent voir les livraisons disponibles")
    
    try:
        service = MultiDestinationDeliveryService(db)
        deliveries = service.get_available_deliveries(commune)
        
        return [MultiDestinationDeliveryResponse.from_orm(d) for d in deliveries]
        
    except Exception as e:
        logger.error(f"Erreur récupération livraisons disponibles: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération")

@router.post("/multi-destination-deliveries/{delivery_id}/bids", response_model=MultiDestinationBidResponse)
async def create_multi_destination_bid(
    delivery_id: int,
    bid_data: MultiDestinationBidCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une enchère pour une livraison multi-destinataires"""
    if current_user.role != "courier":
        raise HTTPException(status_code=403, detail="Seuls les coursiers peuvent créer des enchères")
    
    try:
        service = MultiDestinationDeliveryService(db)
        delivery = service.get_delivery(delivery_id)
        
        if not delivery:
            raise HTTPException(status_code=404, detail="Livraison non trouvée")
        
        if delivery.status != "pending":
            raise HTTPException(status_code=400, detail="Cette livraison n'accepte plus d'enchères")
        
        bid = service.create_bid(delivery_id, current_user.id, bid_data.dict())
        
        return MultiDestinationBidResponse.from_orm(bid)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur création enchère: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Erreur lors de la création: {str(e)}")

@router.post("/multi-destination-deliveries/{delivery_id}/bids/{bid_id}/accept")
async def accept_multi_destination_bid(
    delivery_id: int,
    bid_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accepter une enchère pour une livraison multi-destinataires"""
    try:
        service = MultiDestinationDeliveryService(db)
        delivery = service.accept_bid(delivery_id, bid_id, current_user.id)
        
        return {"message": "Enchère acceptée avec succès", "delivery_id": delivery.id}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erreur acceptation enchère: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'acceptation")

@router.post("/multi-destination-deliveries/{delivery_id}/start")
async def start_multi_destination_delivery(
    delivery_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Démarrer une livraison multi-destinataires"""
    if current_user.role != "courier":
        raise HTTPException(status_code=403, detail="Seuls les coursiers peuvent démarrer des livraisons")
    
    try:
        service = MultiDestinationDeliveryService(db)
        delivery = service.start_delivery(delivery_id, current_user.id)
        
        return {"message": "Livraison démarrée avec succès", "delivery_id": delivery.id}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erreur démarrage livraison: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors du démarrage")

@router.put("/multi-destination-deliveries/{delivery_id}/stops/{stop_id}/status")
async def update_stop_status(
    delivery_id: int,
    stop_id: int,
    status_update: StopStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour le statut d'un arrêt"""
    if current_user.role != "courier":
        raise HTTPException(status_code=403, detail="Seuls les coursiers peuvent mettre à jour le statut")
    
    try:
        service = MultiDestinationDeliveryService(db)
        stop = service.update_stop_status(delivery_id, stop_id, status_update, current_user.id)
        
        return {"message": "Statut mis à jour avec succès", "stop_id": stop.id, "status": stop.status}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erreur mise à jour statut: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de la mise à jour")

@router.post("/multi-destination-deliveries/{delivery_id}/stops/{stop_id}/proof")
async def upload_proof_of_delivery(
    delivery_id: int,
    stop_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Télécharger une preuve de livraison pour un arrêt"""
    if current_user.role != "courier":
        raise HTTPException(status_code=403, detail="Seuls les coursiers peuvent télécharger des preuves")
    
    try:
        # Ici, vous implémenteriez le stockage du fichier
        # Pour l'exemple, on simule juste une URL
        file_url = f"/uploads/proof/{delivery_id}_{stop_id}_{file.filename}"
        
        # Mettre à jour le stop avec l'URL de la preuve
        service = MultiDestinationDeliveryService(db)
        status_update = StopStatusUpdate(
            status="delivered",
            proof_of_delivery_url=file_url
        )
        stop = service.update_stop_status(delivery_id, stop_id, status_update, current_user.id)
        
        return {"message": "Preuve téléchargée avec succès", "proof_url": file_url}
        
    except Exception as e:
        logger.error(f"Erreur téléchargement preuve: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors du téléchargement")
