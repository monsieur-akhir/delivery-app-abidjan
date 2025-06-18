import sys
import os
import random
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Dict, Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User, UserRole, UserStatus, KYCStatus, BusinessProfile, CourierProfile
from app.models.delivery import Delivery, DeliveryStatus, DeliveryType, Bid, BidStatus
from app.models.rating import Rating
from app.models.gamification import CourierPoints, Badge, UserBadge, Achievement, UserAchievement
from app.models.wallet import Wallet, Transaction, TransactionType
from app.models.transport import Vehicle, VehicleType, VehicleStatus
from app.models.notification import Notification, NotificationType
from app.models.promotions import Promotion, PromotionType, PromotionStatus, PromotionUsage
from app.models.zones import Zone, ZoneType, ZonePricingRule
from app.models.support import SupportTicket, TicketStatus, TicketPriority
from app.core.security import get_password_hash
from app.models.market import BusinessProfile

# Données réalistes pour Abidjan
COMMUNES_ABIDJAN = [
    {"name": "Abobo", "lat": 5.4167, "lng": -4.0167},
    {"name": "Adjamé", "lat": 5.3667, "lng": -4.0167},
    {"name": "Attécoubé", "lat": 5.3333, "lng": -4.0833},
    {"name": "Cocody", "lat": 5.3667, "lng": -3.9833},
    {"name": "Koumassi", "lat": 5.2833, "lng": -3.9500},
    {"name": "Marcory", "lat": 5.2833, "lng": -4.0000},
    {"name": "Plateau", "lat": 5.3167, "lng": -4.0167},
    {"name": "Port-Bouët", "lat": 5.2333, "lng": -3.9167},
    {"name": "Treichville", "lat": 5.2833, "lng": -4.0167},
    {"name": "Yopougon", "lat": 5.3333, "lng": -4.1167}
]

NOMS_IVOIRIENS = [
    "Kouamé Yao", "Kouassi Adjoua", "N'Guessan Akissi", "Konan Kofi",
    "Ouattara Aminata", "Traoré Seydou", "Diabaté Fatou", "Coulibaly Ibrahim",
    "Doumbia Mariam", "Sangaré Moussa", "Koffi Aya", "Yao Serge",
    "Koné Adama", "Bamba Salimata", "Silué Brahima", "Touré Aïcha"
]

ENTREPRISES_ABIDJAN = [
    {"name": "Livraison Express CI", "type": "Logistique"},
    {"name": "Quick Food Delivery", "type": "Restauration"},
    {"name": "Pharma Plus", "type": "Pharmacie"},
    {"name": "Market Fresh", "type": "Supermarché"},
    {"name": "Tech Solutions", "type": "Électronique"}
]

CATEGORIES_MARCHANDISES = [
    "Alimentaire", "Électronique", "Vêtements", "Pharmacie", 
    "Documents", "Colis fragile", "Mobilier", "Cosmétiques"
]

