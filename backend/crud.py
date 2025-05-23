from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import json
import redis.asyncio as redis
from . import models, schemas
from .auth import get_password_hash

# Fonctions CRUD pour les utilisateurs
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_phone(db: Session, phone: str):
    return db.query(models.User).filter(models.User.phone == phone).first()

def get_users(db: Session, role: Optional[str] = None, status: Optional[str] = None, skip: int = 0, limit: int = 100):
    query = db.query(models.User)
    
    if role:
        query = query.filter(models.User.role == role)
    
    if status:
        query = query.filter(models.User.status == status)
    
    return query.offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        phone=user.phone,
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role,
        commune=user.commune
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Si c'est un coursier, créer une entrée de points
    if user.role == "courier":
        db_points = models.CourierPoints(courier_id=db_user.id)
        db.add(db_points)
        db.commit()
    
    return db_user

def update_user_status(db: Session, user_id: int, status: str):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.status = status
        db.commit()
        db.refresh(db_user)
    return db_user

# Fonctions CRUD pour les livraisons
def get_delivery(db: Session, delivery_id: int):
    return db.query(models.Delivery).filter(models.Delivery.id == delivery_id).first()

async def get_delivery_async(delivery_id: int):
    # Cette fonction est utilisée dans le contexte WebSocket
    # Dans un vrai projet, vous utiliseriez une bibliothèque comme SQLAlchemy asyncio
    # Pour simplifier, nous simulons une requête asynchrone
    from .database import SessionLocal
    db = SessionLocal()
    try:
        delivery = db.query(models.Delivery).filter(models.Delivery.id == delivery_id).first()
        return delivery
    finally:
        db.close()

def get_deliveries(db: Session, skip: int = 0, limit: int = 100, status: Optional[str] = None):
    query = db.query(models.Delivery)
    
    if status:
        query = query.filter(models.Delivery.status == status)
    
    return query.order_by(desc(models.Delivery.created_at)).offset(skip).limit(limit).all()

def get_deliveries_by_client(db: Session, client_id: int, skip: int = 0, limit: int = 100, status: Optional[str] = None):
    query = db.query(models.Delivery).filter(models.Delivery.client_id == client_id)
    
    if status:
        query = query.filter(models.Delivery.status == status)
    
    return query.order_by(desc(models.Delivery.created_at)).offset(skip).limit(limit).all()

def get_deliveries_by_courier(db: Session, courier_id: int, skip: int = 0, limit: int = 100, status: Optional[str] = None):
    query = db.query(models.Delivery).filter(models.Delivery.courier_id == courier_id)
    
    if status:
        query = query.filter(models.Delivery.status == status)
    
    return query.order_by(desc(models.Delivery.created_at)).offset(skip).limit(limit).all()

def create_delivery(db: Session, delivery: schemas.DeliveryCreate, client_id: int):
    db_delivery = models.Delivery(
        client_id=client_id,
        pickup_address=delivery.pickup_address,
        pickup_commune=delivery.pickup_commune,
        pickup_lat=delivery.pickup_lat,
        pickup_lng=delivery.pickup_lng,
        delivery_address=delivery.delivery_address,
        delivery_commune=delivery.delivery_commune,
        delivery_lat=delivery.delivery_lat,
        delivery_lng=delivery.delivery_lng,
        description=delivery.description,
        proposed_price=delivery.proposed_price
    )
    db.add(db_delivery)
    db.commit()
    db.refresh(db_delivery)
    return db_delivery

def create_bid(db: Session, delivery_id: int, courier_id: int, bid: schemas.BidCreate):
    # Vérifier si la livraison existe
    delivery = db.query(models.Delivery).filter(models.Delivery.id == delivery_id).first()
    if not delivery:
        return None
    
    # Ajouter l'enchère
    stmt = models.bids.insert().values(
        delivery_id=delivery_id,
        courier_id=courier_id,
        amount=bid.amount
    )
    db.execute(stmt)
    db.commit()
    
    # Retourner la livraison mise à jour
    return delivery

def accept_bid(db: Session, delivery_id: int, courier_id: int):
    # Vérifier si la livraison existe
    delivery = db.query(models.Delivery).filter(models.Delivery.id == delivery_id).first()
    if not delivery:
        return None
    
    # Récupérer l'enchère
    bid = db.query(models.bids).filter(
        models.bids.c.delivery_id == delivery_id,
        models.bids.c.courier_id == courier_id
    ).first()
    
    if not bid:
        return None
    
    # Mettre à jour la livraison
    delivery.courier_id = courier_id
    delivery.final_price = bid.amount
    delivery.status = "accepted"
    db.commit()
    db.refresh(delivery)
    
    return delivery

