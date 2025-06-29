#!/usr/bin/env python3
"""
Script de test pour la validation atomique d'unicité des utilisateurs.
Teste que les utilisateurs ne sont pas créés en cas de conflit.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.auth import register_user_atomic
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.exceptions import ConflictError
from app.models.wallet import Wallet
from app.models.user import CourierProfile, BusinessProfile
from app.models.gamification import CourierPoints

def test_atomic_validation():
    """Test de la validation atomique d'unicité"""
    db = SessionLocal()
    
    try:
        print("🧪 Test de validation atomique d'unicité")
        print("=" * 50)
        
        # Nettoyer d'abord les données de test
        # Supprimer dans l'ordre pour respecter les contraintes de clé étrangère
        
        # Supprimer les wallets d'abord
        db.query(Wallet).filter(Wallet.user_id.in_(
            db.query(User.id).filter(User.phone.like("+225%"))
        )).delete(synchronize_session=False)
        
        # Supprimer les profils de coursier
        db.query(CourierProfile).filter(CourierProfile.user_id.in_(
            db.query(User.id).filter(User.phone.like("+225%"))
        )).delete(synchronize_session=False)
        
        # Supprimer les points de coursier
        db.query(CourierPoints).filter(CourierPoints.courier_id.in_(
            db.query(User.id).filter(User.phone.like("+225%"))
        )).delete(synchronize_session=False)
        
        # Supprimer les profils d'entreprise
        db.query(BusinessProfile).filter(BusinessProfile.user_id.in_(
            db.query(User.id).filter(User.phone.like("+225%"))
        )).delete(synchronize_session=False)
        
        # Maintenant supprimer les utilisateurs
        db.query(User).filter(User.phone.like("+225%")).delete()
        db.commit()
        
        # Test 1: Créer un premier utilisateur (devrait passer)
        print("\n1️⃣ Test création premier utilisateur...")
        try:
            user_data = UserCreate(
                phone="0123456789",
                email="test1@example.com",
                password="password123",
                full_name="Test User 1",
                role="client"
            )
            user1 = register_user_atomic(db, user_data)
            print(f"✅ Succès: Utilisateur créé avec ID {user1.id}")
        except Exception as e:
            print(f"❌ Erreur: {e}")
            return
        
        # Test 2: Essayer de créer un utilisateur avec le même numéro
        print("\n2️⃣ Test avec numéro existant...")
        try:
            user_data = UserCreate(
                phone="0123456789",  # Même numéro
                email="test2@example.com",  # Email différent
                password="password123",
                full_name="Test User 2",
                role="client"
            )
            user2 = register_user_atomic(db, user_data)
            print(f"❌ Erreur: L'utilisateur aurait dû ne pas être créé")
        except ConflictError as e:
            print(f"✅ Succès: Conflit détecté - {e}")
        except Exception as e:
            print(f"❌ Erreur inattendue: {e}")
        
        # Vérifier qu'aucun nouvel utilisateur n'a été créé
        user_count = db.query(User).filter(User.phone == "+2250123456789").count()
        print(f"📊 Nombre d'utilisateurs avec ce numéro: {user_count}")
        
        # Test 3: Essayer de créer un utilisateur avec le même email
        print("\n3️⃣ Test avec email existant...")
        try:
            user_data = UserCreate(
                phone="0987654321",  # Numéro différent
                email="test1@example.com",  # Même email
                password="password123",
                full_name="Test User 3",
                role="client"
            )
            user3 = register_user_atomic(db, user_data)
            print(f"❌ Erreur: L'utilisateur aurait dû ne pas être créé")
        except ConflictError as e:
            print(f"✅ Succès: Conflit détecté - {e}")
        except Exception as e:
            print(f"❌ Erreur inattendue: {e}")
        
        # Vérifier qu'aucun nouvel utilisateur n'a été créé
        user_count = db.query(User).filter(User.email == "test1@example.com").count()
        print(f"📊 Nombre d'utilisateurs avec cet email: {user_count}")
        
        # Test 4: Créer un utilisateur avec des données uniques (devrait passer)
        print("\n4️⃣ Test création utilisateur avec données uniques...")
        try:
            user_data = UserCreate(
                phone="1111111111",
                email="unique@example.com",
                password="password123",
                full_name="Unique User",
                role="client"
            )
            user4 = register_user_atomic(db, user_data)
            print(f"✅ Succès: Utilisateur créé avec ID {user4.id}")
        except Exception as e:
            print(f"❌ Erreur: {e}")
        
        # Test 5: Test avec différents formats de numéro
        print("\n5️⃣ Test avec différents formats de numéro...")
        formats = [
            "0123456789",
            "002250123456789",
            "2250123456789",
            "+2250123456789"
        ]
        
        for i, phone in enumerate(formats):
            try:
                user_data = UserCreate(
                    phone=phone,
                    email=f"format{i}@example.com",
                    password="password123",
                    full_name=f"Format User {i}",
                    role="client"
                )
                user = register_user_atomic(db, user_data)
                print(f"✅ Format {i+1}: {phone} -> {user.phone}")
            except ConflictError as e:
                print(f"⚠️  Conflit pour format {i+1}: {e}")
            except Exception as e:
                print(f"❌ Erreur pour format {i+1}: {e}")
        
        print("\n" + "=" * 50)
        print("🎉 Tests terminés!")
        
        # Afficher le nombre total d'utilisateurs créés
        total_users = db.query(User).filter(User.phone.like("+225%")).count()
        print(f"📊 Total d'utilisateurs créés: {total_users}")
        
    except Exception as e:
        print(f"❌ Erreur générale: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_atomic_validation() 