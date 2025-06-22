
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, time
import calendar
from dateutil.relativedelta import relativedelta

from ..models.scheduled_delivery import ScheduledDelivery, ScheduledDeliveryExecution, RecurrenceType, ScheduledDeliveryStatus
from ..models.delivery import Delivery
from ..models.user import User
from ..schemas.scheduled_delivery import ScheduledDeliveryCreate, ScheduledDeliveryUpdate, CalendarEvent
from ..services.delivery import create_delivery
from ..services.notification import send_notification
import logging

logger = logging.getLogger(__name__)

class ScheduledDeliveryService:
    
    @staticmethod
    def create_scheduled_delivery(db: Session, schedule_data: ScheduledDeliveryCreate, client_id: int) -> ScheduledDelivery:
        """Créer une nouvelle livraison planifiée"""
        
        # Créer l'objet de planification
        db_schedule = ScheduledDelivery(
            client_id=client_id,
            **schedule_data.dict()
        )
        
        # Calculer la prochaine exécution
        db_schedule.next_execution_at = schedule_data.scheduled_date
        
        db.add(db_schedule)
        db.commit()
        db.refresh(db_schedule)
        
        # Créer les exécutions futures si récurrence
        ScheduledDeliveryService._create_future_executions(db, db_schedule)
        
        logger.info(f"Livraison planifiée créée: {db_schedule.id} pour client {client_id}")
        return db_schedule

    @staticmethod
    def _create_future_executions(db: Session, schedule: ScheduledDelivery, limit: int = 100):
        """Créer les exécutions futures basées sur la récurrence"""
        
        if schedule.recurrence_type == RecurrenceType.none:
            # Créer une seule exécution pour la livraison ponctuelle
            execution = ScheduledDeliveryExecution(
                scheduled_delivery_id=schedule.id,
                planned_date=schedule.scheduled_date,
                status="pending"
            )
            db.add(execution)
        else:
            # Créer les exécutions récurrentes
            current_date = schedule.scheduled_date
            executions_created = 0
            
            while executions_created < limit:
                # Vérifier si on a atteint la date de fin
                if schedule.end_date and current_date > schedule.end_date:
                    break
                
                # Vérifier si on a atteint le nombre max d'occurrences
                if schedule.max_occurrences and executions_created >= schedule.max_occurrences:
                    break
                
                # Créer l'exécution
                execution = ScheduledDeliveryExecution(
                    scheduled_delivery_id=schedule.id,
                    planned_date=current_date,
                    status="pending"
                )
                db.add(execution)
                executions_created += 1
                
                # Calculer la prochaine date
                current_date = ScheduledDeliveryService._calculate_next_occurrence(
                    current_date, schedule.recurrence_type, schedule.recurrence_interval, schedule.recurrence_days
                )
                
                if not current_date:
                    break
        
        db.commit()

    @staticmethod
    def _calculate_next_occurrence(current_date: datetime, recurrence_type: RecurrenceType, 
                                 interval: int, recurrence_days: List[int] = None) -> Optional[datetime]:
        """Calculer la prochaine occurrence basée sur le type de récurrence"""
        
        if recurrence_type == RecurrenceType.daily:
            return current_date + timedelta(days=interval)
        
        elif recurrence_type == RecurrenceType.weekly:
            if recurrence_days:
                # Trouver le prochain jour de la semaine dans la liste
                current_weekday = current_date.isoweekday()
                next_days = [day for day in recurrence_days if day > current_weekday]
                
                if next_days:
                    # Prochain jour cette semaine
                    days_ahead = next_days[0] - current_weekday
                    return current_date + timedelta(days=days_ahead)
                else:
                    # Premier jour de la semaine suivante
                    days_ahead = (7 - current_weekday) + recurrence_days[0]
                    return current_date + timedelta(days=days_ahead)
            else:
                return current_date + timedelta(weeks=interval)
        
        elif recurrence_type == RecurrenceType.monthly:
            return current_date + relativedelta(months=interval)
        
        return None

    @staticmethod
    def get_scheduled_deliveries(db: Session, client_id: Optional[int] = None, 
                               status: Optional[ScheduledDeliveryStatus] = None,
                               skip: int = 0, limit: int = 100) -> List[ScheduledDelivery]:
        """Récupérer les livraisons planifiées avec filtres"""
        
        query = db.query(ScheduledDelivery)
        
        if client_id:
            query = query.filter(ScheduledDelivery.client_id == client_id)
        
        if status:
            query = query.filter(ScheduledDelivery.status == status)
        
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_scheduled_delivery(db: Session, schedule_id: int) -> Optional[ScheduledDelivery]:
        """Récupérer une livraison planifiée par ID"""
        return db.query(ScheduledDelivery).filter(ScheduledDelivery.id == schedule_id).first()

    @staticmethod
    def update_scheduled_delivery(db: Session, schedule_id: int, update_data: ScheduledDeliveryUpdate) -> Optional[ScheduledDelivery]:
        """Mettre à jour une livraison planifiée"""
        
        schedule = db.query(ScheduledDelivery).filter(ScheduledDelivery.id == schedule_id).first()
        if not schedule:
            return None
        
        update_dict = update_data.dict(exclude_unset=True)
        
        for field, value in update_dict.items():
            setattr(schedule, field, value)
        
        # Recalculer les exécutions si la récurrence a changé
        if any(field in update_dict for field in ['scheduled_date', 'recurrence_type', 'recurrence_interval', 'recurrence_days', 'end_date', 'max_occurrences']):
            # Supprimer les exécutions futures non exécutées
            db.query(ScheduledDeliveryExecution).filter(
                ScheduledDeliveryExecution.scheduled_delivery_id == schedule_id,
                ScheduledDeliveryExecution.status == "pending",
                ScheduledDeliveryExecution.planned_date > datetime.now()
            ).delete()
            
            # Recréer les exécutions futures
            ScheduledDeliveryService._create_future_executions(db, schedule)
        
        db.commit()
        db.refresh(schedule)
        return schedule

    @staticmethod
    def delete_scheduled_delivery(db: Session, schedule_id: int) -> bool:
        """Supprimer une livraison planifiée"""
        
        schedule = db.query(ScheduledDelivery).filter(ScheduledDelivery.id == schedule_id).first()
        if not schedule:
            return False
        
        # Supprimer toutes les exécutions associées
        db.query(ScheduledDeliveryExecution).filter(
            ScheduledDeliveryExecution.scheduled_delivery_id == schedule_id
        ).delete()
        
        db.delete(schedule)
        db.commit()
        return True

    @staticmethod
    def get_calendar_events(db: Session, start_date: datetime, end_date: datetime, 
                          client_id: Optional[int] = None) -> List[CalendarEvent]:
        """Récupérer les événements pour le calendrier"""
        
        query = db.query(ScheduledDeliveryExecution).join(ScheduledDelivery)
        
        if client_id:
            query = query.filter(ScheduledDelivery.client_id == client_id)
        
        query = query.filter(
            ScheduledDeliveryExecution.planned_date >= start_date,
            ScheduledDeliveryExecution.planned_date <= end_date
        )
        
        executions = query.all()
        events = []
        
        for execution in executions:
            schedule = execution.scheduled_delivery
            events.append(CalendarEvent(
                id=execution.id,
                title=schedule.title,
                start=execution.planned_date,
                end=execution.planned_date + timedelta(hours=1),
                status=execution.status,
                client_name=schedule.client.full_name if schedule.client else "Client",
                pickup_address=schedule.pickup_address,
                delivery_address=schedule.delivery_address,
                recurrence_type=schedule.recurrence_type.value
            ))
        
        return events

    @staticmethod
    def execute_scheduled_delivery(db: Session, execution_id: int) -> Optional[Delivery]:
        """Exécuter une livraison planifiée (créer la livraison réelle)"""
        
        execution = db.query(ScheduledDeliveryExecution).filter(
            ScheduledDeliveryExecution.id == execution_id
        ).first()
        
        if not execution or execution.status != "pending":
            return None
        
        schedule = execution.scheduled_delivery
        
        try:
            # Créer la livraison réelle
            from ..schemas.delivery import DeliveryCreate
            
            delivery_data = DeliveryCreate(
                pickup_address=schedule.pickup_address,
                pickup_commune=schedule.pickup_commune,
                pickup_lat=schedule.pickup_lat,
                pickup_lng=schedule.pickup_lng,
                pickup_contact_name=schedule.pickup_contact_name,
                pickup_contact_phone=schedule.pickup_contact_phone,
                delivery_address=schedule.delivery_address,
                delivery_commune=schedule.delivery_commune,
                delivery_lat=schedule.delivery_lat,
                delivery_lng=schedule.delivery_lng,
                delivery_contact_name=schedule.delivery_contact_name,
                delivery_contact_phone=schedule.delivery_contact_phone,
                package_description=schedule.package_description,
                package_size=schedule.package_size,
                package_weight=schedule.package_weight,
                is_fragile=schedule.is_fragile,
                cargo_category=schedule.cargo_category,
                required_vehicle_type=schedule.required_vehicle_type,
                proposed_price=schedule.proposed_price,
                delivery_type=schedule.delivery_type
            )
            
            delivery = create_delivery(db, delivery_data, schedule.client_id)
            
            # Mettre à jour l'exécution
            execution.delivery_id = delivery.id
            execution.executed_date = datetime.now()
            execution.status = "created"
            
            # Mettre à jour les stats de la planification
            schedule.last_executed_at = datetime.now()
            schedule.total_executions += 1
            
            db.commit()
            
            logger.info(f"Livraison planifiée exécutée: {execution_id} -> Livraison {delivery.id}")
            return delivery
            
        except Exception as e:
            execution.status = "failed"
            execution.error_message = str(e)
            db.commit()
            logger.error(f"Erreur lors de l'exécution de la livraison planifiée {execution_id}: {e}")
            return None

    @staticmethod
    def get_pending_executions(db: Session, notification_hours_ahead: int = 24) -> List[ScheduledDeliveryExecution]:
        """Récupérer les exécutions qui nécessitent une notification"""
        
        notification_time = datetime.now() + timedelta(hours=notification_hours_ahead)
        
        return db.query(ScheduledDeliveryExecution).filter(
            ScheduledDeliveryExecution.status == "pending",
            ScheduledDeliveryExecution.planned_date <= notification_time,
            ScheduledDeliveryExecution.notification_sent_at.is_(None)
        ).all()

    @staticmethod
    def send_execution_notifications(db: Session):
        """Envoyer les notifications pour les exécutions à venir"""
        
        pending_executions = ScheduledDeliveryService.get_pending_executions(db)
        
        for execution in pending_executions:
            schedule = execution.scheduled_delivery
            
            try:
                # Envoyer notification au client
                message = f"Votre livraison planifiée '{schedule.title}' est prévue pour {execution.planned_date.strftime('%d/%m/%Y à %H:%M')}"
                send_notification(db, schedule.client_id, "Livraison planifiée", message)
                
                # Marquer la notification comme envoyée
                execution.notification_sent_at = datetime.now()
                db.commit()
                
                logger.info(f"Notification envoyée pour l'exécution {execution.id}")
                
            except Exception as e:
                logger.error(f"Erreur lors de l'envoi de notification pour l'exécution {execution.id}: {e}")

    @staticmethod
    def auto_execute_deliveries(db: Session):
        """Auto-exécuter les livraisons planifiées (si activé)"""
        
        now = datetime.now()
        executions_to_execute = db.query(ScheduledDeliveryExecution).join(ScheduledDelivery).filter(
            ScheduledDeliveryExecution.status == "pending",
            ScheduledDeliveryExecution.planned_date <= now,
            ScheduledDelivery.auto_create_delivery == True
        ).all()
        
        for execution in executions_to_execute:
            ScheduledDeliveryService.execute_scheduled_delivery(db, execution.id)
