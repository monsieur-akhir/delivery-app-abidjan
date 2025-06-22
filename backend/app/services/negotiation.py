
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from ..models.negotiation import ScheduledDeliveryNegotiation, NegotiationStatus, NegotiationType
from ..models.scheduled_delivery import ScheduledDelivery
from ..models.user import User
from ..schemas.negotiation import NegotiationCreate, CounterOfferCreate, NegotiationResponse
from ..services.notification import send_notification

logger = logging.getLogger(__name__)

class NegotiationService:
    
    @staticmethod
    def create_initial_negotiation(db: Session, client_id: int, courier_id: int, 
                                 negotiation_data: NegotiationCreate) -> ScheduledDeliveryNegotiation:
        """Créer une négociation initiale (offre du client ou du coursier)"""
        
        # Vérifier que la livraison planifiée existe
        schedule = db.query(ScheduledDelivery).filter(
            ScheduledDelivery.id == negotiation_data.scheduled_delivery_id
        ).first()
        
        if not schedule:
            raise ValueError("Livraison planifiée non trouvée")
        
        # Déterminer qui fait l'offre initiale
        if schedule.client_id == client_id:
            negotiation_type = NegotiationType.client_counter
        else:
            negotiation_type = NegotiationType.courier_counter
        
        negotiation = ScheduledDeliveryNegotiation(
            scheduled_delivery_id=negotiation_data.scheduled_delivery_id,
            client_id=schedule.client_id,
            courier_id=courier_id,
            proposed_price=negotiation_data.proposed_price,
            original_price=schedule.proposed_price or 0,
            negotiation_type=negotiation_type.value,
            message=negotiation_data.message,
            proposed_pickup_time=negotiation_data.proposed_pickup_time,
            proposed_delivery_time=negotiation_data.proposed_delivery_time,
            special_conditions=negotiation_data.special_conditions,
            expires_at=datetime.now() + timedelta(hours=24)  # 24h pour répondre
        )
        
        db.add(negotiation)
        db.commit()
        db.refresh(negotiation)
        
        # Notifier l'autre partie
        NegotiationService._notify_negotiation_participant(db, negotiation, "new_offer")
        
        logger.info(f"Négociation créée: {negotiation.id} pour livraison planifiée {schedule.id}")
        return negotiation

    @staticmethod
    def create_counter_offer(db: Session, user_id: int, counter_data: CounterOfferCreate) -> ScheduledDeliveryNegotiation:
        """Créer une contre-offre"""
        
        # Récupérer la négociation parent
        parent_negotiation = db.query(ScheduledDeliveryNegotiation).filter(
            ScheduledDeliveryNegotiation.id == counter_data.parent_negotiation_id
        ).first()
        
        if not parent_negotiation:
            raise ValueError("Négociation parent non trouvée")
        
        # Vérifier que l'utilisateur a le droit de faire une contre-offre
        if user_id not in [parent_negotiation.client_id, parent_negotiation.courier_id]:
            raise ValueError("Vous n'êtes pas autorisé à faire une contre-offre")
        
        # Déterminer le type de contre-offre
        if user_id == parent_negotiation.client_id:
            negotiation_type = NegotiationType.client_counter
        else:
            negotiation_type = NegotiationType.courier_counter
        
        # Marquer la négociation parent comme ayant reçu une contre-offre
        parent_negotiation.status = NegotiationStatus.counter_offered.value
        
        # Créer la contre-offre
        counter_offer = ScheduledDeliveryNegotiation(
            scheduled_delivery_id=parent_negotiation.scheduled_delivery_id,
            client_id=parent_negotiation.client_id,
            courier_id=parent_negotiation.courier_id,
            proposed_price=counter_data.proposed_price,
            original_price=parent_negotiation.original_price,
            negotiation_type=negotiation_type.value,
            message=counter_data.message,
            proposed_pickup_time=counter_data.proposed_pickup_time,
            proposed_delivery_time=counter_data.proposed_delivery_time,
            special_conditions=counter_data.special_conditions,
            parent_negotiation_id=parent_negotiation.id,
            expires_at=datetime.now() + timedelta(hours=24)
        )
        
        db.add(counter_offer)
        db.commit()
        db.refresh(counter_offer)
        
        # Notifier l'autre partie
        NegotiationService._notify_negotiation_participant(db, counter_offer, "counter_offer")
        
        logger.info(f"Contre-offre créée: {counter_offer.id} en réponse à {parent_negotiation.id}")
        return counter_offer

    @staticmethod
    def respond_to_negotiation(db: Session, user_id: int, negotiation_id: int, 
                             response: NegotiationResponse) -> ScheduledDeliveryNegotiation:
        """Répondre à une négociation (accepter ou refuser)"""
        
        negotiation = db.query(ScheduledDeliveryNegotiation).filter(
            ScheduledDeliveryNegotiation.id == negotiation_id
        ).first()
        
        if not negotiation:
            raise ValueError("Négociation non trouvée")
        
        # Vérifier que l'utilisateur a le droit de répondre
        if user_id not in [negotiation.client_id, negotiation.courier_id]:
            raise ValueError("Vous n'êtes pas autorisé à répondre à cette négociation")
        
        # Vérifier que la négociation est encore en attente
        if negotiation.status != NegotiationStatus.pending.value:
            raise ValueError("Cette négociation n'est plus en attente de réponse")
        
        # Mettre à jour le statut
        if response.accept:
            negotiation.status = NegotiationStatus.accepted.value
            
            # Confirmer la livraison planifiée avec les nouveaux termes
            NegotiationService._finalize_scheduled_delivery(db, negotiation)
            
            # Notifier l'acceptation
            NegotiationService._notify_negotiation_participant(db, negotiation, "accepted")
            
        else:
            negotiation.status = NegotiationStatus.rejected.value
            
            # Notifier le refus
            NegotiationService._notify_negotiation_participant(db, negotiation, "rejected")
        
        negotiation.responded_at = datetime.now()
        if response.message:
            if user_id == negotiation.client_id:
                negotiation.client_notes = response.message
            else:
                negotiation.courier_notes = response.message
        
        db.commit()
        db.refresh(negotiation)
        
        logger.info(f"Réponse à la négociation {negotiation_id}: {'acceptée' if response.accept else 'refusée'}")
        return negotiation

    @staticmethod
    def get_negotiation_history(db: Session, scheduled_delivery_id: int) -> List[ScheduledDeliveryNegotiation]:
        """Récupérer l'historique des négociations pour une livraison planifiée"""
        
        return db.query(ScheduledDeliveryNegotiation).filter(
            ScheduledDeliveryNegotiation.scheduled_delivery_id == scheduled_delivery_id
        ).order_by(ScheduledDeliveryNegotiation.created_at.asc()).all()

    @staticmethod
    def get_pending_negotiations_for_user(db: Session, user_id: int) -> List[ScheduledDeliveryNegotiation]:
        """Récupérer les négociations en attente pour un utilisateur"""
        
        return db.query(ScheduledDeliveryNegotiation).filter(
            (
                (ScheduledDeliveryNegotiation.client_id == user_id) |
                (ScheduledDeliveryNegotiation.courier_id == user_id)
            ),
            ScheduledDeliveryNegotiation.status == NegotiationStatus.pending.value,
            ScheduledDeliveryNegotiation.expires_at > datetime.now()
        ).order_by(ScheduledDeliveryNegotiation.created_at.desc()).all()

    @staticmethod
    def expire_old_negotiations(db: Session):
        """Faire expirer les négociations anciennes"""
        
        expired_negotiations = db.query(ScheduledDeliveryNegotiation).filter(
            ScheduledDeliveryNegotiation.status == NegotiationStatus.pending.value,
            ScheduledDeliveryNegotiation.expires_at < datetime.now()
        ).all()
        
        for negotiation in expired_negotiations:
            negotiation.status = NegotiationStatus.expired.value
            
            # Notifier l'expiration
            NegotiationService._notify_negotiation_participant(db, negotiation, "expired")
        
        db.commit()
        logger.info(f"{len(expired_negotiations)} négociations expirées")

    @staticmethod
    def _finalize_scheduled_delivery(db: Session, negotiation: ScheduledDeliveryNegotiation):
        """Finaliser la livraison planifiée avec les termes négociés"""
        
        schedule = negotiation.scheduled_delivery
        
        # Mettre à jour le prix négocié
        schedule.proposed_price = negotiation.proposed_price
        
        # Mettre à jour les horaires si négociés
        if negotiation.proposed_pickup_time:
            schedule.scheduled_date = negotiation.proposed_pickup_time
        
        # Ajouter les conditions spéciales
        if negotiation.special_conditions:
            existing_instructions = schedule.special_instructions or ""
            schedule.special_instructions = f"{existing_instructions}\n[Négocié]: {negotiation.special_conditions}".strip()
        
        # Assigner le coursier et confirmer
        schedule.assigned_courier_id = negotiation.courier_id
        schedule.status = "confirmed"
        schedule.confirmed_at = datetime.now()
        
        # Mettre à jour les exécutions
        from ..models.scheduled_delivery import ScheduledDeliveryExecution
        executions = db.query(ScheduledDeliveryExecution).filter(
            ScheduledDeliveryExecution.scheduled_delivery_id == schedule.id,
            ScheduledDeliveryExecution.status == "pending"
        ).all()
        
        for execution in executions:
            execution.assigned_courier_id = negotiation.courier_id
            execution.status = "confirmed"

    @staticmethod
    def _notify_negotiation_participant(db: Session, negotiation: ScheduledDeliveryNegotiation, action: str):
        """Notifier les participants d'une action de négociation"""
        
        try:
            if action == "new_offer":
                # Notifier celui qui reçoit l'offre
                if negotiation.negotiation_type == NegotiationType.client_counter.value:
                    recipient_id = negotiation.courier_id
                    sender_name = negotiation.client.full_name
                    message = f"{sender_name} vous propose {negotiation.proposed_price}€ pour la livraison planifiée '{negotiation.scheduled_delivery.title}'"
                else:
                    recipient_id = negotiation.client_id
                    sender_name = negotiation.courier.full_name
                    message = f"Le coursier {sender_name} vous propose {negotiation.proposed_price}€ pour votre livraison planifiée"
                
                if negotiation.message:
                    message += f"\nMessage: {negotiation.message}"
                
                send_notification(
                    db, recipient_id, "Nouvelle Offre - Livraison Planifiée", message,
                    notification_type="negotiation_offer",
                    data={"negotiation_id": negotiation.id, "action": "respond"}
                )
            
            elif action == "counter_offer":
                # Notifier de la contre-offre
                if negotiation.negotiation_type == NegotiationType.client_counter.value:
                    recipient_id = negotiation.courier_id
                    sender_name = negotiation.client.full_name
                else:
                    recipient_id = negotiation.client_id
                    sender_name = negotiation.courier.full_name
                
                message = f"{sender_name} a fait une contre-offre: {negotiation.proposed_price}€"
                if negotiation.message:
                    message += f"\nMessage: {negotiation.message}"
                
                send_notification(
                    db, recipient_id, "Contre-offre - Livraison Planifiée", message,
                    notification_type="negotiation_counter",
                    data={"negotiation_id": negotiation.id, "action": "respond"}
                )
            
            elif action == "accepted":
                # Notifier l'acceptation
                message = f"Excellente nouvelle ! Votre offre de {negotiation.proposed_price}€ a été acceptée pour la livraison planifiée '{negotiation.scheduled_delivery.title}'"
                
                # Notifier celui qui a fait l'offre
                sender_id = negotiation.client_id if negotiation.negotiation_type == NegotiationType.client_counter.value else negotiation.courier_id
                
                send_notification(
                    db, sender_id, "Offre Acceptée ✅", message,
                    notification_type="negotiation_accepted",
                    data={"negotiation_id": negotiation.id, "schedule_id": negotiation.scheduled_delivery_id}
                )
            
            elif action == "rejected":
                # Notifier le refus
                message = f"Votre offre de {negotiation.proposed_price}€ a été refusée. Vous pouvez faire une nouvelle proposition."
                
                sender_id = negotiation.client_id if negotiation.negotiation_type == NegotiationType.client_counter.value else negotiation.courier_id
                
                send_notification(
                    db, sender_id, "Offre Refusée", message,
                    notification_type="negotiation_rejected",
                    data={"negotiation_id": negotiation.id, "action": "counter_offer"}
                )
            
            elif action == "expired":
                # Notifier l'expiration
                message = f"La négociation pour la livraison planifiée '{negotiation.scheduled_delivery.title}' a expiré"
                
                send_notification(
                    db, negotiation.client_id, "Négociation Expirée", message,
                    notification_type="negotiation_expired"
                )
                send_notification(
                    db, negotiation.courier_id, "Négociation Expirée", message,
                    notification_type="negotiation_expired"
                )
                
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de notification de négociation: {e}")
