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
    
    def send_otp_email(self, to_email: str, otp_code: str, otp_type: str, expires_in_minutes: int = 5) -> bool:
        """
        Send OTP code via email with a beautiful template.
        """
        type_subjects = {
            "registration": "🔐 Code de vérification - Inscription",
            "login": "🔐 Code de vérification - Connexion", 
            "password_reset": "🔑 Code de réinitialisation du mot de passe",
            "two_factor": "🛡️ Code d'authentification à deux facteurs"
        }
        
        type_titles = {
            "registration": "Bienvenue ! Vérifiez votre compte",
            "login": "Vérification de connexion",
            "password_reset": "Réinitialisation de mot de passe",
            "two_factor": "Authentification à deux facteurs"
        }
        
        subject = type_subjects.get(otp_type, "🔐 Code de vérification")
        title = type_titles.get(otp_type, "Vérification de votre compte")
        
        # HTML template for OTP email
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{subject}</title>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }}
                .header h1 {{ margin: 0; font-size: 24px; }}
                .content {{ padding: 30px; }}
                .otp-box {{ background-color: #f8f9fa; border: 2px dashed #007bff; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }}
                .otp-code {{ font-size: 36px; font-weight: bold; color: #007bff; letter-spacing: 8px; margin: 10px 0; }}
                .warning {{ background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; color: #856404; }}
                .footer {{ background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; }}
                .btn {{ display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚚 Delivery App Abidjan</h1>
                    <p>{title}</p>
                </div>
                
                <div class="content">
                    <h2>Bonjour,</h2>
                    <p>Voici votre code de vérification :</p>
                    
                    <div class="otp-box">
                        <p>Votre code de vérification</p>
                        <div class="otp-code">{otp_code}</div>
                        <p>Valide pendant {expires_in_minutes} minutes</p>
                    </div>
                    
                    <div class="warning">
                        ⚠️ <strong>Important :</strong>
                        <ul>
                            <li>Ce code expire dans {expires_in_minutes} minutes</li>
                            <li>Ne partagez jamais ce code avec quelqu'un d'autre</li>
                            <li>Si vous n'avez pas demandé ce code, ignorez ce message</li>
                        </ul>
                    </div>
                    
                    <p>Merci de votre confiance !</p>
                    <p><strong>L'équipe Delivery App Abidjan</strong></p>
                </div>
                
                <div class="footer">
                    <p>© 2024 Delivery App Abidjan. Tous droits réservés.</p>
                    <p>Ceci est un message automatique, merci de ne pas y répondre.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        text_content = f"""
        Delivery App Abidjan - {title}
        
        Bonjour,
        
        Votre code de vérification est : {otp_code}
        
        Ce code expire dans {expires_in_minutes} minutes.
        
        Important :
        - Ne partagez jamais ce code avec quelqu'un d'autre
        - Si vous n'avez pas demandé ce code, ignorez ce message
        
        Merci de votre confiance !
        L'équipe Delivery App Abidjan
        
        ---
        Ceci est un message automatique, merci de ne pas y répondre.
        """
        
        return self.send_email(to_email, subject, text_content, html_content)
    
    def send_otp_push_notification(
        self, 
        player_ids: list, 
        otp_code: str, 
        otp_type: str
    ) -> bool:
        """
        Send OTP code via push notification.
        """
        type_titles = {
            "registration": "🔐 Code d'inscription",
            "login": "🔐 Code de connexion",
            "password_reset": "🔑 Code de réinitialisation",
            "two_factor": "🛡️ Code d'authentification"
        }
        
        title = type_titles.get(otp_type, "🔐 Code de vérification")
        message = f"Votre code : {otp_code} (valide 5 min)"
        
        data = {
            "type": "otp",
            "otp_type": otp_type,
            "code": otp_code,
            "action": "otp_received"
        }
        
        return self.send_push_notification(player_ids, title, message, data)
    
    def send_otp_by_user_tag(
        self, 
        user_id: str, 
        otp_code: str, 
        otp_type: str
    ) -> bool:
        """
        Send OTP to a specific user by their user_id tag.
        """
        return self.send_otp_push_notification_by_tag("user_id", user_id, otp_code, otp_type)
    
    def send_otp_push_notification_by_tag(
        self, 
        tag_key: str, 
        tag_value: str, 
        otp_code: str, 
        otp_type: str
    ) -> bool:
        """
        Send OTP code via push notification to users with specific tag.
        """
        type_titles = {
            "registration": "🔐 Code d'inscription",
            "login": "🔐 Code de connexion", 
            "password_reset": "🔑 Code de réinitialisation",
            "two_factor": "🛡️ Code d'authentification"
        }
        
        title = type_titles.get(otp_type, "🔐 Code de vérification")
        message = f"Votre code : {otp_code} (valide 5 min)"
        
        data = {
            "type": "otp",
            "otp_type": otp_type,
            "code": otp_code,
            "action": "otp_received"
        }
        
        return self.send_push_by_tag(tag_key, tag_value, title, message, data)
