import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from database import engine, SessionLocal
from models import User, UserRole, UserStatus, Delivery, DeliveryStatus, Rating, CourierPoints, Merchant, Product
from auth import get_password_hash
import random
from datetime import datetime, timedelta

# Liste des communes d'Abidjan
COMMUNES = [
    "Abobo", "Adjamé", "Attécoubé", "Cocody", "Koumassi", 
    "Marcory", "Plateau", "Port-Bouët", "Treichville", "Yopougon"
]

def seed_data():
    db = SessionLocal()
    try:
        # Créer des utilisateurs
        print("Création des utilisateurs...")
        users = []
        
        # Créer 10 clients
        for i in range(1, 11):
            client = User(
                phone=f"+22507000000{i}",
                email=f"client{i}@example.com",
                hashed_password=get_password_hash("password123"),
                full_name=f"Client {i}",
                role=UserRole.client,
                status=UserStatus.active,
                commune=random.choice(COMMUNES),
                profile_picture=f"https://randomuser.me/api/portraits/men/{i}.jpg" if i % 2 == 0 else f"https://randomuser.me/api/portraits/women/{i}.jpg"
            )
            db.add(client)
            users.append(client)
        
        # Créer 5 coursiers
        for i in range(1, 6):
            courier = User(
                phone=f"+22507100000{i}",
                email=f"courier{i}@example.com",
                hashed_password=get_password_hash("password123"),
                full_name=f"Coursier {i}",
                role=UserRole.courier,
                status=UserStatus.active,
                commune=random.choice(COMMUNES),
                profile_picture=f"https://randomuser.me/api/portraits/men/{i+10}.jpg" if i % 2 == 0 else f"https://randomuser.me/api/portraits/women/{i+10}.jpg"
            )
            db.add(courier)
            users.append(courier)
        
        # Créer 3 entreprises
        for i in range(1, 4):
            business = User(
                phone=f"+22507200000{i}",
                email=f"business{i}@example.com",
                hashed_password=get_password_hash("password123"),
                full_name=f"Entreprise {i}",
                role=UserRole.business,
                status=UserStatus.active,
                commune=random.choice(COMMUNES),
                profile_picture=f"https://randomuser.me/api/portraits/men/{i+20}.jpg"
            )
            db.add(business)
            users.append(business)
        
        # Créer 2 gestionnaires
        for i in range(1, 3):
            manager = User(
                phone=f"+22507300000{i}",
                email=f"manager{i}@example.com",
                hashed_password=get_password_hash("password123"),
                full_name=f"Gestionnaire {i}",
                role=UserRole.manager,
                status=UserStatus.active,
                commune=random.choice(COMMUNES),
                profile_picture=f"https://randomuser.me/api/portraits/men/{i+30}.jpg" if i % 2 == 0 else f"https://randomuser.me/api/portraits/women/{i+30}.jpg"
            )
            db.add(manager)
            users.append(manager)
        
        db.commit()
        
        # Créer des points pour les coursiers
        print("Création des points pour les coursiers...")
        for i in range(11, 16):  # Les coursiers ont les IDs 11-15
            courier_points = CourierPoints(
                courier_id=i,
                total_points=random.randint(50, 500),
                level=random.randint(1, 5),
                deliveries_completed=random.randint(10, 100),
                five_star_ratings=random.randint(5, 50)
            )
            db.add(courier_points)
        
        db.commit()
        
        # Créer des livraisons
        print("Création des livraisons...")
        deliveries = []
        
        # Statuts possibles pour les livraisons
        statuses = [
            DeliveryStatus.pending,
            DeliveryStatus.accepted,
            DeliveryStatus.in_progress,
            DeliveryStatus.delivered,
            DeliveryStatus.completed,
            DeliveryStatus.cancelled
        ]
        
        # Créer 30 livraisons
        for i in range(1, 31):
            # Choisir un client aléatoire (IDs 1-10)
            client_id = random.randint(1, 10)
            
            # Déterminer si la livraison a un coursier
            has_courier = random.random() > 0.3
            courier_id = random.randint(11, 15) if has_courier else None
            
            # Déterminer le statut en fonction de la présence d'un coursier
            if not has_courier:
                status = DeliveryStatus.pending
            else:
                status = random.choice(statuses[1:])  # Exclure "pending" si un coursier est assigné
            
            # Déterminer le prix final si la livraison est acceptée ou terminée
            final_price = None
            if status in [DeliveryStatus.accepted, DeliveryStatus.in_progress, DeliveryStatus.delivered, DeliveryStatus.completed]:
                final_price = round(random.uniform(1000, 5000), 2)
            
            # Déterminer la date de fin si la livraison est terminée
            completed_at = None
            if status == DeliveryStatus.completed:
                completed_at = datetime.now() - timedelta(days=random.randint(1, 30))
            
            # Créer la livraison
            pickup_commune = random.choice(COMMUNES)
            delivery_commune = random.choice(COMMUNES)
            
            delivery = Delivery(
                client_id=client_id,
                courier_id=courier_id,
                pickup_address=f"Adresse de ramassage {i}, {pickup_commune}",
                pickup_commune=pickup_commune,
                pickup_lat=5.3 + random.random() * 0.1,
                pickup_lng=-4.0 + random.random() * 0.1,
                delivery_address=f"Adresse de livraison {i}, {delivery_commune}",
                delivery_commune=delivery_commune,
                delivery_lat=5.3 + random.random() * 0.1,
                delivery_lng=-4.0 + random.random() * 0.1,
                description=f"Description de la livraison {i}",
                proposed_price=round(random.uniform(1000, 5000), 2),
                final_price=final_price,
                status=status,
                created_at=datetime.now() - timedelta(days=random.randint(1, 60)),
                completed_at=completed_at
            )
            
            db.add(delivery)
            deliveries.append(delivery)
        
        db.commit()
        
        # Créer des évaluations pour les livraisons terminées
        print("Création des évaluations...")
        for delivery in deliveries:
            if delivery.status == DeliveryStatus.completed and delivery.courier_id:
                # Le client évalue le coursier
                client_rating = Rating(
                    delivery_id=delivery.id,
                    rater_id=delivery.client_id,
                    rated_user_id=delivery.courier_id,
                    score=random.randint(3, 5),
                    comment=f"Commentaire du client pour la livraison {delivery.id}"
                )
                db.add(client_rating)
                
                # Le coursier évalue le client
                courier_rating = Rating(
                    delivery_id=delivery.id,
                    rater_id=delivery.courier_id,
                    rated_user_id=delivery.client_id,
                    score=random.randint(3, 5),
                    comment=f"Commentaire du coursier pour la livraison {delivery.id}"
                )
                db.add(courier_rating)
        
        db.commit()
        
        # Créer des commerçants
        print("Création des commerçants...")
        merchants = []
        
        # Catégories de commerçants
        categories = ["Restaurant", "Supermarché", "Pharmacie", "Boutique", "Électronique"]
        
        # Créer 5 commerçants
        for i in range(1, 6):
            merchant = Merchant(
                user_id=random.randint(16, 18),  # Les entreprises ont les IDs 16-18
                business_name=f"Commerce {i}",
                business_description=f"Description du commerce {i}",
                category=random.choice(categories),
                commune=random.choice(COMMUNES),
                address=f"Adresse du commerce {i}",
                lat=5.3 + random.random() * 0.1,
                lng=-4.0 + random.random() * 0.1,
                logo_url=f"https://picsum.photos/200/200?random={i}",
                is_verified=random.random() > 0.2
            )
            db.add(merchant)
            merchants.append(merchant)
        
        db.commit()
        
        # Créer des produits
        print("Création des produits...")
        
        # Catégories de produits
        product_categories = ["Alimentaire", "Électronique", "Vêtements", "Santé", "Maison"]
        
        # Créer 20 produits
        for i in range(1, 21):
            merchant_id = random.randint(1, len(merchants))
            
            product = Product(
                merchant_id=merchant_id,
                name=f"Produit {i}",
                description=f"Description du produit {i}",
                price=round(random.uniform(500, 20000), 2),
                image_url=f"https://picsum.photos/300/300?random={i}",
                category=random.choice(product_categories),
                is_available=random.random() > 0.1
            )
            db.add(product)
        
        db.commit()
        
        print("Données de test créées avec succès!")
    
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
