#!/usr/bin/env python3
"""
Script de test pour la validation atomique d'unicité des utilisateurs.
Teste les différents scénarios de conflit.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.auth import validate_user_uniqueness
from app.models.user import User
from app.core.exceptions import ConflictError

def test_uniqueness_validation():
    """Test de la validation atomique d'unicité"""
    db = SessionLocal()
    
    try:
        print("🧪 Test de validation atomique d'unicité")
        print("=" * 50)
        
        # Test 1: Numéro et email uniques (devrait passer)
        print("\n1️⃣ Test avec numéro et email uniques...")
        try:
            phone_clean, email_clean = validate_user_uniqueness(
                db, "0123456789", "test@example.com"
            )
            print(f"✅ Succès: {phone_clean}, {email_clean}")
        except Exception as e:
            print(f"❌ Erreur: {e}")
        
        # Test 2: Numéro existant, email unique
        print("\n2️⃣ Test avec numéro existant...")
        # Créer un utilisateur avec le numéro
        existing_user = User(
            phone="+2250123456789",
            email="existing@example.com",
            hashed_password="test",
            full_name="Test User",
            role="client"
        )
        db.add(existing_user)
        db.commit()
        
        try:
            phone_clean, email_clean = validate_user_uniqueness(
                db, "0123456789", "new@example.com"
            )
            print(f"❌ Erreur: La validation aurait dû échouer")
        except ConflictError as e:
            print(f"✅ Succès: Conflit détecté - {e}")
        except Exception as e:
            print(f"❌ Erreur inattendue: {e}")
        
        # Test 3: Numéro unique, email existant
        print("\n3️⃣ Test avec email existant...")
        try:
            phone_clean, email_clean = validate_user_uniqueness(
                db, "0987654321", "existing@example.com"
            )
            print(f"❌ Erreur: La validation aurait dû échouer")
        except ConflictError as e:
            print(f"✅ Succès: Conflit détecté - {e}")
        except Exception as e:
            print(f"❌ Erreur inattendue: {e}")
        
        # Test 4: Numéro et email existants
        print("\n4️⃣ Test avec numéro et email existants...")
        try:
            phone_clean, email_clean = validate_user_uniqueness(
                db, "0123456789", "existing@example.com"
            )
            print(f"❌ Erreur: La validation aurait dû échouer")
        except ConflictError as e:
            print(f"✅ Succès: Conflit détecté - {e}")
        except Exception as e:
            print(f"❌ Erreur inattendue: {e}")
        
        # Test 5: Numéro unique, pas d'email
        print("\n5️⃣ Test avec numéro unique, pas d'email...")
        try:
            phone_clean, email_clean = validate_user_uniqueness(
                db, "1111111111", None
            )
            print(f"✅ Succès: {phone_clean}, {email_clean}")
        except Exception as e:
            print(f"❌ Erreur: {e}")
        
        # Test 6: Différents formats de numéro
        print("\n6️⃣ Test avec différents formats de numéro...")
        formats = [
            "0123456789",
            "0123456789",
            "002250123456789",
            "2250123456789",
            "+2250123456789"
        ]
        
        for i, phone in enumerate(formats):
            try:
                phone_clean, email_clean = validate_user_uniqueness(
                    db, phone, f"format{i}@example.com"
                )
                print(f"✅ Format {i+1}: {phone} -> {phone_clean}")
            except ConflictError as e:
                print(f"⚠️  Conflit pour format {i+1}: {e}")
            except Exception as e:
                print(f"❌ Erreur pour format {i+1}: {e}")
        
        print("\n" + "=" * 50)
        print("🎉 Tests terminés!")
        
    except Exception as e:
        print(f"❌ Erreur générale: {e}")
    finally:
        # Nettoyer les données de test
        try:
            db.query(User).filter(User.phone.like("+225%")).delete()
            db.commit()
        except Exception as e:
            print(f"⚠️  Erreur lors du nettoyage: {e}")
        db.close()

if __name__ == "__main__":
    test_uniqueness_validation() 