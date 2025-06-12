Adding courier management endpoints and matching functionalities to the delivery API.
```

```python
from ..services.delivery import get_delivery, get_courier_deliveries
from ..services.matching import MatchingService

@router.get("/deliveries/{delivery_id}/suggested-couriers")
async def get_suggested_couriers(
    delivery_id: int,
    max_distance: float = Query(10.0, description="Distance maximale en km"),
    limit: int = Query(5, description="Nombre maximum de coursiers"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir les coursiers suggérés pour une livraison"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")

    # Vérifier que l'utilisateur peut voir cette livraison
    if current_user.role not in ["manager", "admin"] and delivery.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    suggested_couriers = MatchingService.find_best_couriers(
        db, delivery, max_distance, limit
    )

    return {
        "delivery_id": delivery_id,
        "suggested_couriers": suggested_couriers
    }

@router.post("/deliveries/{delivery_id}/auto-assign")
async def auto_assign_delivery(
    delivery_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Assigner automatiquement la livraison au meilleur coursier"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")

    # Vérifier les permissions
    if current_user.role not in ["manager", "admin"] and delivery.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    if delivery.status != "pending":
        raise HTTPException(status_code=400, detail="Livraison déjà assignée")

    assigned_courier_id = MatchingService.auto_assign_delivery(db, delivery_id)

    if assigned_courier_id:
        return {
            "message": "Livraison assignée automatiquement",
            "courier_id": assigned_courier_id,
            "delivery_id": delivery_id
        }
    else:
        raise HTTPException(
            status_code=404, 
            detail="Aucun coursier disponible trouvé"
        )

@router.post("/deliveries/{delivery_id}/client-confirm")
async def client_confirm_delivery(
    delivery_id: int,
    confirm_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Confirmer la livraison côté client avec notation"""
```from ..services.delivery import get_delivery, get_courier_deliveries
from ..services.matching import MatchingService

@router.get("/deliveries/{delivery_id}/suggested-couriers")
async def get_suggested_couriers(
    delivery_id: int,
    max_distance: float = Query(10.0, description="Distance maximale en km"),
    limit: int = Query(5, description="Nombre maximum de coursiers"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir les coursiers suggérés pour une livraison"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")

    # Vérifier que l'utilisateur peut voir cette livraison
    if current_user.role not in ["manager", "admin"] and delivery.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    suggested_couriers = MatchingService.find_best_couriers(
        db, delivery, max_distance, limit
    )

    return {
        "delivery_id": delivery_id,
        "suggested_couriers": suggested_couriers
    }

@router.post("/deliveries/{delivery_id}/auto-assign")
async def auto_assign_delivery(
    delivery_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Assigner automatiquement la livraison au meilleur coursier"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")

    # Vérifier les permissions
    if current_user.role not in ["manager", "admin"] and delivery.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    if delivery.status != "pending":
        raise HTTPException(status_code=400, detail="Livraison déjà assignée")

    assigned_courier_id = MatchingService.auto_assign_delivery(db, delivery_id)

    if assigned_courier_id:
        return {
            "message": "Livraison assignée automatiquement",
            "courier_id": assigned_courier_id,
            "delivery_id": delivery_id
        }
    else:
        raise HTTPException(
            status_code=404, 
            detail="Aucun coursier disponible trouvé"
        )

@router.post("/deliveries/{delivery_id}/client-confirm")
async def client_confirm_delivery(
    delivery_id: int,
    confirm_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Confirmer la livraison côté client avec notation"""