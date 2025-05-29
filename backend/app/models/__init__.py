# Import all models here to properly initialize them
# This helps avoid circular import issues

from ..db.base import Base

# Import models in the correct order for dependency resolution
from .notification import Notification, NotificationType, NotificationStatus, NotificationChannel
from .user import (
    UserRole, 
    UserStatus,
    KYCStatus, 
    User, 
    BusinessProfile, 
    CourierProfile
)
from .market import ProductCategory, Product
from .delivery import DeliveryStatus, DeliveryType, BidStatus, Delivery, Bid, TrackingPoint
from .rating import ModerationStatus, Rating
from .wallet import TransactionType, TransactionStatus, Transaction, Wallet, Loan
from .traffic import TrafficReport, TrafficSeverity, WeatherAlert
from .transport import VehicleType, Vehicle
from .policy import Policy, PolicyType, PolicyStatus
from .gamification import RewardStatus, CourierPoints, Reward
from .collaborative_delivery import CollaborativeDelivery, CollaborativeStatus, CollaborativeRole

