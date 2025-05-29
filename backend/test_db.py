#!/usr/bin/env python3

import sys
import os

# Ajouter le répertoire racine au path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.user import User, UserRole, UserStatus
from app.models.wallet import Wallet
from app.core.security import get_password_hash

def test_database():
    """Test de base de la connexion à la base de données et création d'un admin"""
    print("🔄 Test de connexion à la base de données...")
    
    try:
        db = SessionLocal()
        
        # Vérifier si un admin existe déjà
        admin = db.query(User).filter(User.role == UserRole.manager).first()
        
        if not admin:
            print("📝 Création de l'utilisateur administrateur...")
            
            # Créer l'utilisateur admin
            admin_user = User(
                phone="+2250700000000",
                email="admin@livraison-abidjan.com",
                hashed_password=get_password_hash("admin123"),
                full_name="Administrateur Système",
                role=UserRole.manager,
                status=UserStatus.active
            )
            
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            
            # Créer un portefeuille pour l'admin
            admin_wallet = Wallet(user_id=admin_user.id)
            db.add(admin_wallet)
            db.commit()
            
            print(f"✅ Administrateur créé avec succès! ID: {admin_user.id}")
            
        else:
            print(f"ℹ️  Un administrateur existe déjà (ID: {admin.id}, Email: {admin.email})")
        
        # Test de comptage des utilisateurs
        user_count = db.query(User).count()
        print(f"📊 Nombre total d'utilisateurs dans la base: {user_count}")
        
        # Test de comptage des tables principales
        from app.models.delivery import Delivery
        from app.models.transport import Vehicle
        
        delivery_count = db.query(Delivery).count()
        vehicle_count = db.query(Vehicle).count()
        
        print(f"📦 Nombre de livraisons: {delivery_count}")
        print(f"🚗 Nombre de véhicules: {vehicle_count}")
        
        db.close()
        print("✅ Test de base de données réussi!")
        
    except Exception as e:
        print(f"❌ Erreur lors du test de la base de données: {e}")
        if 'db' in locals():
            db.close()
        return False
    
    return True

if __name__ == "__main__":
    success = test_database()
    sys.exit(0 if success else 1)
