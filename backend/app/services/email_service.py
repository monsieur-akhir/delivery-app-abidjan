import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
import logging
import requests
import json

from ..core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    """
    Service for sending emails and push notifications via OneSignal, with Brevo integration.
    """
    
    def __init__(self):
        # Email configuration
        self.smtp_server = getattr(settings, 'SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = getattr(settings, 'SMTP_PORT', 587)
        self.smtp_username = getattr(settings, 'SMTP_USERNAME', '')
        self.smtp_password = getattr(settings, 'SMTP_PASSWORD', '')
        self.from_email = getattr(settings, 'FROM_EMAIL', self.smtp_username)
        self.email_enabled = getattr(settings, 'EMAIL_ENABLED', False)
        
        # Brevo configuration
        self.brevo_api_key = getattr(settings, 'BREVO_API_KEY', '')
        self.brevo_enabled = getattr(settings, 'BREVO_ENABLED', False)
        self.brevo_url = "https://api.brevo.com/v3/smtp/email"
        self.brevo_from_email = getattr(settings, 'BREVO_FROM_EMAIL', '')
        self.brevo_from_name = getattr(settings, 'BREVO_FROM_NAME', '')
        
        # OneSignal configuration
        self.onesignal_app_id = getattr(settings, 'ONESIGNAL_APP_ID', '')
        self.onesignal_api_key = getattr(settings, 'ONESIGNAL_API_KEY', '')
        self.onesignal_enabled = getattr(settings, 'ONESIGNAL_ENABLED', False)
        self.onesignal_url = "https://onesignal.com/api/v1/notifications"
    
    def send_email_via_brevo(self, to_email: str, subject: str, message: str, html_content: Optional[str] = None) -> bool:
        """
        Send an email via Brevo API.
        """
        if not self.brevo_enabled:
            logger.warning("Brevo service disabled. Email not sent to %s", to_email)
            return False
        
        if not self.brevo_api_key:
            logger.warning("Brevo API key not configured. Email not sent to %s", to_email)
            return False
        
        try:
            headers = {
                "accept": "application/json",
                "api-key": self.brevo_api_key,
                "content-type": "application/json"
            }
            
            payload = {
                "sender": {
                    "name": self.brevo_from_name or "Delivery App",
                    "email": self.brevo_from_email or self.from_email
                },
                "to": [{"email": to_email}],
                "subject": subject,
                "textContent": message
            }
            
            if html_content:
                payload["htmlContent"] = html_content
            
            response = requests.post(self.brevo_url, headers=headers, json=payload)
            
            if response.status_code in [200, 201]:
                logger.info("Email sent successfully via Brevo to %s", to_email)
                return True
            else:
                logger.error("Failed to send email via Brevo to %s: %s", to_email, response.text)
                return False
                
        except Exception as e:
            logger.error("Error sending email via Brevo to %s: %s", to_email, str(e))
            return False
    
    def send_email(self, to_email: str, subject: str, message: str, html_content: Optional[str] = None) -> bool:
        """
        Send an email using the preferred method (Brevo first, then SMTP fallback).
        """
        # Try Brevo first if enabled
        if self.brevo_enabled and self.brevo_api_key:
            return self.send_email_via_brevo(to_email, subject, message, html_content)
        
        # Fallback to SMTP
        return self.send_email_via_smtp(to_email, subject, message)
    
    def send_email_via_smtp(self, to_email: str, subject: str, message: str) -> bool:
        """
        Send an email via SMTP (original method).
        """
        if not self.email_enabled:
            logger.warning("Email service disabled. Email not sent to %s", to_email)
            return True
        
        if not self.smtp_username or not self.smtp_password:
            logger.warning("SMTP credentials not configured. Email not sent to %s", to_email)
            return False
        
        try:
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(message, 'plain'))
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                text = msg.as_string()
                server.sendmail(self.from_email, to_email, text)
            
            logger.info("Email sent successfully via SMTP to %s", to_email)
            return True
            
        except Exception as e:
            logger.error("Failed to send email via SMTP to %s: %s", to_email, str(e))
            return False

    def send_push_notification(
        self, 
        player_ids: list, 
        title: str, 
        message: str, 
        data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send push notification via OneSignal to specific player IDs.
        """
        if not self.onesignal_enabled:
            logger.warning("OneSignal service disabled. Notification not sent")
            return True
        
        if not self.onesignal_app_id or not self.onesignal_api_key:
            logger.warning("OneSignal credentials not configured")
            return False
        
        try:
            headers = {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": f"Basic {self.onesignal_api_key}"
            }
            
            payload = {
                "app_id": self.onesignal_app_id,
                "include_player_ids": player_ids,
                "headings": {"en": title},
                "contents": {"en": message}
            }
            
            if data:
                payload["data"] = data
            
            response = requests.post(self.onesignal_url, headers=headers, json=payload)
            
            if response.status_code == 200:
                logger.info("Push notification sent successfully to %d users", len(player_ids))
                return True
            else:
                logger.error("Failed to send push notification: %s", response.text)
                return False
                
        except Exception as e:
            logger.error("Error sending push notification: %s", str(e))
            return False
    
    def send_push_to_all(
        self, 
        title: str, 
        message: str, 
        data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send push notification to all users.
        """
        if not self.onesignal_enabled:
            logger.warning("OneSignal service disabled. Notification not sent")
            return True
        
        try:
            headers = {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": f"Basic {self.onesignal_api_key}"
            }
            
            payload = {
                "app_id": self.onesignal_app_id,
                "included_segments": ["All"],
                "headings": {"en": title},
                "contents": {"en": message}
            }
            
            if data:
                payload["data"] = data
            
            response = requests.post(self.onesignal_url, headers=headers, json=payload)
            
            if response.status_code == 200:
                logger.info("Push notification sent to all users")
                return True
            else:
                logger.error("Failed to send push notification: %s", response.text)
                return False
                
        except Exception as e:
            logger.error("Error sending push notification: %s", str(e))
            return False

    def send_push_by_tag(
        self, 
        tag_key: str, 
        tag_value: str, 
        title: str, 
        message: str, 
        data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send push notification to users with specific tag.
        """
        if not self.onesignal_enabled:
            logger.warning("OneSignal service disabled. Notification not sent")
            return True
        
        try:
            headers = {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": f"Basic {self.onesignal_api_key}"
            }
            
            payload = {
                "app_id": self.onesignal_app_id,
                "filters": [{"field": "tag", "key": tag_key, "relation": "=", "value": tag_value}],
                "headings": {"en": title},
                "contents": {"en": message}
            }
            
            if data:
                payload["data"] = data
            
            response = requests.post(self.onesignal_url, headers=headers, json=payload)
            
            if response.status_code == 200:
                logger.info("Push notification sent to users with tag %s=%s", tag_key, tag_value)
                return True
            else:
                logger.error("Failed to send push notification: %s", response.text)
                return False
                
        except Exception as e:
            logger.error("Error sending push notification: %s", str(e))
            return False
