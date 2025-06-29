#!/usr/bin/env python3
"""
Script pour vérifier si un utilisateur existe en base de données.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User

def check_user_exists(phone: str):
    """Vérifie si un utilisateur existe avec ce numéro"""
    db = SessionLocal()
    
    try:
        # Nettoyer le numéro
        phone_clean = phone.strip().replace(" ", "").replace("-", "").replace(".", "")
        if len(phone_clean) == 10:
            phone_clean = "+225" + phone_clean
        if phone_clean.startswith("00225"):
            phone_clean = "+225" + phone_clean[5:]
        if phone_clean.startswith("225") and not phone_clean.startswith("+225"):
            phone_clean = "+225" + phone_clean[3:]
        
        print(f"Recherche du numéro: {phone_clean}")
        
        # Chercher l'utilisateur
        user = db.query(User).filter(User.phone == phone_clean).first()
        
        if user:
            print(f"✅ Utilisateur trouvé:")
            print(f"   ID: {user.id}")
            print(f"   Nom: {user.full_name}")
            print(f"   Email: {user.email}")
            print(f"   Statut: {user.status}")
            print(f"   Créé le: {user.created_at}")
        else:
            print(f"❌ Aucun utilisateur trouvé avec ce numéro")
        
        # Chercher aussi avec le numéro original
        user_original = db.query(User).filter(User.phone == phone).first()
        if user_original:
            print(f"⚠️  Utilisateur trouvé avec le numéro original: {phone}")
            print(f"   ID: {user_original.id}")
            print(f"   Nom: {user_original.full_name}")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python check_user_exists.py <numero>")
        print("Exemple: python check_user_exists.py 0741985473")
        sys.exit(1)
    
    phone = sys.argv[1]
    check_user_exists(phone) 