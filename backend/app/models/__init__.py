# Import all models here to properly initialize them
# This helps avoid circular import issues

from ..db.base import Base

# 1. First import enums and basic models without dependencies
from .notification import NotificationType, NotificationStatus, NotificationChannel
from .user import UserRole, UserStatus, KYCStatus
from .delivery import DeliveryStatus, DeliveryType, BidStatus
from .rating import ModerationStatus
from .wallet import TransactionType, TransactionStatus
from .traffic import TrafficSeverity
from .transport import VehicleType
from .policy import PolicyType, PolicyStatus
from .gamification import RewardStatus
from .collaborative_delivery import CollaborativeStatus, CollaborativeRole
from .complaint import ComplaintType, ComplaintStatus, ComplaintPriority
from .support import TicketStatus, TicketPriority, TicketCategory

# 2. Import enums for negotiation and multi-destination
from .negotiation import NegotiationType, NegotiationStatus
from .multi_destination_delivery import MultiDestinationStatus

# 3. Then import models with simple relationships
from .market import ProductCategory, Product
from .traffic import TrafficReport, WeatherAlert
from .transport import Vehicle
from .policy import Policy
from .gamification import CourierPoints, Reward
from .collaborative_delivery import CollaborativeDelivery
from .support import SupportTicket, TicketMessage, TicketAttachment, SupportKnowledgeBase

# 4. Import scheduled delivery and negotiation models
from .scheduled_delivery import ScheduledDelivery, ScheduledDeliveryExecution
from .negotiation import ScheduledDeliveryNegotiation
from .multi_destination_delivery import MultiDestinationDelivery, MultiDestinationStop, MultiDestinationBid

# 5. Import models with more complex relationships (User must come after negotiation models)
from .notification import Notification
from .user import User, BusinessProfile, CourierProfile
from .delivery import Delivery, Bid, TrackingPoint
from .rating import Rating
from .wallet import Wallet, Transaction, Loan
from .complaint import Complaint

# Export all models for easy access 
__all__ = [
    'Base',
    'Notification', 'NotificationType', 'NotificationStatus', 'NotificationChannel',
    'User', 'UserRole', 'UserStatus', 'KYCStatus', 'BusinessProfile', 'CourierProfile',
    'ProductCategory', 'Product',
    'Delivery', 'DeliveryStatus', 'DeliveryType', 'Bid', 'BidStatus', 'TrackingPoint',
    'Rating', 'ModerationStatus',
    'Wallet', 'Transaction', 'TransactionType', 'TransactionStatus', 'Loan',
    'TrafficReport', 'TrafficSeverity', 'WeatherAlert',
    'Vehicle', 'VehicleType',
    'Policy', 'PolicyType', 'PolicyStatus',
    'CourierPoints', 'Reward', 'RewardStatus',
    'CollaborativeDelivery', 'CollaborativeStatus', 'CollaborativeRole',
    'Complaint', 'ComplaintType', 'ComplaintStatus', 'ComplaintPriority',
    'SupportTicket', 'TicketMessage', 'TicketAttachment', 'SupportKnowledgeBase',
    'TicketStatus', 'TicketPriority', 'TicketCategory',
    'ScheduledDelivery', 'ScheduledDeliveryExecution',
    'ScheduledDeliveryNegotiation', 'NegotiationType', 'NegotiationStatus',
    'MultiDestinationDelivery', 'MultiDestinationStop', 'MultiDestinationBid', 'MultiDestinationStatus'
]