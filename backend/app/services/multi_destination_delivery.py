from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import googlemaps
import os
from ..models.multi_destination_delivery import MultiDestinationDelivery, MultiDestinationStop, MultiDestinationBid
from ..models.user import User
from ..schemas.multi_destination_delivery import (
    MultiDestinationDeliveryCreate, MultiDestinationStopCreate,
    RouteOptimizationResponse, StopStatusUpdate, MultiDestinationDeliveryResponse, MultiDestinationStopResponse
)

class MultiDestinationDeliveryService:
    def __init__(self, db: Session):
        self.db = db
        self.gmaps = googlemaps.Client(key=os.getenv("GOOGLE_PLACES_API_KEY"))

    def create_delivery(self, delivery_data: MultiDestinationDeliveryCreate, client_id: int) -> MultiDestinationDelivery:
        """Créer une nouvelle livraison multi-destinataires"""
        
        # Créer la livraison principale
        delivery = MultiDestinationDelivery(
            client_id=client_id,
            pickup_address=delivery_data.pickup_address,
            pickup_commune=delivery_data.pickup_commune,
            pickup_lat=delivery_data.pickup_lat,
            pickup_lng=delivery_data.pickup_lng,
            pickup_contact_name=delivery_data.pickup_contact_name,
            pickup_contact_phone=delivery_data.pickup_contact_phone,
            pickup_instructions=delivery_data.pickup_instructions,
            total_destinations=len(delivery_data.destinations),
            total_proposed_price=delivery_data.total_proposed_price,
            special_instructions=delivery_data.special_instructions,
            vehicle_type_required=delivery_data.vehicle_type_required,
            is_fragile=delivery_data.is_fragile,
            is_urgent=delivery_data.is_urgent,
            status="pending",
            destinations=[d.dict() if hasattr(d, 'dict') else dict(d) for d in delivery_data.destinations]
        )
        
        self.db.add(delivery)
        self.db.flush()  # Pour obtenir l'ID

        # Créer les destinations
        for index, dest_data in enumerate(delivery_data.destinations):
            destination = MultiDestinationStop(
                delivery_id=delivery.id,
                original_order=index + 1,
                delivery_address=dest_data.delivery_address,
                delivery_commune=dest_data.delivery_commune,
                delivery_lat=dest_data.delivery_lat,
                delivery_lng=dest_data.delivery_lng,
                delivery_contact_name=getattr(dest_data, 'delivery_contact_name', None),
                delivery_contact_phone=getattr(dest_data, 'delivery_contact_phone', None),
                package_description=getattr(dest_data, 'package_description', None),
                package_size=getattr(dest_data, 'package_size', None),
                package_weight=getattr(dest_data, 'package_weight', None),
                recipient_name=dest_data.recipient_name,
                recipient_phone=dest_data.recipient_phone,
                special_instructions=getattr(dest_data, 'special_instructions', None),
                status="pending"
            )
            self.db.add(destination)
        self.db.flush()  # <-- Ajout ici pour forcer l'écriture des stops et générer les IDs

        # Optimiser la route
        try:
            optimization_result = self._optimize_route(delivery)
            delivery.optimized_route = optimization_result["optimized_order"]
            delivery.estimated_total_distance = optimization_result["total_distance"]
            delivery.estimated_total_duration = optimization_result["total_duration"]
            
            # Mettre à jour l'ordre optimisé des destinations
            for i, dest_id in enumerate(optimization_result["optimized_order"]):
                dest = self.db.query(MultiDestinationStop).filter(
                    MultiDestinationStop.delivery_id == delivery.id,
                    MultiDestinationStop.original_order == dest_id
                ).first()
                if dest:
                    dest.optimized_order = i + 1
                    
        except Exception as e:
            print(f"Erreur d'optimisation de route: {str(e)}")
            # Utiliser l'ordre original si l'optimisation échoue
            delivery.optimized_route = list(range(1, len(delivery_data.destinations) + 1))

        self.db.commit()
        self.db.refresh(delivery)
        return delivery

    def _optimize_route(self, delivery: MultiDestinationDelivery) -> Dict[str, Any]:
        """Optimiser l'ordre des destinations"""
        destinations = []
        try:
            # Récupérer les destinations
            destinations = self.db.query(MultiDestinationStop).filter(
                MultiDestinationStop.delivery_id == delivery.id
            ).order_by(MultiDestinationStop.original_order).all()

            if not destinations:
                return {"optimized_order": [], "total_distance": 0, "total_duration": 0}

            # Préparer les coordonnées
            origin = (delivery.pickup_lat, delivery.pickup_lng) if delivery.pickup_lat and delivery.pickup_lng else delivery.pickup_address
            waypoints = []
            for dest in destinations:
                if dest.delivery_lat and dest.delivery_lng:
                    waypoints.append((dest.delivery_lat, dest.delivery_lng))
                else:
                    waypoints.append(dest.delivery_address)

            # Utiliser Google Maps pour optimiser
            if len(waypoints) <= 1:
                return {"optimized_order": [1], "total_distance": 0, "total_duration": 0}

            # Pour plus de 2 destinations, utiliser l'API d'optimisation
            if len(waypoints) > 8:  # Limite de Google Maps
                # Algorithme simple pour les grandes listes
                return self._simple_route_optimization(delivery, destinations)

            # Utiliser Google Maps Directions API
            result = self.gmaps.directions(
                origin=origin,
                destination=waypoints[-1],
                waypoints=waypoints[:-1],
                optimize_waypoints=True,
                mode="driving"
            )

            if result and len(result) > 0:
                route = result[0]
                waypoint_order = route.get("waypoint_order", list(range(len(waypoints))))
                
                # Ajouter la dernière destination
                optimized_order = [i + 1 for i in waypoint_order] + [len(waypoints)]
                
                # Calculer distance et durée totales
                total_distance = sum(leg["distance"]["value"] for leg in route["legs"]) / 1000  # en km
                total_duration = sum(leg["duration"]["value"] for leg in route["legs"]) / 60  # en minutes

                return {
                    "optimized_order": optimized_order,
                    "total_distance": total_distance,
                    "total_duration": total_duration
                }
            else:
                return self._simple_route_optimization(delivery, destinations)

        except Exception as e:
            print(f"Erreur Google Maps: {str(e)}")
            return self._simple_route_optimization(delivery, destinations)

    def _simple_route_optimization(self, delivery: MultiDestinationDelivery, destinations: List[MultiDestinationStop]) -> Dict[str, Any]:
        """Optimisation simple basée sur les communes"""
        # Grouper par commune pour minimiser les déplacements
        commune_groups = {}
        for i, dest in enumerate(destinations):
            commune = dest.delivery_commune
            if commune not in commune_groups:
                commune_groups[commune] = []
            commune_groups[commune].append(i + 1)

        optimized_order = []
        for commune, dest_ids in commune_groups.items():
            optimized_order.extend(dest_ids)

        return {
            "optimized_order": optimized_order,
            "total_distance": len(destinations) * 5,  # Estimation simple
            "total_duration": len(destinations) * 20  # Estimation simple
        }

    def get_delivery(self, delivery_id: int) -> Optional[MultiDestinationDelivery]:
        """Récupérer une livraison par ID"""
        return self.db.query(MultiDestinationDelivery).filter(
            MultiDestinationDelivery.id == delivery_id
        ).first()

    def get_user_deliveries(self, user_id: int, role: str) -> List[MultiDestinationDelivery]:
        """Récupérer les livraisons d'un utilisateur"""
        query = self.db.query(MultiDestinationDelivery)
        
        if role == "client" or role == "business":
            query = query.filter(MultiDestinationDelivery.client_id == user_id)
        elif role == "courier":
            query = query.filter(MultiDestinationDelivery.courier_id == user_id)
        
        return query.order_by(MultiDestinationDelivery.created_at.desc()).all()

    def get_available_deliveries(self, commune: Optional[str] = None) -> List[MultiDestinationDelivery]:
        """Récupérer les livraisons disponibles pour les coursiers"""
        query = self.db.query(MultiDestinationDelivery).filter(
            MultiDestinationDelivery.status == "pending",
            MultiDestinationDelivery.courier_id.is_(None)
        )
        
        if commune:
            query = query.filter(MultiDestinationDelivery.pickup_commune == commune)
        
        return query.order_by(MultiDestinationDelivery.created_at.desc()).all()

    def create_bid(self, delivery_id: int, courier_id: int, bid_data: Dict[str, Any]) -> MultiDestinationBid:
        """Créer une enchère pour une livraison"""
        bid = MultiDestinationBid(
            delivery_id=delivery_id,
            courier_id=courier_id,
            proposed_price=bid_data["proposed_price"],
            estimated_duration=bid_data.get("estimated_duration"),
            message=bid_data.get("message"),
            alternative_route=bid_data.get("alternative_route")
        )
        
        self.db.add(bid)
        self.db.commit()
        self.db.refresh(bid)
        return bid

    def accept_bid(self, delivery_id: int, bid_id: int, client_id: int) -> MultiDestinationDelivery:
        """Accepter une enchère"""
        delivery = self.get_delivery(delivery_id)
        if not delivery or delivery.client_id != client_id:
            raise ValueError("Livraison non trouvée ou accès non autorisé")

        bid = self.db.query(MultiDestinationBid).filter(
            MultiDestinationBid.id == bid_id,
            MultiDestinationBid.delivery_id == delivery_id
        ).first()
        
        if not bid:
            raise ValueError("Enchère non trouvée")

        # Mettre à jour la livraison
        delivery.courier_id = bid.courier_id
        delivery.total_final_price = bid.proposed_price
        delivery.status = "accepted"
        delivery.accepted_at = datetime.utcnow()
        
        # Utiliser la route alternative si proposée
        if bid.alternative_route:
            delivery.optimized_route = bid.alternative_route

        # Mettre à jour le statut de l'enchère
        bid.status = "accepted"
        
        # Rejeter les autres enchères
        other_bids = self.db.query(MultiDestinationBid).filter(
            MultiDestinationBid.delivery_id == delivery_id,
            MultiDestinationBid.id != bid_id
        ).all()
        
        for other_bid in other_bids:
            other_bid.status = "rejected"

        self.db.commit()
        self.db.refresh(delivery)
        return delivery

    def update_stop_status(self, delivery_id: int, stop_id: int, status_update: StopStatusUpdate, courier_id: int) -> MultiDestinationStop:
        """Mettre à jour le statut d'un arrêt"""
        delivery = self.get_delivery(delivery_id)
        if not delivery or delivery.courier_id != courier_id:
            raise ValueError("Livraison non trouvée ou accès non autorisé")

        stop = self.db.query(MultiDestinationStop).filter(
            MultiDestinationStop.id == stop_id,
            MultiDestinationStop.delivery_id == delivery_id
        ).first()
        
        if not stop:
            raise ValueError("Arrêt non trouvé")

        # Mettre à jour le statut
        stop.status = status_update.status
        stop.delivery_notes = status_update.notes
        stop.proof_of_delivery_url = status_update.proof_of_delivery_url
        
        if status_update.status == "delivered":
            stop.delivered_at = datetime.utcnow()
        elif status_update.status == "arrived":
            stop.actual_arrival_time = datetime.utcnow()

        # Vérifier si toutes les destinations sont livrées 
        all_stops = self.db.query(MultiDestinationStop).filter(
            MultiDestinationStop.delivery_id == delivery_id
        ).all()
        
        delivered_stops = [s for s in all_stops if s.status == "delivered"]
        
        if len(delivered_stops) == len(all_stops):
            delivery.status = "completed"
            delivery.completed_at = datetime.utcnow()
            if delivery.started_at:
                delivery.actual_total_duration = int((datetime.utcnow() - delivery.started_at).total_seconds() / 60)

        self.db.commit()
        self.db.refresh(stop)
        return stop

    def start_delivery(self, delivery_id: int, courier_id: int) -> MultiDestinationDelivery:
        """Démarrer une livraison"""
        delivery = self.get_delivery(delivery_id)
        if not delivery or delivery.courier_id != courier_id:
            raise ValueError("Livraison non trouvée ou accès non autorisé")

        delivery.status = "in_progress"
        delivery.started_at = datetime.utcnow()
        
        # Calculer les ETA pour chaque arrêt
        self._calculate_stop_etas(delivery)
        
        self.db.commit()
        self.db.refresh(delivery)
        return delivery

    def _calculate_stop_etas(self, delivery: MultiDestinationDelivery):
        """Calculer les heures d'arrivée estimées pour chaque arrêt"""
        if not delivery.optimized_route or not delivery.estimated_total_duration:
            return

        destinations = self.db.query(MultiDestinationStop).filter(
            MultiDestinationStop.delivery_id == delivery.id
        ).all()

        # Estimation simple: diviser le temps total par le nombre de destinations
        time_per_stop = delivery.estimated_total_duration / len(destinations)
        current_time = datetime.utcnow()

        for i, dest_order in enumerate(delivery.optimized_route):
            dest = next((d for d in destinations if d.original_order == dest_order), None)
            if dest:
                dest.estimated_arrival_time = current_time + timedelta(minutes=(i + 1) * time_per_stop)

        self.db.commit()

    def serialize_delivery(self, delivery: MultiDestinationDelivery) -> MultiDestinationDeliveryResponse:
        """Sérialise une livraison multi-destinataires pour la réponse API"""
        # Récupérer les stops depuis la base de données
        stops = self.db.query(MultiDestinationStop).filter_by(delivery_id=delivery.id).order_by(MultiDestinationStop.original_order).all()
        
        # Convertir les stops en MultiDestinationStopResponse
        destinations = []
        for stop in stops:
            destinations.append(MultiDestinationStopResponse.model_validate(stop, from_attributes=True))
        
        # Récupérer les informations du client
        client_data = None
        if getattr(delivery, 'client_id', None):
            from ..schemas.user import UserResponse
            client_obj = self.db.query(User).filter_by(id=delivery.client_id).first()
            if client_obj:
                client_data = {
                    "id": client_obj.id,
                    "first_name": getattr(client_obj, 'first_name', ''),
                    "last_name": getattr(client_obj, 'last_name', ''),
                    "email": getattr(client_obj, 'email', ''),
                    "phone": getattr(client_obj, 'phone', ''),
                    "role": getattr(client_obj, 'role', '')
                }
        
        # Récupérer les informations du coursier
        courier_data = None
        if getattr(delivery, 'courier_id', None):
            courier_obj = self.db.query(User).filter_by(id=delivery.courier_id).first()
            if courier_obj:
                courier_data = {
                    "id": courier_obj.id,
                    "first_name": getattr(courier_obj, 'first_name', ''),
                    "last_name": getattr(courier_obj, 'last_name', ''),
                    "email": getattr(courier_obj, 'email', ''),
                    "phone": getattr(courier_obj, 'phone', ''),
                    "role": getattr(courier_obj, 'role', '')
                }
        
        # Créer la réponse
        delivery_dict = {
            "id": delivery.id,
            "client_id": delivery.client_id,
            "courier_id": delivery.courier_id,
            "pickup_address": delivery.pickup_address,
            "pickup_commune": delivery.pickup_commune,
            "pickup_lat": delivery.pickup_lat,
            "pickup_lng": delivery.pickup_lng,
            "pickup_contact_name": delivery.pickup_contact_name,
            "pickup_contact_phone": delivery.pickup_contact_phone,
            "pickup_instructions": delivery.pickup_instructions,
            "total_destinations": delivery.total_destinations,
            "optimized_route": delivery.optimized_route,
            "estimated_total_distance": delivery.estimated_total_distance,
            "estimated_total_duration": delivery.estimated_total_duration,
            "actual_total_duration": delivery.actual_total_duration,
            "total_proposed_price": delivery.total_proposed_price,
            "total_final_price": delivery.total_final_price,
            "status": delivery.status,
            "created_at": delivery.created_at,
            "accepted_at": delivery.accepted_at,
            "started_at": delivery.started_at,
            "completed_at": delivery.completed_at,
            "cancelled_at": delivery.cancelled_at,
            "special_instructions": delivery.special_instructions,
            "vehicle_type_required": delivery.vehicle_type_required,
            "is_fragile": delivery.is_fragile,
            "is_urgent": delivery.is_urgent,
            "destinations": destinations,
            "client": client_data,
            "courier": courier_data
        }
        
        return MultiDestinationDeliveryResponse(**delivery_dict)