def create_admin_user(db: Session) -> User:
    """Crée un utilisateur administrateur."""
    admin = User(
        phone="+2250700000003",
        email="admin-deleverie-test@yopmail.com",
        hashed_password=get_password_hash("admin123"),
        full_name="Administrateur Principal",
        role="manager",
        status="active",
        commune="Plateau",
        kyc_status="verified"
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin

def create_test_users(db: Session, num_users: int = 10) -> List[User]:
    """Crée des utilisateurs de test."""
    users = []
    for i in range(num_users):
        user = User(
            phone=f"+22507000000{i+2:02d}",
            email=f"user{i+1}@yopmail.com",
            hashed_password=get_password_hash("password123"),
            full_name=f"Utilisateur Test {i+1}",
            role="user",
            status="active",
            commune=random.choice(COMMUNES_ABIDJAN),
            kyc_status="verified"
        )
        db.add(user)
        users.append(user)
    db.commit()
    for user in users:
        db.refresh(user)
    return users

def create_test_couriers(db: Session, num_couriers: int = 5) -> List[User]:
    """Crée des livreurs de test."""
    couriers = []
    for i in range(num_couriers):
        courier = User(
            phone=f"+2250700000{i+12:02d}",
            email=f"courier{i+1}@yopmail.com",
            hashed_password=get_password_hash("password123"),
            full_name=f"Livreur Test {i+1}",
            role="courier",
            status="active",
            commune=random.choice(COMMUNES_ABIDJAN),
            kyc_status="verified"
        )
        db.add(courier)
        couriers.append(courier)
    db.commit()
    for courier in couriers:
        db.refresh(courier)
    return couriers

def create_test_managers(db: Session, num_managers: int = 3) -> List[User]:
    """Crée des managers de test."""
    managers = []
    for i in range(num_managers):
        manager = User(
            phone=f"+2250770000{i+17:02d}",
            email=f"manager{i+1}@yopmail.com",
            hashed_password=get_password_hash("password123"),
            full_name=f"Manager Test {i+1}",
            role="manager",
            status="active",
            commune=random.choice(COMMUNES_ABIDJAN),
            kyc_status="verified"
        )
        db.add(manager)
        managers.append(manager)
    db.commit()
    for manager in managers:
        db.refresh(manager)
    return managers

def create_test_markets(db: Session, num_markets: int = 5) -> List[BusinessProfile]:
    """Crée des marchés de test."""
    markets = []
    for i in range(num_markets):
        market = BusinessProfile(
            name=f"Marché Test {i+1}",
            description=f"Description du marché test {i+1}",
            address=f"Adresse du marché {i+1}",
            phone=f"+2250770000{i+20:02d}",
            email=f"market{i+1}@yopmail.com",
            commune=random.choice(COMMUNES_ABIDJAN),
            status="active",
            owner_id=random.choice([u.id for u in db.query(User).filter(User.role == "manager").all()])
        )
        db.add(market)
        markets.append(market)
    db.commit()
    for market in markets:
        db.refresh(market)
    return markets

def create_profiles(db: Session, users: list):
    """Créer les profils spécialisés"""
    print("Création des profils...")
    
    # Profils coursiers
    couriers = [u for u in users if u.role == UserRole.courier]
    for courier in couriers:
        profile = CourierProfile(
            user_id=courier.id,
            vehicle_type=random.choice(list(VehicleType)),
            license_plate=f"CI{random.randint(1000, 9999)}AB",
            is_online=random.choice([True, False]),
            last_location_lat=random.uniform(5.2, 5.5),
            last_location_lng=random.uniform(-4.2, -3.8)
        )
        db.add(profile)
    
    # Profils entreprises
    businesses = [u for u in users if u.role == UserRole.business]
    for i, business in enumerate(businesses):
        commune = random.choice(COMMUNES_ABIDJAN)
        business_info = ENTREPRISES_ABIDJAN[i % len(ENTREPRISES_ABIDJAN)]
        profile = BusinessProfile(
            user_id=business.id,
            business_name=business_info["name"],
            business_type=business_info["type"],
            address=f"Rue Principale, {commune['name']}",
            commune=commune["name"],
            lat=commune["lat"] + random.uniform(-0.01, 0.01),
            lng=commune["lng"] + random.uniform(-0.01, 0.01),
            commission_rate=random.uniform(0.05, 0.15)
        )
        db.add(profile)
    
    db.commit()
    print("✅ Profils créés")

def create_wallets(db: Session, users: list):
    """Créer les portefeuilles"""
    print("Création des portefeuilles...")
    
    for user in users:
        if user.role == UserRole.courier:
            balance = random.uniform(5000, 50000)
            bonus = random.uniform(1000, 5000)
        elif user.role == UserRole.business:
            balance = random.uniform(20000, 200000)
            bonus = random.uniform(2000, 10000)
        else:  # client
            balance = random.uniform(1000, 20000)
            bonus = random.uniform(500, 2000)
        
        wallet = Wallet(
            user_id=user.id,
            balance=round(balance, 2),
            bonus_balance=round(bonus, 2),
            total_earned=round(balance * random.uniform(1.5, 3.0), 2),
            total_spent=round(balance * random.uniform(0.5, 1.2), 2)
        )
        db.add(wallet)
    
    db.commit()
    print("✅ Portefeuilles créés")

def create_vehicles(db: Session, users: list):
    """Créer les véhicules"""
    print("Création des véhicules...")
    
    couriers = [u for u in users if u.role == UserRole.courier]
    businesses = [u for u in users if u.role == UserRole.business]
    
    # Véhicules pour coursiers
    for courier in couriers:
        vehicle = Vehicle(
            owner_id=courier.id,
            vehicle_type=random.choice(list(VehicleType)),
            brand=random.choice(["Yamaha", "Honda", "Suzuki", "TVS", "Bajaj"]),
            model=random.choice(["XTZ", "CB", "GSX", "Apache", "Pulsar"]),
            year=random.randint(2018, 2024),
            license_plate=f"CI{random.randint(1000, 9999)}{random.choice(['AB', 'CD', 'EF'])}",
            color=random.choice(["Noir", "Blanc", "Rouge", "Bleu", "Gris"]),
            status=random.choice([VehicleStatus.active, VehicleStatus.maintenance]),
            max_weight=random.randint(50, 200),
            insurance_expiry=datetime.now() + timedelta(days=random.randint(30, 365))
        )
        db.add(vehicle)
    
    # Véhicules pour entreprises
    for business in businesses:
        num_vehicles = random.randint(1, 3)
        for _ in range(num_vehicles):
            vehicle = Vehicle(
                business_id=business.id,
                vehicle_type=random.choice([VehicleType.CAR, VehicleType.VAN, VehicleType.TRUCK]),
                brand=random.choice(["Toyota", "Nissan", "Hyundai", "Peugeot"]),
                model=random.choice(["Hilux", "Navara", "H100", "Boxer"]),
                year=random.randint(2015, 2023),
                license_plate=f"CI{random.randint(1000, 9999)}{random.choice(['XY', 'ZW', 'UV'])}",
                color=random.choice(["Blanc", "Gris", "Bleu"]),
                status=VehicleStatus.active,
                max_weight=random.randint(500, 2000)
            )
            db.add(vehicle)
    
    db.commit()
    print("✅ Véhicules créés")

def create_zones(db: Session):
    """Créer les zones de livraison"""
    print("Création des zones...")
    
    for commune in COMMUNES_ABIDJAN:
        zone = Zone(
            name=f"Zone {commune['name']}",
            description=f"Zone de livraison pour {commune['name']}",
            zone_type=ZoneType.district.value,
            coordinates=[[
                [commune["lng"] - 0.05, commune["lat"] - 0.05],
                [commune["lng"] + 0.05, commune["lat"] - 0.05],
                [commune["lng"] + 0.05, commune["lat"] + 0.05],
                [commune["lng"] - 0.05, commune["lat"] + 0.05],
                [commune["lng"] - 0.05, commune["lat"] - 0.05]
            ]],
            center_lat=commune["lat"],
            center_lng=commune["lng"],
            radius=5.0,
            is_active=True,
            base_price=1000.0,
            price_per_km=200.0,
            max_delivery_time=60,
            min_courier_rating=3.0
        )
        db.add(zone)
    
    db.commit()
    print("✅ Zones créées")

def create_promotions(db: Session, admin: User):
    """Créer des promotions"""
    print("Création des promotions...")
    
    promotions_data = [
        {
            "name": "Bienvenue Nouveaux Clients",
            "description": "50% de réduction sur votre première livraison",
            "promotion_type": PromotionType.discount_percentage,
            "discount_value": 50.0,
            "max_discount": 2500.0,
            "min_order_value": 1000.0,
            "is_auto_apply": True
        },
        {
            "name": "Livraison Gratuite",
            "description": "Livraison gratuite pour les commandes de plus de 5000 FCFA",
            "promotion_type": PromotionType.free_delivery,
            "min_order_value": 5000.0,
            "is_auto_apply": True
        },
        {
            "name": "Cashback Weekend",
            "description": "10% de cashback le weekend",
            "promotion_type": PromotionType.cashback,
            "cashback_percentage": 10.0,
            "max_uses_per_user": 2
        }
    ]
    
    for promo_data in promotions_data:
        promotion = Promotion(
            created_by_id=admin.id,
            status=PromotionStatus.active,
            start_date=datetime.now() - timedelta(days=7),
            end_date=datetime.now() + timedelta(days=30),
            budget_allocated=50000.0,
            **promo_data
        )
        db.add(promotion)
    
    db.commit()
    print("✅ Promotions créées")

def create_deliveries(db: Session, users: list):
    """Créer des livraisons"""
    print("Création des livraisons...")
    
    clients = [u for u in users if u.role == UserRole.client]
    couriers = [u for u in users if u.role == UserRole.courier]
    
    for _ in range(50):
        client = random.choice(clients)
        pickup_commune = random.choice(COMMUNES_ABIDJAN)
        delivery_commune = random.choice(COMMUNES_ABIDJAN)
        
        # Statut aléatoire avec probabilités réalistes
        status_weights = [
            (DeliveryStatus.pending, 0.1),
            (DeliveryStatus.bidding, 0.1),
            (DeliveryStatus.accepted, 0.15),
            (DeliveryStatus.in_progress, 0.2),
            (DeliveryStatus.delivered, 0.1),
            (DeliveryStatus.completed, 0.3),
            (DeliveryStatus.cancelled, 0.05)
        ]
        status = random.choices([s[0] for s in status_weights], [s[1] for s in status_weights])[0]
        
        courier = None
        if status not in [DeliveryStatus.pending, DeliveryStatus.bidding]:
            courier = random.choice(couriers)
        
        proposed_price = random.uniform(1500, 8000)
        final_price = proposed_price * random.uniform(0.8, 1.2) if courier else None
        
        delivery = Delivery(
            client_id=client.id,
            courier_id=courier.id if courier else None,
            pickup_address=f"Adresse ramassage, {pickup_commune['name']}",
            pickup_commune=pickup_commune["name"],
            pickup_lat=pickup_commune["lat"] + random.uniform(-0.01, 0.01),
            pickup_lng=pickup_commune["lng"] + random.uniform(-0.01, 0.01),
            delivery_address=f"Adresse livraison, {delivery_commune['name']}",
            delivery_commune=delivery_commune["name"],
            delivery_lat=delivery_commune["lat"] + random.uniform(-0.01, 0.01),
            delivery_lng=delivery_commune["lng"] + random.uniform(-0.01, 0.01),
            package_description=f"Colis {random.choice(CATEGORIES_MARCHANDISES)}",
            package_weight=random.uniform(0.5, 20.0),
            cargo_category=random.choice(CATEGORIES_MARCHANDISES),
            proposed_price=round(proposed_price, 2),
            final_price=round(final_price, 2) if final_price else None,
            status=status,
            delivery_type=random.choice(list(DeliveryType)),
            created_at=datetime.now() - timedelta(days=random.randint(1, 90)),
            estimated_distance=random.uniform(2, 25),
            estimated_duration=random.randint(15, 90)
        )
        
        if status == DeliveryStatus.completed:
            delivery.completed_at = delivery.created_at + timedelta(hours=random.randint(1, 4))
        
        db.add(delivery)
    
    db.commit()
    print("✅ Livraisons créées")

def create_ratings_and_gamification(db: Session, users: list):
    """Créer les évaluations et éléments de gamification"""
    print("Création des évaluations et gamification...")
    
    # Évaluations
    deliveries = db.query(Delivery).filter(Delivery.status == DeliveryStatus.completed).all()
    for delivery in deliveries:
        if delivery.courier_id:
            # Client évalue coursier
            rating = Rating(
                delivery_id=delivery.id,
                rater_id=delivery.client_id,
                rated_user_id=delivery.courier_id,
                score=random.randint(3, 5),
                comment=random.choice([
                    "Service excellent, très rapide!",
                    "Coursier ponctuel et professionnel",
                    "Livraison parfaite, je recommande",
                    "Bon service dans l'ensemble"
                ])
            )
            db.add(rating)
    
    # Points coursiers
    couriers = [u for u in users if u.role == UserRole.courier]
    for courier in couriers:
        points = CourierPoints(
            courier_id=courier.id,
            total_points=random.randint(100, 2000),
            level=random.randint(1, 8),
            deliveries_completed=random.randint(10, 150),
            five_star_ratings=random.randint(5, 80),
            community_contributions=random.randint(0, 20)
        )
        db.add(points)
    
    db.commit()
    print("✅ Évaluations et gamification créées")

def create_transactions(db: Session, users: list):
    """Créer des transactions"""
    print("Création des transactions...")
    
    for user in users:
        num_transactions = random.randint(5, 20)
        for _ in range(num_transactions):
            transaction_type = random.choice(list(TransactionType))
            
            if transaction_type in [TransactionType.payment_delivery, TransactionType.withdrawal]:
                amount = -random.uniform(500, 5000)
            else:
                amount = random.uniform(1000, 10000)
            
            transaction = Transaction(
                user_id=user.id,
                amount=round(amount, 2),
                transaction_type=transaction_type,
                description=f"Transaction {transaction_type.value}",
                status="completed",
                created_at=datetime.now() - timedelta(days=random.randint(1, 60))
            )
            db.add(transaction)
    
    db.commit()
    print("✅ Transactions créées")

def create_support_tickets(db: Session, users: list):
    """Créer des tickets de support"""
    print("Création des tickets de support...")
    
    subjects = [
        "Problème de paiement",
        "Coursier non trouvé",
        "Livraison retardée",
        "Problème technique application",
        "Demande de remboursement",
        "Question sur les frais"
    ]
    
    for _ in range(20):
        user = random.choice(users)
        ticket = SupportTicket(
            user_id=user.id,
            subject=random.choice(subjects),
            description="Description détaillée du problème rencontré...",
            status=random.choice(list(TicketStatus)),
            priority=random.choice(list(TicketPriority)),
            created_at=datetime.now() - timedelta(days=random.randint(1, 30))
        )
        db.add(ticket)
    
    db.commit()
    print("✅ Tickets de support créés")

def seed_data():
    """Fonction principale de création des données"""
    db = SessionLocal()
    try:
        print("🚀 Début de la création des données de simulation...")
        
        # Vérifier si des données existent déjà
        existing_users = db.query(User).count()
        if existing_users > 0:
            print(f"⚠️  {existing_users} utilisateurs existent déjà. Voulez-vous continuer? (y/N)")
            response = input().lower()
            if response != 'y':
                print("❌ Opération annulée")
                return
        
        # Création séquentielle des données
        admin = create_admin_user(db)
        users = create_test_users(db)
        users.append(admin)
        
        create_profiles(db, users)
        create_wallets(db, users)
        create_vehicles(db, users)
        create_zones(db)
        create_promotions(db, admin)
        create_deliveries(db, users)
        create_ratings_and_gamification(db, users)
        create_transactions(db, users)
        create_support_tickets(db, users)
        
        print("\n🎉 Données de simulation créées avec succès!")
        print("\n📊 Résumé:")
        print(f"   👥 Utilisateurs: {db.query(User).count()}")
        print(f"   🚚 Livraisons: {db.query(Delivery).count()}")
        print(f"   🚗 Véhicules: {db.query(Vehicle).count()}")
        print(f"   💰 Portefeuilles: {db.query(Wallet).count()}")
        print(f"   🎁 Promotions: {db.query(Promotion).count()}")
        print(f"   📍 Zones: {db.query(Zone).count()}")
        
        print("\n🔑 Comptes de test:")
        print("   Admin: +2250700000000 / admin123")
        print("   Client: +225070000001 / client123")
        print("   Coursier: +225070000002 / coursier123")
        print("   Entreprise: +225070000003 / business123")
        
    except Exception as e:
        print(f"❌ Erreur lors de la création des données: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
