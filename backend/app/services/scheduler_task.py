
import schedule
import time
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from .scheduled_delivery import ScheduledDeliveryService
from ..db.session import SessionLocal

logger = logging.getLogger(__name__)

class SchedulerTaskService:
    """Service pour gérer les tâches automatiques des livraisons planifiées"""
    
    @staticmethod
    def run_daily_tasks():
        """Exécuter les tâches quotidiennes"""
        db = SessionLocal()
        try:
            logger.info("Début des tâches quotidiennes des livraisons planifiées")
            
            # 1. Envoyer les notifications J-1
            ScheduledDeliveryService.send_execution_notifications(db)
            
            # 2. Créer automatiquement les livraisons du jour J
            ScheduledDeliveryService.auto_execute_deliveries(db)
            
            logger.info("Tâches quotidiennes terminées avec succès")
            
        except Exception as e:
            logger.error(f"Erreur lors des tâches quotidiennes: {e}")
        finally:
            db.close()
    
    @staticmethod
    def start_scheduler():
        """Démarrer le planificateur de tâches"""
        # Programmer les tâches
        schedule.every().day.at("08:00").do(SchedulerTaskService.run_daily_tasks)  # 8h du matin
        schedule.every().day.at("18:00").do(ScheduledDeliveryService.send_execution_notifications)  # 18h pour J-1
        
        logger.info("Planificateur de tâches démarré")
        
        while True:
            schedule.run_pending()
            time.sleep(60)  # Vérifier toutes les minutes

# Alternative avec Celery si disponible
def setup_celery_tasks():
    """Configuration des tâches Celery pour les livraisons planifiées"""
    from celery import Celery
    from celery.schedules import crontab
    
    celery_app = Celery('scheduled_deliveries')
    
    @celery_app.task
    def daily_scheduled_delivery_tasks():
        """Tâche Celery quotidienne"""
        SchedulerTaskService.run_daily_tasks()
    
    @celery_app.task  
    def send_j1_notifications():
        """Tâche Celery pour notifications J-1"""
        db = SessionLocal()
        try:
            ScheduledDeliveryService.send_execution_notifications(db)
        finally:
            db.close()
    
    # Configuration des tâches périodiques
    celery_app.conf.beat_schedule = {
        'daily-tasks': {
            'task': 'daily_scheduled_delivery_tasks',
            'schedule': crontab(hour=8, minute=0),  # 8h00 tous les jours
        },
        'j1-notifications': {
            'task': 'send_j1_notifications', 
            'schedule': crontab(hour=18, minute=0),  # 18h00 tous les jours
        },
    }
    
    return celery_app
