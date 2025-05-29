from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from ..models.user import User
from ..core.exceptions import NotFoundError, BadRequestError


# Pour l'instant, on va simuler des organisations de dons
# Dans une version future, cela pourrait être stocké en base de données
DONATION_ORGANIZATIONS = [
    {
        "id": 1,
        "name": "Croix-Rouge Côte d'Ivoire",
        "description": "Organisation humanitaire internationale",
        "category": "humanitarian",
        "min_amount": 1000,
        "logo_url": "/static/organizations/croix-rouge.png",
        "is_active": True
    },
    {
        "id": 2,
        "name": "SOS Villages d'Enfants",
        "description": "Protection et soutien aux enfants vulnérables",
        "category": "children",
        "min_amount": 500,
        "logo_url": "/static/organizations/sos-villages.png",
        "is_active": True
    },
    {
        "id": 3,
        "name": "Médecins Sans Frontières",
        "description": "Assistance médicale d'urgence",
        "category": "health",
        "min_amount": 2000,
        "logo_url": "/static/organizations/msf.png",
        "is_active": True
    },
    {
        "id": 4,
        "name": "Fondation Children of Africa",
        "description": "Éducation et formation des jeunes",
        "category": "education",
        "min_amount": 1000,
        "logo_url": "/static/organizations/children-africa.png",
        "is_active": True
    }
]


