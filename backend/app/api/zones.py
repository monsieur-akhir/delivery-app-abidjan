
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

from ..db.session import get_db
from ..core.dependencies import get_current_manager
from ..models.user import User
from ..models.zones import Zone, ZonePricingRule, ZoneRestriction
from ..schemas.zones import (
    ZoneCreate, ZoneUpdate, ZoneResponse,
    ZonePricingRuleCreate, ZoneRestrictionCreate
)
from ..services.geolocation import calculate_distance, point_in_polygon

router = APIRouter()

@router.post("/zones", response_model=ZoneResponse)
async def create_zone(
    zone_data: ZoneCreate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """
    Créer une nouvelle zone de livraison
    """
    zone = Zone(
        name=zone_data.name,
        description=zone_data.description,
        zone_type=zone_data.zone_type,
        coordinates=zone_data.coordinates,
        center_lat=zone_data.center_lat,
        center_lng=zone_data.center_lng,
        radius=zone_data.radius,
        min_delivery_fee=zone_data.min_delivery_fee,
        max_delivery_fee=zone_data.max_delivery_fee,
        base_price=zone_data.base_price,
        price_per_km=zone_data.price_per_km,
        max_delivery_time=zone_data.max_delivery_time,
        min_courier_rating=zone_data.min_courier_rating,
        requires_special_vehicle=zone_data.requires_special_vehicle,
        peak_hour_multiplier=zone_data.peak_hour_multiplier
    )
    
    db.add(zone)
    db.commit()
    db.refresh(zone)
    
    return zone

@router.get("/zones", response_model=List[ZoneResponse])
async def get_zones(
    zone_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """
    Récupérer toutes les zones
    """
    query = db.query(Zone)
    
    if zone_type:
        query = query.filter(Zone.zone_type == zone_type)
    if is_active is not None:
        query = query.filter(Zone.is_active == is_active)
    
    zones = query.order_by(Zone.name).all()
    return zones

@router.get("/zones/{zone_id}", response_model=ZoneResponse)
async def get_zone(
    zone_id: int,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """
    Récupérer une zone spécifique
    """
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone non trouvée")
    
    return zone

@router.put("/zones/{zone_id}", response_model=ZoneResponse)
async def update_zone(
    zone_id: int,
    zone_data: ZoneUpdate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """
    Mettre à jour une zone
    """
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone non trouvée")
    
    update_fields = zone_data.dict(exclude_unset=True)
    for field, value in update_fields.items():
        if hasattr(zone, field):
            setattr(zone, field, value)
    
    db.commit()
    db.refresh(zone)
    
    return zone

@router.delete("/zones/{zone_id}")
async def delete_zone(
    zone_id: int,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """
    Supprimer une zone
    """
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone non trouvée")
    
    db.delete(zone)
    db.commit()
    
    return {"message": "Zone supprimée avec succès"}

@router.post("/zones/{zone_id}/pricing-rules")
async def add_pricing_rule(
    zone_id: int,
    rule_data: ZonePricingRuleCreate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """
    Ajouter une règle de tarification à une zone
    """
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone non trouvée")
    
    pricing_rule = ZonePricingRule(
        zone_id=zone_id,
        **rule_data.dict()
    )
    
    db.add(pricing_rule)
    db.commit()
    db.refresh(pricing_rule)
    
    return pricing_rule

@router.post("/zones/{zone_id}/restrictions")
async def add_restriction(
    zone_id: int,
    restriction_data: ZoneRestrictionCreate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """
    Ajouter une restriction à une zone
    """
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone non trouvée")
    
    restriction = ZoneRestriction(
        zone_id=zone_id,
        **restriction_data.dict()
    )
    
    db.add(restriction)
    db.commit()
    db.refresh(restriction)
    
    return restriction

@router.get("/zones/locate")
async def locate_zones(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    db: Session = Depends(get_db)
):
    """
    Trouver les zones qui contiennent un point donné
    """
    zones = db.query(Zone).filter(Zone.is_active == True).all()
    matching_zones = []
    
    for zone in zones:
        if zone.coordinates:
            # Vérifier si le point est dans le polygone
            if point_in_polygon((lat, lng), zone.coordinates):
                matching_zones.append({
                    "zone": zone,
                    "distance_to_center": calculate_distance(
                        lat, lng, zone.center_lat, zone.center_lng
                    )
                })
    
    # Trier par distance au centre
    matching_zones.sort(key=lambda x: x["distance_to_center"])
    
    return {
        "zones": [item["zone"] for item in matching_zones],
        "total": len(matching_zones)
    }

@router.post("/zones/calculate-price")
async def calculate_delivery_price(
    pickup_lat: float,
    pickup_lng: float,
    delivery_lat: float,
    delivery_lng: float,
    package_weight: Optional[float] = None,
    is_express: bool = False,
    delivery_time: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """
    Calculer le prix de livraison basé sur les zones et règles
    """
    # Trouver les zones pour pickup et delivery
    pickup_zones_response = await locate_zones(pickup_lat, pickup_lng, db)
    delivery_zones_response = await locate_zones(delivery_lat, delivery_lng, db)
    
    pickup_zones = pickup_zones_response["zones"]
    delivery_zones = delivery_zones_response["zones"]
    
    if not pickup_zones or not delivery_zones:
        raise HTTPException(
            status_code=400, 
            detail="Une ou les deux adresses ne sont pas dans une zone de livraison"
        )
    
    # Utiliser la première zone (la plus proche du centre)
    pickup_zone = pickup_zones[0]
    delivery_zone = delivery_zones[0]
    
    # Calculer la distance
    distance = calculate_distance(pickup_lat, pickup_lng, delivery_lat, delivery_lng)
    
    # Prix de base
    base_price = pickup_zone.base_price or 1000  # Prix par défaut en XOF
    
    # Prix par kilomètre
    price_per_km = pickup_zone.price_per_km or 100
    distance_price = distance * price_per_km
    
    # Total de base
    total_price = base_price + distance_price
    
    # Appliquer les règles de tarification
    for rule in pickup_zone.pricing_rules:
        if not rule.is_active:
            continue
            
        # Vérifier les conditions temporelles
        now = datetime.utcnow()
        if rule.start_time and now < rule.start_time:
            continue
        if rule.end_time and now > rule.end_time:
            continue
        
        # Appliquer la règle selon le type de condition
        condition_met = False
        
        if rule.condition_type == "distance":
            if rule.operator == ">=" and distance >= rule.condition_value:
                condition_met = True
            elif rule.operator == "<=" and distance <= rule.condition_value:
                condition_met = True
            elif rule.operator == ">" and distance > rule.condition_value:
                condition_met = True
            elif rule.operator == "<" and distance < rule.condition_value:
                condition_met = True
            elif rule.operator == "=" and distance == rule.condition_value:
                condition_met = True
        
        elif rule.condition_type == "weight" and package_weight:
            if rule.operator == ">=" and package_weight >= rule.condition_value:
                condition_met = True
            # ... autres opérateurs
        
        # Appliquer l'ajustement de prix
        if condition_met:
            if rule.adjustment_type == "fixed":
                total_price += rule.price_adjustment
            elif rule.adjustment_type == "percentage":
                total_price *= (1 + rule.price_adjustment / 100)
    
    # Multiplicateur d'heure de pointe
    if delivery_time:
        hour = delivery_time.hour
        if 7 <= hour <= 9 or 17 <= hour <= 19:  # Heures de pointe
            total_price *= pickup_zone.peak_hour_multiplier
    
    # Surcharge express
    if is_express:
        total_price *= 1.5
    
    # Appliquer les limites min/max
    if pickup_zone.min_delivery_fee and total_price < pickup_zone.min_delivery_fee:
        total_price = pickup_zone.min_delivery_fee
    
    if pickup_zone.max_delivery_fee and total_price > pickup_zone.max_delivery_fee:
        total_price = pickup_zone.max_delivery_fee
    
    return {
        "pickup_zone": pickup_zone.name,
        "delivery_zone": delivery_zone.name,
        "distance_km": round(distance, 2),
        "base_price": base_price,
        "distance_price": distance_price,
        "total_price": round(total_price, 2),
        "estimated_time_minutes": pickup_zone.max_delivery_time,
        "pricing_breakdown": {
            "base": base_price,
            "distance": distance_price,
            "rules_applied": len([r for r in pickup_zone.pricing_rules if r.is_active]),
            "peak_hour_multiplier": pickup_zone.peak_hour_multiplier if delivery_time else 1.0,
            "express_multiplier": 1.5 if is_express else 1.0
        }
    }

@router.get("/zones/analytics")
async def get_zones_analytics(
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """
    Analyses des zones de livraison
    """
    # Statistiques par zone
    zone_stats = db.query(
        Zone.name,
        func.count(Delivery.id).label('delivery_count'),
        func.avg(Delivery.final_price).label('avg_price'),
        func.sum(Delivery.final_price).label('total_revenue')
    ).outerjoin(
        # Assumant qu'on ajoute une relation zone dans le modèle Delivery
        # Delivery, Delivery.pickup_zone_id == Zone.id
    ).group_by(Zone.id, Zone.name).all()
    
    # Zones les plus/moins utilisées
    most_used_zones = sorted(zone_stats, key=lambda x: x.delivery_count, reverse=True)[:5]
    least_used_zones = sorted(zone_stats, key=lambda x: x.delivery_count)[:5]
    
    # Revenue par zone
    revenue_by_zone = [
        {
            "zone": stat.name,
            "revenue": float(stat.total_revenue or 0),
            "deliveries": stat.delivery_count,
            "avg_price": float(stat.avg_price or 0)
        }
        for stat in zone_stats
    ]
    
    return {
        "total_zones": db.query(func.count(Zone.id)).scalar(),
        "active_zones": db.query(func.count(Zone.id)).filter(Zone.is_active == True).scalar(),
        "most_used_zones": [
            {"zone": z.name, "deliveries": z.delivery_count}
            for z in most_used_zones
        ],
        "least_used_zones": [
            {"zone": z.name, "deliveries": z.delivery_count}
            for z in least_used_zones
        ],
        "revenue_by_zone": revenue_by_zone
    }
