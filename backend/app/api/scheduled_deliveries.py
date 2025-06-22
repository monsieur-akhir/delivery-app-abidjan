
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from ..db.session import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..schemas import scheduled_delivery as scheduled_schemas
from ..services.scheduled_delivery import ScheduledDeliveryService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/scheduled-deliveries", response_model=scheduled_schemas.ScheduledDeliveryResponse)
async def create_scheduled_delivery(
    schedule_data: scheduled_schemas.ScheduledDeliveryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une nouvelle livraison planifiée et chercher un coursier immédiatement"""
    
    if current_user.role not in ["client", "business"]:
        raise HTTPException(status_code=403, detail="Seuls les clients et entreprises peuvent planifier des livraisons")
    
    try:
        # Créer la planification
        schedule = ScheduledDeliveryService.create_scheduled_delivery(db, schedule_data, current_user.id)
        
        # Chercher un coursier disponible immédiatement
        from ..services.matching import MatchingService
        from ..models.delivery import Delivery
        
        # Créer un objet delivery temporaire pour le matching
        temp_delivery = Delivery(
            pickup_lat=schedule.pickup_lat,
            pickup_lng=schedule.pickup_lng,
            delivery_lat=schedule.delivery_lat,
            delivery_lng=schedule.delivery_lng,
            proposed_price=schedule.proposed_price,
            required_vehicle_type=schedule.required_vehicle_type,
            package_description=schedule.package_description,
            package_size=schedule.package_size,
            delivery_type=schedule.delivery_type
        )
        
        # Trouver les meilleurs coursiers disponibles
        available_couriers = MatchingService.find_best_couriers(db, temp_delivery, limit=5)
        
        if available_couriers:
            # Notifier les coursiers de cette nouvelle planification
            ScheduledDeliveryService.notify_couriers_for_scheduling(db, schedule, available_couriers)
            
        return {
            "id": schedule.id,
            "client_id": schedule.client_id,
            "title": schedule.title,
            "description": schedule.description,
            "pickup_address": schedule.pickup_address,
            "pickup_commune": schedule.pickup_commune,
            "pickup_lat": schedule.pickup_lat,
            "pickup_lng": schedule.pickup_lng,
            "pickup_contact_name": schedule.pickup_contact_name,
            "pickup_contact_phone": schedule.pickup_contact_phone,
            "pickup_instructions": schedule.pickup_instructions,
            "delivery_address": schedule.delivery_address,
            "delivery_commune": schedule.delivery_commune,
            "delivery_lat": schedule.delivery_lat,
            "delivery_lng": schedule.delivery_lng,
            "delivery_contact_name": schedule.delivery_contact_name,
            "delivery_contact_phone": schedule.delivery_contact_phone,
            "delivery_instructions": schedule.delivery_instructions,
            "package_description": schedule.package_description,
            "package_size": schedule.package_size,
            "package_weight": schedule.package_weight,
            "is_fragile": schedule.is_fragile,
            "cargo_category": schedule.cargo_category,
            "required_vehicle_type": schedule.required_vehicle_type,
            "proposed_price": schedule.proposed_price,
            "delivery_type": schedule.delivery_type,
            "special_instructions": schedule.special_instructions,
            "scheduled_date": schedule.scheduled_date,
            "recurrence_type": schedule.recurrence_type,
            "recurrence_interval": schedule.recurrence_interval,
            "recurrence_days": schedule.recurrence_days,
            "end_date": schedule.end_date,
            "max_occurrences": schedule.max_occurrences,
            "notification_advance_hours": schedule.notification_advance_hours,
            "auto_create_delivery": schedule.auto_create_delivery,
            "status": schedule.status,
            "created_at": schedule.created_at,
            "updated_at": schedule.updated_at,
            "last_executed_at": schedule.last_executed_at,
            "next_execution_at": schedule.next_execution_at,
            "total_executions": schedule.total_executions,
            "client": {
                "id": current_user.id,
                "name": current_user.full_name,
                "email": current_user.email,
                "phone": current_user.phone
            },
            "available_couriers_count": len(available_couriers)
        }
        
    except Exception as e:
        logger.error(f"Erreur création livraison planifiée: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Erreur lors de la création: {str(e)}")

@router.get("/scheduled-deliveries")
async def get_scheduled_deliveries(
    status: Optional[str] = Query(None, description="Statut des planifications"),
    skip: int = Query(0, ge=0, description="Nombre d'éléments à ignorer"),
    limit: int = Query(20, ge=1, le=100, description="Nombre maximum d'éléments"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les livraisons planifiées de l'utilisateur"""
    
    try:
        # Pour les clients, filtrer par leur ID
        client_id = None if current_user.role in ["admin", "manager"] else current_user.id
        
        schedules = ScheduledDeliveryService.get_scheduled_deliveries(
            db, client_id=client_id, status=status, skip=skip, limit=limit
        )
        
        return {
            "success": True,
            "schedules": schedules,
            "total": len(schedules),
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération: {str(e)}")

@router.get("/scheduled-deliveries/{schedule_id}")
async def get_scheduled_delivery(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer une livraison planifiée par son ID"""
    
    schedule = ScheduledDeliveryService.get_scheduled_delivery(db, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Planification non trouvée")
    
    # Vérifier les permissions
    if current_user.role not in ["admin", "manager"] and schedule.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    return {"success": True, "schedule": schedule}

@router.put("/scheduled-deliveries/{schedule_id}")
async def update_scheduled_delivery(
    schedule_id: int,
    update_data: scheduled_schemas.ScheduledDeliveryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour une livraison planifiée"""
    
    schedule = ScheduledDeliveryService.get_scheduled_delivery(db, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Planification non trouvée")
    
    # Vérifier les permissions
    if current_user.role not in ["admin", "manager"] and schedule.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    try:
        updated_schedule = ScheduledDeliveryService.update_scheduled_delivery(db, schedule_id, update_data)
        return {"success": True, "schedule": updated_schedule}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lors de la mise à jour: {str(e)}")

@router.delete("/scheduled-deliveries/{schedule_id}")
async def delete_scheduled_delivery(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer une livraison planifiée"""
    
    schedule = ScheduledDeliveryService.get_scheduled_delivery(db, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Planification non trouvée")
    
    # Vérifier les permissions
    if current_user.role not in ["admin", "manager"] and schedule.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    success = ScheduledDeliveryService.delete_scheduled_delivery(db, schedule_id)
    if success:
        return {"success": True, "message": "Planification supprimée avec succès"}
    else:
        raise HTTPException(status_code=500, detail="Erreur lors de la suppression")

@router.get("/scheduled-deliveries/calendar/events")
async def get_calendar_events(
    start_date: datetime = Query(..., description="Date de début"),
    end_date: datetime = Query(..., description="Date de fin"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les événements pour le calendrier"""
    
    try:
        # Pour les clients, filtrer par leur ID
        client_id = None if current_user.role in ["admin", "manager"] else current_user.id
        
        events = ScheduledDeliveryService.get_calendar_events(db, start_date, end_date, client_id)
        
        return {"success": True, "events": events}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des événements: {str(e)}")

@router.post("/scheduled-deliveries/{schedule_id}/execute")
async def execute_scheduled_delivery(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exécuter manuellement une livraison planifiée"""
    
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Seuls les administrateurs peuvent exécuter manuellement")
    
    # Trouver la prochaine exécution en attente
    from ..models.scheduled_delivery import ScheduledDeliveryExecution
    execution = db.query(ScheduledDeliveryExecution).filter(
        ScheduledDeliveryExecution.scheduled_delivery_id == schedule_id,
        ScheduledDeliveryExecution.status == "pending"
    ).first()
    
    if not execution:
        raise HTTPException(status_code=404, detail="Aucune exécution en attente trouvée")
    
    delivery = ScheduledDeliveryService.execute_scheduled_delivery(db, execution.id)
    
    if delivery:
        return {"success": True, "delivery_id": delivery.id, "message": "Livraison créée avec succès"}
    else:
        raise HTTPException(status_code=500, detail="Erreur lors de l'exécution")

@router.post("/scheduled-deliveries/{schedule_id}/pause")
async def pause_scheduled_delivery(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre en pause une livraison planifiée"""
    
    schedule = ScheduledDeliveryService.get_scheduled_delivery(db, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Planification non trouvée")
    
    # Vérifier les permissions
    if current_user.role not in ["admin", "manager"] and schedule.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    from ..schemas.scheduled_delivery import ScheduledDeliveryUpdate, ScheduledDeliveryStatus
    update_data = ScheduledDeliveryUpdate(status=ScheduledDeliveryStatus.paused)
    
    updated_schedule = ScheduledDeliveryService.update_scheduled_delivery(db, schedule_id, update_data)
    return {"success": True, "schedule": updated_schedule}

@router.post("/scheduled-deliveries/{schedule_id}/resume")
async def resume_scheduled_delivery(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reprendre une livraison planifiée en pause"""
    
    schedule = ScheduledDeliveryService.get_scheduled_delivery(db, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Planification non trouvée")
    
    # Vérifier les permissions
    if current_user.role not in ["admin", "manager"] and schedule.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    from ..schemas.scheduled_delivery import ScheduledDeliveryUpdate, ScheduledDeliveryStatus
    update_data = ScheduledDeliveryUpdate(status=ScheduledDeliveryStatus.active)
    
    updated_schedule = ScheduledDeliveryService.update_scheduled_delivery(db, schedule_id, update_data)
    return {"success": True, "schedule": updated_schedule}

@router.post("/scheduled-deliveries/bulk-create")
async def bulk_create_scheduled_deliveries(
    bulk_data: scheduled_schemas.BulkScheduleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer plusieurs livraisons planifiées en une fois"""
    
    if current_user.role not in ["client", "business"]:
        raise HTTPException(status_code=403, detail="Seuls les clients et entreprises peuvent planifier des livraisons")
    
    created_schedules = []
    errors = []
    
    for i, schedule_data in enumerate(bulk_data.schedules):
        try:
            # Appliquer les paramètres globaux si fournis
            if bulk_data.apply_to_all:
                for key, value in bulk_data.apply_to_all.items():
                    if hasattr(schedule_data, key) and getattr(schedule_data, key) is None:
                        setattr(schedule_data, key, value)
            
            schedule = ScheduledDeliveryService.create_scheduled_delivery(db, schedule_data, current_user.id)
            created_schedules.append(schedule)
            
        except Exception as e:
            errors.append({"index": i, "error": str(e)})
    
    return {
        "success": True,
        "created_count": len(created_schedules),
        "schedules": created_schedules,
        "errors": errors
    }

@router.get("/scheduled-deliveries/stats/summary")
async def get_scheduled_delivery_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les statistiques des livraisons planifiées"""
    
    try:
        # Pour les clients, filtrer par leur ID
        client_id = None if current_user.role in ["admin", "manager"] else current_user.id
        
        from ..models.scheduled_delivery import ScheduledDelivery, ScheduledDeliveryExecution
        
        # Total planifié
        total_query = db.query(ScheduledDelivery)
        if client_id:
            total_query = total_query.filter(ScheduledDelivery.client_id == client_id)
        total_scheduled = total_query.count()
        
        # Actives
        active_schedules = total_query.filter(ScheduledDelivery.status == "active").count()
        
        # En pause
        paused_schedules = total_query.filter(ScheduledDelivery.status == "paused").count()
        
        # Exécutions ce mois
        from datetime import date
        start_of_month = date.today().replace(day=1)
        executions_this_month = db.query(ScheduledDeliveryExecution).join(ScheduledDelivery).filter(
            ScheduledDeliveryExecution.executed_date >= start_of_month,
            ScheduledDelivery.client_id == client_id if client_id else True
        ).count()
        
        # Exécutions aujourd'hui
        today = date.today()
        executions_today = db.query(ScheduledDeliveryExecution).join(ScheduledDelivery).filter(
            ScheduledDeliveryExecution.planned_date >= today,
            ScheduledDeliveryExecution.planned_date < today + timedelta(days=1),
            ScheduledDelivery.client_id == client_id if client_id else True
        ).count()
        
        # Exécutions cette semaine
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=7)
        executions_this_week = db.query(ScheduledDeliveryExecution).join(ScheduledDelivery).filter(
            ScheduledDeliveryExecution.planned_date >= start_of_week,
            ScheduledDeliveryExecution.planned_date < end_of_week,
            ScheduledDelivery.client_id == client_id if client_id else True
        ).count()
        
        stats = {
            "total_scheduled": total_scheduled,
            "active_schedules": active_schedules,
            "paused_schedules": paused_schedules,
            "total_executions_this_month": executions_this_month,
            "upcoming_executions_today": executions_today,
            "upcoming_executions_this_week": executions_this_week,
            "success_rate": 95.0,  # À calculer réellement
            "most_common_recurrence": "weekly"  # À calculer réellement
        }
        
        return {"success": True, "stats": stats}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des statistiques: {str(e)}")

# Tâche en arrière-plan pour les notifications
@router.post("/scheduled-deliveries/send-notifications")
async def send_scheduled_notifications(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Envoyer les notifications pour les livraisons planifiées (admin seulement)"""
    
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Seuls les administrateurs peuvent déclencher les notifications")
    
    background_tasks.add_task(ScheduledDeliveryService.send_execution_notifications, db)
    return {"success": True, "message": "Notifications en cours d'envoi"}

@router.post("/scheduled-deliveries/auto-execute")
async def auto_execute_scheduled_deliveries(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Auto-exécuter les livraisons planifiées le jour J (admin seulement)"""
    
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Seuls les administrateurs peuvent déclencher l'auto-exécution")
    
    background_tasks.add_task(ScheduledDeliveryService.auto_execute_deliveries, db)
    return {"success": True, "message": "Création automatique des livraisons du jour en cours"}

@router.post("/scheduled-deliveries/{execution_id}/coordinate")
async def coordinate_scheduled_delivery(
    execution_id: int,
    coordination_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Coordination entre client et coursier pour une livraison planifiée"""
    
    execution = db.query(ScheduledDeliveryExecution).filter(
        ScheduledDeliveryExecution.id == execution_id
    ).first()
    
    if not execution:
        raise HTTPException(status_code=404, detail="Exécution non trouvée")
    
    schedule = execution.scheduled_delivery
    
    # Vérifier les permissions
    if current_user.role not in ["admin", "manager", "courier"] and schedule.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    try:
        # Enregistrer les détails de coordination
        coordination_notes = coordination_data.get('notes', '')
        confirmed_time = coordination_data.get('confirmed_time')
        
        # Mettre à jour les instructions si nécessaires
        if coordination_notes:
            if current_user.role == "courier":
                schedule.special_instructions = f"{schedule.special_instructions or ''}\n[Coursier J-1]: {coordination_notes}".strip()
            else:
                schedule.special_instructions = f"{schedule.special_instructions or ''}\n[Client J-1]: {coordination_notes}".strip()
        
        # Confirmer l'heure si fournie
        if confirmed_time:
            from datetime import datetime
            new_time = datetime.fromisoformat(confirmed_time.replace('Z', '+00:00'))
            execution.planned_date = new_time
        
        db.commit()
        
        # Notifier l'autre partie de la coordination
        if current_user.role == "courier":
            # Notifier le client
            message = f"Le coursier a confirmé la livraison planifiée pour {execution.planned_date.strftime('%d/%m/%Y à %H:%M')}"
            if coordination_notes:
                message += f"\nNote du coursier: {coordination_notes}"
                
            send_notification(
                db,
                schedule.client_id,
                "Coordination Livraison Planifiée",
                message,
                notification_type="coordination_update"
            )
        else:
            # Notifier les coursiers intéressés (récupérer depuis les notifications précédentes)
            message = f"Le client a mis à jour les détails de la livraison planifiée pour {execution.planned_date.strftime('%d/%m/%Y à %H:%M')}"
            if coordination_notes:
                message += f"\nNote du client: {coordination_notes}"
        
        return {
            "success": True,
            "message": "Coordination enregistrée avec succès",
            "execution": execution
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lors de la coordination: {str(e)}")

@router.post("/scheduled-deliveries/{schedule_id}/accept-courier")
async def accept_scheduled_delivery_by_courier(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Un coursier accepte une livraison planifiée"""
    
    if current_user.role != "courier":
        raise HTTPException(status_code=403, detail="Seuls les coursiers peuvent accepter")
    
    schedule = ScheduledDeliveryService.get_scheduled_delivery(db, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Planification non trouvée")
    
    if schedule.status != "pending":
        raise HTTPException(status_code=400, detail="Cette planification n'est plus disponible")
    
    try:
        # Assigner le coursier et confirmer la planification
        success = ScheduledDeliveryService.assign_courier_to_schedule(db, schedule_id, current_user.id)
        
        if success:
            # Notifier le client que sa planification est confirmée
            from ..services.notification import send_notification
            
            message = f"Votre livraison planifiée '{schedule.title}' pour le {schedule.scheduled_date.strftime('%d/%m/%Y à %H:%M')} a été confirmée ! Le coursier {current_user.full_name} s'en chargera."
            
            send_notification(
                db,
                schedule.client_id,
                "Livraison Planifiée Confirmée",
                message,
                notification_type="schedule_confirmed",
                data={"schedule_id": schedule_id, "courier_id": current_user.id}
            )
            
            return {"success": True, "message": "Livraison planifiée acceptée avec succès"}
        else:
            raise HTTPException(status_code=500, detail="Erreur lors de l'acceptation")
            
    except Exception as e:
        logger.error(f"Erreur acceptation planification: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Erreur lors de l'acceptation: {str(e)}")

@router.get("/scheduled-deliveries/{execution_id}/coordination-status")
async def get_coordination_status(
    execution_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer le statut de coordination d'une exécution"""
    
    execution = db.query(ScheduledDeliveryExecution).filter(
        ScheduledDeliveryExecution.id == execution_id
    ).first()
    
    if not execution:
        raise HTTPException(status_code=404, detail="Exécution non trouvée")
    
    schedule = execution.scheduled_delivery
    
    # Vérifier les permissions
    if current_user.role not in ["admin", "manager", "courier"] and schedule.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    # Calculer si c'est J-1
    today = datetime.now().date()
    execution_date = execution.planned_date.date()
    is_j_minus_1 = (execution_date - today).days == 1
    
    return {
        "success": True,
        "execution": execution,
        "schedule": schedule,
        "is_j_minus_1": is_j_minus_1,
        "coordination_window_open": is_j_minus_1,
        "special_instructions": schedule.special_instructions
    }