def get_donation_organizations(
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """
    Récupère la liste des organisations de dons disponibles.
    """
    organizations = DONATION_ORGANIZATIONS.copy()
    
    # Filtrer par catégorie si spécifiée
    if category:
        organizations = [org for org in organizations if org["category"] == category]
    
    # Filtrer les organisations actives
    organizations = [org for org in organizations if org["is_active"]]
    
    # Pagination simple
    start_idx = skip
    end_idx = skip + limit
    
    return organizations[start_idx:end_idx]


def get_donation_stats(db: Session) -> Dict[str, Any]:
    """
    Récupère les statistiques des dons.
    Pour l'instant, on retourne des données simulées.
    """
    # Dans une version future, ces données viendraient d'une table de dons
    return {
        "total_donations": 150,
        "total_amount": 2500000,  # En francs CFA
        "total_organizations": len(DONATION_ORGANIZATIONS),
        "monthly_donations": 45,
        "monthly_amount": 750000,
        "top_organization": {
            "name": "Croix-Rouge Côte d'Ivoire",
            "donations_count": 45,
            "total_amount": 890000
        },
        "recent_donations": [
            {
                "id": 1,
                "organization_name": "SOS Villages d'Enfants",
                "amount": 5000,
                "donor_name": "Jean D.",
                "created_at": "2024-01-15T10:30:00Z"
            },
            {
                "id": 2,
                "organization_name": "Croix-Rouge Côte d'Ivoire",
                "amount": 10000,
                "donor_name": "Marie K.",
                "created_at": "2024-01-14T16:45:00Z"
            },
            {
                "id": 3,
                "organization_name": "Médecins Sans Frontières",
                "amount": 7500,
                "donor_name": "Paul M.",
                "created_at": "2024-01-14T09:20:00Z"
            }
        ]
    }


def create_donation(
    db: Session,
    user_id: int,
    organization_id: int,
    amount: float,
    message: Optional[str] = None
) -> Dict[str, Any]:
    """
    Crée un nouveau don.
    Pour l'instant, on simule la création en retournant des données.
    """
    # Vérifier que l'utilisateur existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("Utilisateur non trouvé")
    
    # Vérifier que l'organisation existe
    organization = next((org for org in DONATION_ORGANIZATIONS if org["id"] == organization_id), None)
    if not organization:
        raise NotFoundError("Organisation non trouvée")
    
    # Vérifier le montant minimum
    if amount < organization["min_amount"]:
        raise BadRequestError(f"Le montant minimum pour cette organisation est de {organization['min_amount']} FCFA")
    
    # Vérifier que l'utilisateur a assez de fonds (à implémenter avec le système de portefeuille)
    # Pour l'instant, on suppose que le don est validé
    
    # Simulation de la création du don
    donation = {
        "id": 123,  # ID simulé
        "user_id": user_id,
        "user_name": user.full_name,
        "organization_id": organization_id,
        "organization_name": organization["name"],
        "amount": amount,
        "message": message,
        "status": "completed",
        "transaction_reference": f"DON_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        "created_at": datetime.utcnow().isoformat()
    }
    
    return donation


def get_donations(
    db: Session,
    user_id: Optional[int] = None,
    organization_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """
    Récupère la liste des dons avec filtrage optionnel.
    Pour l'instant, on retourne des données simulées.
    """
    # Données simulées de dons
    sample_donations = [
        {
            "id": 1,
            "user_id": 1,
            "user_name": "Jean Dupont",
            "organization_id": 1,
            "organization_name": "Croix-Rouge Côte d'Ivoire",
            "amount": 5000,
            "message": "Pour aider les victimes d'inondations",
            "status": "completed",
            "transaction_reference": "DON_20240115103000",
            "created_at": "2024-01-15T10:30:00Z"
        },
        {
            "id": 2,
            "user_id": 2,
            "user_name": "Marie Kouassi",
            "organization_id": 2,
            "organization_name": "SOS Villages d'Enfants",
            "amount": 10000,
            "message": "Pour l'éducation des enfants",
            "status": "completed",
            "transaction_reference": "DON_20240114164500",
            "created_at": "2024-01-14T16:45:00Z"
        },
        {
            "id": 3,
            "user_id": 1,
            "user_name": "Jean Dupont",
            "organization_id": 3,
            "organization_name": "Médecins Sans Frontières",
            "amount": 7500,
            "message": "",
            "status": "completed",
            "transaction_reference": "DON_20240114092000",
            "created_at": "2024-01-14T09:20:00Z"
        },
        {
            "id": 4,
            "user_id": 3,
            "user_name": "Paul Martin",
            "organization_id": 1,
            "organization_name": "Croix-Rouge Côte d'Ivoire",
            "amount": 15000,
            "message": "Don mensuel",
            "status": "completed",
            "transaction_reference": "DON_20240113143000",
            "created_at": "2024-01-13T14:30:00Z"
        }
    ]
    
    donations = sample_donations.copy()
    
    # Filtrer par utilisateur si spécifié
    if user_id:
        donations = [don for don in donations if don["user_id"] == user_id]
    
    # Filtrer par organisation si spécifiée
    if organization_id:
        donations = [don for don in donations if don["organization_id"] == organization_id]
    
    # Pagination simple
    start_idx = skip
    end_idx = skip + limit
    
    return donations[start_idx:end_idx]


def get_donation_by_id(donation_id: int) -> Optional[Dict[str, Any]]:
    """
    Récupère un don par son ID.
    """
    # Pour l'instant, on retourne une donnée simulée
    if donation_id == 1:
        return {
            "id": 1,
            "user_id": 1,
            "user_name": "Jean Dupont",
            "organization_id": 1,
            "organization_name": "Croix-Rouge Côte d'Ivoire",
            "amount": 5000,
            "message": "Pour aider les victimes d'inondations",
            "status": "completed",
            "transaction_reference": "DON_20240115103000",
            "created_at": "2024-01-15T10:30:00Z"
        }
    return None


def get_user_donation_stats(db: Session, user_id: int) -> Dict[str, Any]:
    """
    Récupère les statistiques de dons d'un utilisateur.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("Utilisateur non trouvé")
    
    # Pour l'instant, on retourne des données simulées
    user_donations = get_donations(db, user_id=user_id)
    
    total_donations = len(user_donations)
    total_amount = sum(don["amount"] for don in user_donations)
    
    return {
        "user_id": user_id,
        "user_name": user.full_name,
        "total_donations": total_donations,
        "total_amount": total_amount,
        "average_donation": total_amount / total_donations if total_donations > 0 else 0,
        "first_donation_date": min(don["created_at"] for don in user_donations) if user_donations else None,
        "last_donation_date": max(don["created_at"] for don in user_donations) if user_donations else None,
        "favorite_organization": "Croix-Rouge Côte d'Ivoire",  # Données simulées
        "donation_streak": 3  # Nombre de mois consécutifs avec au moins un don
    }
