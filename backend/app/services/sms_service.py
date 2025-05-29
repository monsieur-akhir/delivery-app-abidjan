from typing import Dict, Any
import logging

from ..core.config import settings
from .sms_notification import SmsNotificationService

logger = logging.getLogger(__name__)

class SMSService:
    """
    Simple SMS service wrapper for sending OTP and notifications.
    """
    
    def __init__(self):
        self.enabled = getattr(settings, 'SMS_ENABLED', False)
    
    def send_sms(self, phone_number: str, message: str, priority: str = "normal") -> bool:
        """
        Send an SMS to the specified phone number.
        """
        if not self.enabled:
            logger.warning("SMS service disabled. SMS not sent to %s", phone_number)
            return True  # Return True for testing purposes
        
        try:
            # For now, we'll just log the SMS instead of actually sending it
            # This can be extended to use the existing SmsNotificationService
            logger.info("SMS to %s: %s", phone_number, message)
            
            # In production, you would integrate with the actual SMS service:
            # sms_service = SmsNotificationService(db)
            # result = await sms_service.send_sms(phone_number, message, priority)
            # return result.get("status") == "sent"
            
            return True
            
        except Exception as e:
            logger.error("Failed to send SMS to %s: %s", phone_number, str(e))
            return False
