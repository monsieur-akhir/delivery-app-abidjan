
#!/usr/bin/env python3
"""
Script de validation de la configuration Brevo complète
"""
import sys
import os
sys.path.append('.')

from app.core.config import settings
from app.services.email_service import EmailService
from app.services.sms_service import SMSService
from app.services.otp_service import OTPService
from app.schemas.otp import OTPRequest, OTPType

def test_config_variables():
    """Test des variables de configuration"""
    print("🔧 Test des variables de configuration...")
    
    required_vars = [
        'BREVO_API_KEY',
        'BREVO_API_KEY_MAIL', 
        'BREVO_API_KEY_SMS',
        'BREVO_FROM_EMAIL',
        'BREVO_FROM_NAME',
        'EMAIL_ENABLED',
        'SMS_ENABLED',
        'BREVO_ENABLED'
    ]
    
    for var in required_vars:
        value = getattr(settings, var, None)
        status = "✅" if value else "❌"
        print(f"{status} {var}: {value}")

def test_email_service():
    """Test du service Email"""
    print("\n📧 Test du service Email...")
    try:
        email_service = EmailService()
        print(f"✅ Service Email initialisé")
        print(f"📧 Brevo activé: {email_service.brevo_enabled}")
        print(f"📧 Email expéditeur: {email_service.brevo_from_email}")
        return True
    except Exception as e:
        print(f"❌ Erreur service Email: {e}")
        return False

def test_sms_service():
    """Test du service SMS"""
    print("\n📱 Test du service SMS...")
    try:
        sms_service = SMSService()
        print(f"✅ Service SMS initialisé")
        print(f"📱 Brevo SMS activé: {sms_service.brevo_enabled}")
        print(f"📱 Expéditeur SMS: {sms_service.sender}")
        return True
    except Exception as e:
        print(f"❌ Erreur service SMS: {e}")
        return False

def test_otp_service():
    """Test du service OTP"""
    print("\n🔐 Test du service OTP...")
    try:
        # Mock de la base de données pour le test
        class MockDB:
            def query(self, *args):
                return self
            def filter(self, *args):
                return self
            def first(self):
                return None
            def all(self):
                return []
            def add(self, obj):
                pass
            def commit(self):
                pass
            def refresh(self, obj):
                pass
        
        db_mock = MockDB()
        otp_service = OTPService(db_mock)
        print(f"✅ Service OTP initialisé")
        
        # Test de génération de code
        code = otp_service.generate_otp_code()
        print(f"🔑 Code OTP généré: {code}")
        
        return True
    except Exception as e:
        print(f"❌ Erreur service OTP: {e}")
        return False

def main():
    print("🚀 Test de configuration Brevo - Livraison Abidjan")
    print("=" * 60)
    print(f"🌍 Environnement: {settings.ENVIRONMENT}")
    print(f"🐛 Debug: {settings.DEBUG}")
    
    # Tests
    test_config_variables()
    email_ok = test_email_service()
    sms_ok = test_sms_service()
    otp_ok = test_otp_service()
    
    print(f"\n📊 Résultats:")
    print(f"📧 Email: {'✅' if email_ok else '❌'}")
    print(f"📱 SMS: {'✅' if sms_ok else '❌'}")
    print(f"🔐 OTP: {'✅' if otp_ok else '❌'}")
    
    if email_ok and sms_ok and otp_ok:
        print(f"\n🎉 Configuration Brevo validée avec succès!")
    else:
        print(f"\n⚠️ Problèmes détectés dans la configuration!")

if __name__ == "__main__":
    main()