def update_delivery_status(db: Session, delivery_id: int, status: str):
    delivery = db.query(models.Delivery).filter(models.Delivery.id == delivery_id).first()
    if not delivery:
        return None
    
    delivery.status = status
    
    # Si la livraison est terminée, mettre à jour la date de fin
    if status == "completed":
        delivery.completed_at = datetime.now()
        
        # Mettre à jour les points du coursier
        if delivery.courier_id:
            courier_points = db.query(models.CourierPoints).filter(
                models.CourierPoints.courier_id == delivery.courier_id
            ).first()
            
            if courier_points:
                # Ajouter 10 points pour chaque livraison terminée
                courier_points.total_points += 10
                courier_points.deliveries_completed += 1
                
                # Mettre à jour le niveau (1 niveau tous les 100 points)
                courier_points.level = (courier_points.total_points // 100) + 1
                
                db.commit()
    
    db.commit()
    db.refresh(delivery)
    return delivery

# Fonctions CRUD pour les évaluations
def create_rating(db: Session, rating: schemas.RatingCreate, rater_id: int):
    db_rating = models.Rating(
        delivery_id=rating.delivery_id,
        rater_id=rater_id,
        rated_user_id=rating.rated_user_id,
        score=rating.score,
        comment=rating.comment,
        voice_comment_url=rating.voice_comment_url
    )
    db.add(db_rating)
    db.commit()
    db.refresh(db_rating)
    
    # Si c'est une évaluation 5 étoiles pour un coursier, mettre à jour ses points
    if rating.score == 5 and db.query(models.User).filter(
        models.User.id == rating.rated_user_id,
        models.User.role == "courier"
    ).first():
        courier_points = db.query(models.CourierPoints).filter(
            models.CourierPoints.courier_id == rating.rated_user_id
        ).first()
        
        if courier_points:
            # Ajouter 5 points pour chaque évaluation 5 étoiles
            courier_points.total_points += 5
            courier_points.five_star_ratings += 1
            
            # Mettre à jour le niveau (1 niveau tous les 100 points)
            courier_points.level = (courier_points.total_points // 100) + 1
            
            db.commit()
    
    return db_rating

def get_ratings_for_user(db: Session, user_id: int):
    return db.query(models.Rating).filter(models.Rating.rated_user_id == user_id).all()

# Fonctions CRUD pour la gamification
def get_courier_points(db: Session, courier_id: int):
    return db.query(models.CourierPoints).filter(models.CourierPoints.courier_id == courier_id).first()

def get_leaderboard(db: Session, commune: Optional[str] = None, limit: int = 10):
    query = db.query(
        models.CourierPoints.courier_id,
        models.User.full_name.label("courier_name"),
        models.User.profile_picture,
        models.CourierPoints.total_points,
        models.CourierPoints.level,
        models.CourierPoints.deliveries_completed,
        models.User.commune
    ).join(
        models.User, models.CourierPoints.courier_id == models.User.id
    ).filter(
        models.User.role == "courier",
        models.User.status == "active"
    )
    
    if commune:
        query = query.filter(models.User.commune == commune)
    
    return query.order_by(desc(models.CourierPoints.total_points)).limit(limit).all()

# Fonctions CRUD pour le marché intégré
def get_merchants(db: Session, commune: Optional[str] = None, category: Optional[str] = None, skip: int = 0, limit: int = 20):
    query = db.query(models.Merchant).filter(models.Merchant.is_verified == True)
    
    if commune:
        query = query.filter(models.Merchant.commune == commune)
    
    if category:
        query = query.filter(models.Merchant.category == category)
    
    return query.offset(skip).limit(limit).all()

def get_products(db: Session, merchant_id: Optional[int] = None, category: Optional[str] = None, skip: int = 0, limit: int = 20):
    query = db.query(models.Product).filter(models.Product.is_available == True)
    
    if merchant_id:
        query = query.filter(models.Product.merchant_id == merchant_id)
    
    if category:
        query = query.filter(models.Product.category == category)
    
    return query.offset(skip).limit(limit).all()

# Fonctions CRUD pour les tableaux de bord
def get_business_dashboard(db: Session, business_id: int):
    # Récupérer les statistiques de livraison
    total_deliveries = db.query(func.count(models.Delivery.id)).filter(
        models.Delivery.courier_id == business_id
    ).scalar()
    
    completed_deliveries = db.query(func.count(models.Delivery.id)).filter(
        models.Delivery.courier_id == business_id,
        models.Delivery.status == "completed"
    ).scalar()
    
    active_deliveries = db.query(func.count(models.Delivery.id)).filter(
        models.Delivery.courier_id == business_id,
        models.Delivery.status.in_(["accepted", "in_progress", "delivered"])
    ).scalar()
    
    # Calculer la note moyenne
    avg_rating = db.query(func.avg(models.Rating.score)).filter(
        models.Rating.rated_user_id == business_id
    ).scalar() or 0
    
    # Calculer le revenu total
    total_revenue = db.query(func.sum(models.Delivery.final_price)).filter(
        models.Delivery.courier_id == business_id,
        models.Delivery.status == "completed"
    ).scalar() or 0
    
    # Récupérer les livraisons récentes
    recent_deliveries = db.query(models.Delivery).filter(
        models.Delivery.courier_id == business_id
    ).order_by(desc(models.Delivery.created_at)).limit(5).all()
    
    # Calculer les revenus par jour (7 derniers jours)
    revenue_by_day = {}
    for i in range(7):
        date = (datetime.now() - timedelta(days=i)).date()
        revenue = db.query(func.sum(models.Delivery.final_price)).filter(
            models.Delivery.courier_id == business_id,
            models.Delivery.status == "completed",
            func.date(models.Delivery.completed_at) == date
        ).scalar() or 0
        revenue_by_day[date.strftime("%Y-%m-%d")] = float(revenue)
    
    return {
        "total_deliveries": total_deliveries,
        "completed_deliveries": completed_deliveries,
        "active_deliveries": active_deliveries,
        "average_rating": float(avg_rating),
        "total_revenue": float(total_revenue),
        "recent_deliveries": recent_deliveries,
        "revenue_by_day": revenue_by_day
    }

def get_manager_dashboard(db: Session):
    # Compter les utilisateurs par rôle
    total_users = {}
    for role in ["client", "courier", "business", "manager"]:
        count = db.query(func.count(models.User.id)).filter(models.User.role == role).scalar()
        total_users[role] = count
    
    # Compter les livraisons actives et terminées
    active_deliveries = db.query(func.count(models.Delivery.id)).filter(
        models.Delivery.status.in_(["accepted", "in_progress", "delivered"])
    ).scalar()
    
    completed_deliveries = db.query(func.count(models.Delivery.id)).filter(
        models.Delivery.status == "completed"
    ).scalar()
    
    # Calculer le revenu total
    total_revenue = db.query(func.sum(models.Delivery.final_price)).filter(
        models.Delivery.status == "completed"
    ).scalar() or 0
    
    # Calculer les revenus par commune
    revenue_by_commune = {}
    communes = db.query(models.Delivery.delivery_commune).distinct().all()
    for commune in communes:
        commune = commune[0]
        revenue = db.query(func.sum(models.Delivery.final_price)).filter(
            models.Delivery.delivery_commune == commune,
            models.Delivery.status == "completed"
        ).scalar() or 0
        revenue_by_commune[commune] = float(revenue)
    
    # Récupérer les meilleurs coursiers
    top_couriers = get_leaderboard(db, limit=5)
    
    # Récupérer les livraisons récentes
    recent_deliveries = db.query(models.Delivery).order_by(desc(models.Delivery.created_at)).limit(10).all()
    
    # Calculer les statistiques de livraison par jour (7 derniers jours)
    delivery_stats_by_day = {}
    for i in range(7):
        date = (datetime.now() - timedelta(days=i)).date()
        date_str = date.strftime("%Y-%m-%d")
        
        # Compter les livraisons créées ce jour-là
        created = db.query(func.count(models.Delivery.id)).filter(
            func.date(models.Delivery.created_at) == date
        ).scalar()
        
        # Compter les livraisons terminées ce jour-là
        completed = db.query(func.count(models.Delivery.id)).filter(
            models.Delivery.status == "completed",
            func.date(models.Delivery.completed_at) == date
        ).scalar()
        
        delivery_stats_by_day[date_str] = {
            "created": created,
            "completed": completed
        }
    
    return {
        "total_users": total_users,
        "active_deliveries": active_deliveries,
        "completed_deliveries": completed_deliveries,
        "total_revenue": float(total_revenue),
        "revenue_by_commune": revenue_by_commune,
        "top_couriers": top_couriers,
        "recent_deliveries": recent_deliveries,
        "delivery_stats_by_day": delivery_stats_by_day
    }
