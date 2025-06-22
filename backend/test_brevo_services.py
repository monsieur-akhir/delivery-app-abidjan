
#!/usr/bin/env python3
"""
Script de test pour vérifier la configuration Brevo
"""
import sys
import os
sys.path.append('.')

from app.services.email_service import EmailService
from app.services.sms_service import SMSService
from app.core.config import settings

def test_email_service():
    print("🧪 Test du service Email...")
    email_service = EmailService()
    
    # Test email simple
    success = email_service.send_email(
        to_email="test@example.com",  # Remplacez par votre email
        subject="Test Email Brevo",
        text_content="Ceci est un test d'email depuis Livraison Abidjan"
    )
    
    print(f"📧 Email test: {'✅ Succès' if success else '❌ Échec'}")
    
    # Test OTP email
    success_otp = email_service.send_otp_email(
        email="test@example.com",  # Remplacez par votre email
        code="123456",
        otp_type="login"
    )
    
    print(f"🔐 Email OTP: {'✅ Succès' if success_otp else '❌ Échec'}")

def test_sms_service():
    print("\n🧪 Test du service SMS...")
    sms_service = SMSService()
    
    # Test SMS simple
    success = sms_service.send_sms(
        phone="+22507123456",  # Remplacez par votre numéro
        message="Test SMS depuis Livraison Abidjan"
    )
    
    print(f"📱 SMS test: {'✅ Succès' if success else '❌ Échec'}")
    
    # Test OTP SMS
    success_otp = sms_service.send_otp_sms(
        phone="+22507123456",  # Remplacez par votre numéro
        code="123456",
        otp_type="login"
    )
    
    print(f"🔐 SMS OTP: {'✅ Succès' if success_otp else '❌ Échec'}")

if __name__ == "__main__":
    print("🚀 Test des services Brevo - Livraison Abidjan")
    print("="*50)
    print(f"📋 Environnement: {settings.ENVIRONMENT}")
    print(f"📧 Email activé: {getattr(settings, 'EMAIL_ENABLED', False)}")
    print(f"📱 SMS activé: {getattr(settings, 'SMS_ENABLED', False)}")
    print(f"🔧 Brevo activé: {getattr(settings, 'BREVO_ENABLED', False)}")
    
    test_email_service()
    test_sms_service()
    
    print("\n✨ Tests terminés!")
