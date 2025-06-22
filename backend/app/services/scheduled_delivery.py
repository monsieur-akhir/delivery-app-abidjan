
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
        """Envoyer les notifications de rappel J-1 pour coordination"""
        
        tomorrow = datetime.now() + timedelta(days=1)
        tomorrow_date = tomorrow.date()
        
        # Récupérer les exécutions prévues pour demain
        executions_tomorrow = db.query(ScheduledDeliveryExecution).join(ScheduledDelivery).filter(
            ScheduledDeliveryExecution.status == "pending",
            func.date(ScheduledDeliveryExecution.planned_date) == tomorrow_date,
            ScheduledDeliveryExecution.notification_sent_at.is_(None),
            ScheduledDelivery.status == ScheduledDeliveryStatus.active
        ).all()
        
        for execution in executions_tomorrow:
            schedule = execution.scheduled_delivery
            
            try:
                # Notification au client
                client_message = f"Rappel : Votre livraison planifiée '{schedule.title}' aura lieu demain {execution.planned_date.strftime('%d/%m/%Y à %H:%M')}. Assurez-vous que le colis soit prêt."
                send_notification(
                    db, 
                    schedule.client_id, 
                    "Rappel Livraison Planifiée - J-1", 
                    client_message,
                    notification_type="scheduled_reminder",
                    data={"execution_id": execution.id, "schedule_id": schedule.id}
                )
                
                # Trouver et notifier les coursiers potentiels
                ScheduledDeliveryService._notify_potential_couriers_j1(db, execution, schedule)
                
                # Marquer la notification comme envoyée
                execution.notification_sent_at = datetime.now()
                db.commit()
                
                logger.info(f"Notifications J-1 envoyées pour l'exécution {execution.id}")
                
            except Exception as e:
                logger.error(f"Erreur lors de l'envoi de notification J-1 pour l'exécution {execution.id}: {e}")

    @staticmethod
    def _notify_potential_couriers_j1(db: Session, execution, schedule):
        """Notifier les coursiers potentiels J-1 pour coordination"""
        
        from ..services.matching import MatchingService
        from ..services.notification import send_notification
        from ..models.delivery import Delivery
        
        try:
            # Créer un objet delivery temporaire pour le matching
            temp_delivery = Delivery(
                pickup_lat=schedule.pickup_lat,
                pickup_lng=schedule.pickup_lng,
                delivery_lat=schedule.delivery_lat,
                delivery_lng=schedule.delivery_lng,
                proposed_price=schedule.proposed_price,
                required_vehicle_type=schedule.required_vehicle_type
            )
            
            # Trouver les meilleurs coursiers
            best_couriers = MatchingService.find_best_couriers(db, temp_delivery, limit=5)
            
            for courier_info in best_couriers:
                courier_id = courier_info['courier_id']
                distance = courier_info['distance']
                
                courier_message = f"Livraison planifiée disponible demain {execution.planned_date.strftime('%d/%m/%Y à %H:%M')} !\n"
                courier_message += f"📍 De {schedule.pickup_commune} vers {schedule.delivery_commune}\n"
                courier_message += f"📏 Distance: {distance:.1f}km\n"
                courier_message += f"💰 Prix: {schedule.proposed_price}€\n"
                courier_message += f"📦 {schedule.package_description}"
                
                send_notification(
                    db,
                    courier_id,
                    "Livraison Planifiée Demain - Coordination",
                    courier_message,
                    notification_type="scheduled_j1_alert",
                    data={
                        "execution_id": execution.id,
                        "schedule_id": schedule.id,
                        "planned_date": execution.planned_date.isoformat(),
                        "distance": distance
                    }
                )
                
        except Exception as e:
            logger.error(f"Erreur lors de la notification des coursiers J-1: {e}")

    @staticmethod
    def auto_execute_deliveries(db: Session):
        """Auto-exécuter les livraisons planifiées le jour J"""
        
        now = datetime.now()
        today = now.date()
        
        # Récupérer toutes les exécutions prévues pour aujourd'hui
        executions_to_execute = db.query(ScheduledDeliveryExecution).join(ScheduledDelivery).filter(
            ScheduledDeliveryExecution.status == "pending",
            func.date(ScheduledDeliveryExecution.planned_date) == today,
            ScheduledDelivery.status == ScheduledDeliveryStatus.active
        ).all()
        
        for execution in executions_to_execute:
            try:
                # Créer la livraison réelle automatiquement le jour J
                delivery = ScheduledDeliveryService.execute_scheduled_delivery(db, execution.id)
                if delivery:
                    logger.info(f"Livraison automatiquement créée pour l'exécution {execution.id}: livraison {delivery.id}")
                    
                    # Notifier les coursiers disponibles qu'une nouvelle livraison est disponible
                    ScheduledDeliveryService._notify_available_couriers(db, delivery)
                    
            except Exception as e:
                logger.error(f"Erreur lors de l'auto-exécution {execution.id}: {e}")

    @staticmethod
    def notify_couriers_for_scheduling(db: Session, schedule: ScheduledDelivery, available_couriers: list):
        """Notifier les coursiers qu'une nouvelle planification est disponible pour acceptation"""
        
        from ..services.notification import send_notification
        
        try:
            for courier_info in available_couriers:
                courier_id = courier_info['courier_id']
                distance = courier_info['distance']
                
                message = f"🕐 Nouvelle livraison à planifier !\n"
                message += f"📍 De {schedule.pickup_commune} vers {schedule.delivery_commune}\n"
                message += f"📅 Prévue pour le {schedule.scheduled_date.strftime('%d/%m/%Y à %H:%M')}\n"
                message += f"📏 Distance: {distance:.1f}km\n"
                message += f"💰 Prix: {schedule.proposed_price}€\n"
                message += f"📦 {schedule.package_description or 'Colis standard'}\n"
                message += "⚡ Acceptez rapidement pour réserver cette livraison !"
                
                send_notification(
                    db,
                    courier_id,
                    "Livraison à Planifier - Action Requise",
                    message,
                    notification_type="schedule_proposal",
                    data={
                        "schedule_id": schedule.id,
                        "scheduled_date": schedule.scheduled_date.isoformat(),
                        "distance": distance,
                        "price": schedule.proposed_price
                    }
                )
                
        except Exception as e:
            logger.error(f"Erreur lors de la notification des coursiers pour planification: {e}")

    @staticmethod
    def assign_courier_to_schedule(db: Session, schedule_id: int, courier_id: int) -> bool:
        """Assigner un coursier à une planification et la confirmer"""
        
        try:
            schedule = db.query(ScheduledDelivery).filter(ScheduledDelivery.id == schedule_id).first()
            if not schedule:
                return False
            
            # Vérifier que la planification est encore en attente
            if schedule.status != "pending":
                return False
            
            # Assigner le coursier et confirmer
            schedule.assigned_courier_id = courier_id
            schedule.status = ScheduledDeliveryStatus.confirmed
            schedule.confirmed_at = datetime.now()
            
            # Mettre à jour les exécutions
            from ..models.scheduled_delivery import ScheduledDeliveryExecution
            executions = db.query(ScheduledDeliveryExecution).filter(
                ScheduledDeliveryExecution.scheduled_delivery_id == schedule_id,
                ScheduledDeliveryExecution.status == "pending"
            ).all()
            
            for execution in executions:
                execution.assigned_courier_id = courier_id
                execution.status = "confirmed"
            
            db.commit()
            
            logger.info(f"Coursier {courier_id} assigné à la planification {schedule_id}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de l'assignation du coursier: {e}")
            db.rollback()
            return False

    @staticmethod
    def _notify_available_couriers(db: Session, delivery):
        """Notifier les coursiers disponibles qu'une nouvelle livraison planifiée est disponible"""
        
        from ..services.matching import MatchingService
        from ..services.notification import send_notification
        
        try:
            # Trouver les meilleurs coursiers pour cette livraison
            best_couriers = MatchingService.find_best_couriers(db, delivery, limit=10)
            
            for courier_info in best_couriers:
                courier_id = courier_info['courier_id']
                message = f"Nouvelle livraison planifiée disponible ! Distance: {courier_info['distance']:.1f}km, Prix: {delivery.proposed_price}€"
                
                send_notification(
                    db, 
                    courier_id, 
                    "Livraison Planifiée Disponible", 
                    message,
                    notification_type="delivery_available",
                    data={"delivery_id": delivery.id, "is_scheduled": True}
                )
                
        except Exception as e:
            logger.error(f"Erreur lors de la notification des coursiers: {e}")
