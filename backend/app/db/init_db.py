import logging
from sqlalchemy.orm import Session

from ..core.config import settings
from ..models.user import User, UserRole, UserStatus, BusinessProfile, CourierProfile
from ..models.delivery import Delivery, Bid, TrackingPoint, CollaborativeDelivery
from ..models.rating import Rating
from ..models.gamification import CourierPoints, PointTransaction, Reward
from ..models.market import Product
from ..models.wallet import Wallet, Transaction, Loan
from ..models.notification import Notification
from ..models.traffic import TrafficReport, WeatherAlert
from ..core.security import get_password_hash

logger = logging.getLogger(__name__)

# Fonction pour initialiser la base de données
def init_db(db: Session) -> None:
    # Créer un utilisateur administrateur si aucun n'existe
    admin = db.query(User).filter(User.role == UserRole.manager).first()
    if not admin:
        logger.info("Création de l'utilisateur administrateur")
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
        
        # Créer un portefeuille pour l'administrateur
        admin_wallet = Wallet(user_id=admin_user.id)
        db.add(admin_wallet)
        db.commit()
        
        logger.info(f"Administrateur créé avec l'ID: {admin_user.id}")
    else:
        logger.info("Un administrateur existe déjà")
