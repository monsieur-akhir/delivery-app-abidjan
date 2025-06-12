#!/usr/bin/env python3
"""
Script pour créer un utilisateur administrateur
"""
import sys
import os
import asyncio

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.user import User, UserRole, UserStatus
from app.core.security import get_password_hash
from app.core.config import settings

def create_admin_user():
    """Créer un utilisateur administrateur par défaut"""
    db = SessionLocal()
    
    try:
        # Données de l'administrateur de test
        phone = "+2250701234567"
        email = "admin-livraison@yopmail.com"
        password = "admin123"
        full_name = "Admin Test"
        
        # Vérifier si l'utilisateur existe déjà
        existing_user = db.query(User).filter(User.phone == phone).first()
        if existing_user:
            print(f"❌ Un utilisateur avec le numéro {phone} existe déjà (ID: {existing_user.id})")
            return False        # Créer l'utilisateur administrateur
        hashed_password = get_password_hash(password)
        print(f"🔍 Création de l'utilisateur avec les paramètres:")
        print(f"   - phone: {phone}")
        print(f"   - email: {email}")
        print(f"   - full_name: {full_name}")
        print(f"   - role: {UserRole.manager}")
        print(f"   - status: {UserStatus.active}")
        
        admin_user = User(
            phone=phone,
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            role=UserRole.manager,
            status=UserStatus.active
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print(f"✅ Administrateur créé avec succès:")
        print(f"   - Nom: {admin_user.full_name}")
        print(f"   - Téléphone: {admin_user.phone}")
        print(f"   - Email: {admin_user.email}")
        print(f"   - Rôle: {admin_user.role}")
        print(f"   - ID: {admin_user.id}")
        print(f"   - Mot de passe: {password}")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors de la création de l'administrateur: {e}")
        return False
        
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Création d'un utilisateur administrateur de test...")
    success = create_admin_user()
    
    if success:
        print("\n🎉 Vous pouvez maintenant vous connecter avec:")
        print("   - Téléphone: +2250701234567")
        print("   - Mot de passe: admin123")
    else:
        print("\n❌ Échec de la création de l'administrateur")
