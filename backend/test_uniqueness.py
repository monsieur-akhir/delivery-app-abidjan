#!/usr/bin/env python3
"""
Script de test pour vérifier les validations d'unicité
du numéro de téléphone et de l'email
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.auth import register_user
from app.schemas.user import UserCreate
from app.models.user import UserRole
from app.core.exceptions import ConflictError

def test_phone_uniqueness():
    """Test l'unicité du numéro de téléphone"""
    print("🧪 Test d'unicité du numéro de téléphone...")
    
    db = SessionLocal()
    try:
        # Données de test
        user_data_1 = UserCreate(
            phone="+2250701234567",
            email="test1@example.com",
            password="password123",
            full_name="Test User 1",
            role=UserRole.client
        )
        
        user_data_2 = UserCreate(
            phone="+2250701234567",  # Même numéro
            email="test2@example.com",
            password="password123",
            full_name="Test User 2",
            role=UserRole.client
        )
        
        # Créer le premier utilisateur
        print("  📱 Création du premier utilisateur...")
        user1 = register_user(db, user_data_1)
        print(f"  ✅ Utilisateur 1 créé avec ID: {user1.id}")
        
        # Essayer de créer le deuxième utilisateur avec le même numéro
        print("  📱 Tentative de création du deuxième utilisateur avec le même numéro...")
        try:
            user2 = register_user(db, user_data_2)
            print("  ❌ ERREUR: Le deuxième utilisateur a été créé avec le même numéro!")
            return False
        except ConflictError as e:
            print(f"  ✅ Conflit détecté: {e}")
            return True
        except Exception as e:
            print(f"  ❌ Erreur inattendue: {e}")
            return False
            
    finally:
        db.close()

def test_email_uniqueness():
    """Test l'unicité de l'email"""
    print("\n🧪 Test d'unicité de l'email...")
    
    db = SessionLocal()
    try:
        # Données de test
        user_data_1 = UserCreate(
            phone="+2250701234568",
            email="test@example.com",
            password="password123",
            full_name="Test User 1",
            role=UserRole.client
        )
        
        user_data_2 = UserCreate(
            phone="+2250701234569",
            email="test@example.com",  # Même email
            password="password123",
            full_name="Test User 2",
            role=UserRole.client
        )
        
        # Créer le premier utilisateur
        print("  📧 Création du premier utilisateur...")
        user1 = register_user(db, user_data_1)
        print(f"  ✅ Utilisateur 1 créé avec ID: {user1.id}")
        
        # Essayer de créer le deuxième utilisateur avec le même email
        print("  📧 Tentative de création du deuxième utilisateur avec le même email...")
        try:
            user2 = register_user(db, user_data_2)
            print("  ❌ ERREUR: Le deuxième utilisateur a été créé avec le même email!")
            return False
        except ConflictError as e:
            print(f"  ✅ Conflit détecté: {e}")
            return True
        except Exception as e:
            print(f"  ❌ Erreur inattendue: {e}")
            return False
            
    finally:
        db.close()

def test_phone_format_validation():
    """Test la validation du format du numéro de téléphone"""
    print("\n🧪 Test de validation du format du numéro de téléphone...")
    
    db = SessionLocal()
    try:
        # Test avec différents formats
        test_cases = [
            ("0701234567", "Format local"),
            ("+2250701234567", "Format international"),
            ("2250701234567", "Format sans +"),
            ("", "Numéro vide"),
            ("123", "Numéro trop court"),
            ("+12345678901234567890", "Numéro trop long"),
        ]
        
        for phone, description in test_cases:
            print(f"  📱 Test: {description} - '{phone}'")
            try:
                user_data = UserCreate(
                    phone=phone,
                    email="test@example.com",
                    password="password123",
                    full_name="Test User",
                    role=UserRole.client
                )
                print(f"    ✅ Format accepté")
            except ValueError as e:
                print(f"    ✅ Format rejeté: {e}")
            except Exception as e:
                print(f"    ❌ Erreur inattendue: {e}")
                
    finally:
        db.close()

def cleanup_test_users():
    """Nettoie les utilisateurs de test"""
    print("\n🧹 Nettoyage des utilisateurs de test...")
    
    db = SessionLocal()
    try:
        # Supprimer les utilisateurs de test
        test_phones = ["+2250701234567", "+2250701234568", "+2250701234569"]
        for phone in test_phones:
            user = db.query(User).filter(User.phone == phone).first()
            if user:
                db.delete(user)
                print(f"  🗑️ Utilisateur supprimé: {phone}")
        
        db.commit()
        print("  ✅ Nettoyage terminé")
        
    except Exception as e:
        print(f"  ❌ Erreur lors du nettoyage: {e}")
        db.rollback()
    finally:
        db.close()

def main():
    """Fonction principale de test"""
    print("🚀 Démarrage des tests de validation d'unicité\n")
    
    # Tests
    phone_test = test_phone_uniqueness()
    email_test = test_email_uniqueness()
    format_test = test_phone_format_validation()
    
    # Nettoyage
    cleanup_test_users()
    
    # Résumé
    print("\n📊 Résumé des tests:")
    print(f"  📱 Unicité téléphone: {'✅ PASS' if phone_test else '❌ FAIL'}")
    print(f"  📧 Unicité email: {'✅ PASS' if email_test else '❌ FAIL'}")
    print(f"  🔍 Validation format: {'✅ PASS' if format_test else '❌ FAIL'}")
    
    if phone_test and email_test:
        print("\n🎉 Tous les tests d'unicité sont passés!")
        return 0
    else:
        print("\n💥 Certains tests ont échoué!")
        return 1

if __name__ == "__main__":
    exit(main()) 