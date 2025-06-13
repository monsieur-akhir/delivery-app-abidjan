
import pytest
from sqlalchemy.orm import Session
from ..app.services.promotions import PromotionService
from ..app.services.delivery import create_delivery
from ..app.services.wallet import add_cashback_from_promotion
from ..app.models.user import User
from ..app.models.promotions import Promotion, PromotionType, PromotionStatus
from ..app.schemas.delivery import DeliveryCreate

class TestIntegration:
    
    def test_promotion_delivery_integration(self, db: Session, client_user: User):
        """Tester l'intégration entre promotions et livraisons"""
        
        # Créer une promotion
        promotion = Promotion(
            name="Test Promo",
            promotion_type=PromotionType.discount_percentage,
            discount_value=20.0,
            status=PromotionStatus.active,
            start_date=datetime.utcnow() - timedelta(days=1),
            end_date=datetime.utcnow() + timedelta(days=30),
            is_auto_apply=True
        )
        db.add(promotion)
        db.commit()
        
        # Créer une livraison
        delivery_data = DeliveryCreate(
            pickup_address="Test pickup",
            delivery_address="Test delivery",
            pickup_latitude=5.3167,
            pickup_longitude=-4.0167,
            delivery_latitude=5.3200,
            delivery_longitude=-4.0200,
            package_weight=2.0,
            cargo_category="electronics"
        )
        
        delivery = create_delivery(db, delivery_data, client_user)
        
        # Vérifier que la promotion a été appliquée
        assert delivery.total_discount > 0
        assert len(delivery.applied_promotions) > 0
    
    def test_zone_promotion_compatibility(self, db: Session):
        """Tester la compatibilité entre zones et promotions"""
        
        # Créer une zone
        zone = Zone(
            name="Test Zone",
            zone_type="city",
            base_price=1000.0,
            price_per_km=100.0
        )
        db.add(zone)
        db.commit()
        
        # Créer une promotion ciblée sur cette zone
        promotion = Promotion(
            name="Zone Promo",
            promotion_type=PromotionType.discount_fixed,
            discount_value=500.0,
            target_zones=[zone.id],
            status=PromotionStatus.active,
            start_date=datetime.utcnow() - timedelta(days=1),
            end_date=datetime.utcnow() + timedelta(days=30)
        )
        db.add(promotion)
        db.commit()
        
        # Vérifier que la promotion est bien associée à la zone
        assert zone.id in promotion.target_zones
    
    def test_wallet_promotion_integration(self, db: Session, client_user: User):
        """Tester l'intégration entre portefeuille et promotions"""
        
        initial_balance = client_user.wallet.balance if client_user.wallet else 0
        
        # Ajouter du cashback via une promotion
        add_cashback_from_promotion(db, client_user.id, 1000.0, 1)
        
        # Vérifier que le solde a été mis à jour
        db.refresh(client_user)
        new_balance = client_user.wallet.balance
        assert new_balance == initial_balance + 1000.0
