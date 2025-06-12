import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.database import engine, SessionLocal
from app.models.user import User, UserRole, UserStatus
from app.core.security import get_password_hash
import argparse

def create_admin(phone, email, password, full_name):
    db = SessionLocal()
    try:
        # Vérifier si l'utilisateur existe déjà
        existing_user = db.query(User).filter(User.phone == phone).first()
        if existing_user:
            print(f"Un utilisateur avec le numéro de téléphone {phone} existe déjà.")
            return
        
        # Créer l'utilisateur administrateur
        admin_user = User(
            phone=phone,
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            role=UserRole.manager,
            status=UserStatus.active
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print(f"Administrateur créé avec succès: {admin_user.full_name} (ID: {admin_user.id})")
    
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Créer un utilisateur administrateur")
    parser.add_argument("--phone", required=True, help="Numéro de téléphone")
    parser.add_argument("--email", required=True, help="Adresse email")
    parser.add_argument("--password", required=True, help="Mot de passe")
    parser.add_argument("--full-name", required=True, help="Nom complet")
    
    args = parser.parse_args()
    
    create_admin(args.phone, args.email, args.password, args.full_name)
