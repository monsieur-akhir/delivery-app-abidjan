#!/usr/bin/env python3
"""
Script rapide pour créer des données de test minimales
Utilise ce script si vous voulez juste tester rapidement l'application
"""

import sys
import os
import random
from datetime import datetime, timedelta


sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User, UserRole, UserStatus, KYCStatus
from app.models.delivery import Delivery, DeliveryStatus, DeliveryType
from app.models.wallet import Wallet
from app.core.security import get_password_hash

def quick_seed():
    """Créer rapidement des données de test minimales"""
    db = SessionLocal()
    try:
        print("🚀 Création rapide des données de test...")
        
        # Vérifier si des utilisateurs existent déjà
        existing_users = db.query(User).all()
        if existing_users:
            print("⚠️ Des utilisateurs existent déjà dans la base de données.")
            print("Voulez-vous continuer et mettre à jour les utilisateurs existants? (y/N)")
            response = input().lower()
            if response != 'y':
                print("❌ Opération annulée")
                return
        
        # Admin
        admin = db.query(User).filter(User.phone == "+2250700000000").first()
        if not admin:
            admin = User(
                phone="+2250700000000",
                email="admin@test.ci",
                hashed_password=get_password_hash("admin123"),
                full_name="Admin Test",
                role=UserRole.manager,
                status=UserStatus.active,
                kyc_status=KYCStatus.verified,
                commune="Plateau"
            )
            db.add(admin)
        
        # Client de test
        client = db.query(User).filter(User.phone == "+2250701234567").first()
        if not client:
            client = User(
                phone="+2250701234567",
                email="client@test.ci",
                hashed_password=get_password_hash("client123"),
                full_name="Client Test",
                role=UserRole.client,
                status=UserStatus.active,
                kyc_status=KYCStatus.verified,
                commune="Cocody"
            )
            db.add(client)
        
        # Coursier de test
        courier = db.query(User).filter(User.phone == "+2250707654321").first()
        if not courier:
            courier = User(
                phone="+2250707654321",
                email="coursier@test.ci",
                hashed_password=get_password_hash("coursier123"),
                full_name="Coursier Test",
                role=UserRole.courier,
                status=UserStatus.active,
                kyc_status=KYCStatus.verified,
                commune="Yopougon"
            )
            db.add(courier)
        
        # Entreprise de test
        business = db.query(User).filter(User.phone == "+2250709876543").first()
        if not business:
            business = User(
                phone="+2250709876543",
                email="business@test.ci",
                hashed_password=get_password_hash("business123"),
                full_name="Entreprise Test",
                role=UserRole.business,
                status=UserStatus.active,
                kyc_status=KYCStatus.verified,
                commune="Adjamé"
            )
            db.add(business)
        
        db.commit()
        
        # Portefeuilles
        for user in [admin, client, courier, business]:
            existing_wallet = db.query(Wallet).filter(Wallet.user_id == user.id).first()
            if not existing_wallet:
                wallet = Wallet(
                    user_id=user.id,
                    balance=10000.0
                )
                db.add(wallet)
        
        # Quelques livraisons de test
        for i in range(5):
            delivery = Delivery(
                client_id=client.id,
                pickup_address=f"Adresse ramassage {i+1}",
                pickup_commune="Cocody",
                pickup_lat=5.3667,
                pickup_lng=-3.9833,
                delivery_address=f"Adresse livraison {i+1}",
                delivery_commune="Plateau",
                delivery_lat=5.3167,
                delivery_lng=-4.0167,
                package_description=f"Colis test {i+1}",
                proposed_price=2000.0 + (i * 500),
                status=random.choice([DeliveryStatus.pending, DeliveryStatus.completed]),
                delivery_type=DeliveryType.standard
            )
            db.add(delivery)
        
        db.commit()
        
        print("✅ Données de test créées!")
        print("\n🔑 Comptes de test:")
        print("   Admin: +2250700000000 / admin123")
        print("   Client: +2250701234567 / client123")
        print("   Coursier: +2250707654321 / coursier123")
        print("   Entreprise: +2250709876543 / business123")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    quick_seed()
