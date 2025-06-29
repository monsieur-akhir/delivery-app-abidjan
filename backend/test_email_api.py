#!/usr/bin/env python3
"""
Script de test pour l'API Email de Livraison Abidjan
"""
import requests
import json
import sys
import os

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"

# Couleurs pour l'affichage
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header(title):
    """Afficher un en-tête coloré"""
    print(f"\n{Colors.CYAN}{Colors.BOLD}{'='*60}{Colors.END}")
    print(f"{Colors.CYAN}{Colors.BOLD}{title:^60}{Colors.END}")
    print(f"{Colors.CYAN}{Colors.BOLD}{'='*60}{Colors.END}")

def print_success(message):
    """Afficher un message de succès"""
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")

def print_error(message):
    """Afficher un message d'erreur"""
    print(f"{Colors.RED}❌ {message}{Colors.END}")

def print_info(message):
    """Afficher un message d'information"""
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.END}")

def print_warning(message):
    """Afficher un message d'avertissement"""
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")

def test_email_service_status():
    """Tester le statut du service email"""
    print_header("Test du Statut du Service Email")
    
    try:
        response = requests.get(f"{API_URL}/email/status")
        
        if response.status_code == 200:
            status = response.json()
            print_success("Statut du service email récupéré")
            print(f"📧 Brevo activé: {status['brevo_enabled']}")
            print(f"📧 SMTP configuré: {status['smtp_configured']}")
            print(f"📧 Email activé: {status['email_enabled']}")
            print(f"📧 Expéditeur: {status['from_email']}")
            print(f"📧 Nom expéditeur: {status['from_name']}")
            return True
        else:
            print_error(f"Erreur {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Erreur de connexion: {str(e)}")
        return False

def test_send_simple_email():
    """Tester l'envoi d'un email simple"""
    print_header("Test d'Envoi d'Email Simple")
    
    email_data = {
        "to_email": "test@example.com",  # Remplacez par votre email
        "subject": "Test API Email - Livraison Abidjan",
        "text_content": "Ceci est un test de l'API email de Livraison Abidjan.\n\nCe message a été envoyé via l'API REST.",
        "html_content": """
        <html>
        <body>
            <h2>Test API Email - Livraison Abidjan</h2>
            <p>Ceci est un test de l'API email de Livraison Abidjan.</p>
            <p>Ce message a été envoyé via l'API REST.</p>
            <hr>
            <p><em>Date: {datetime}</em></p>
        </body>
        </html>
        """
    }
    
    try:
        response = requests.post(f"{API_URL}/email/send", json=email_data)
        
        if response.status_code == 200:
            result = response.json()
            print_success("Email simple envoyé avec succès")
            print(f"📧 Destinataire: {result['to_email']}")
            print(f"📧 Sujet: {result['subject']}")
            print(f"📧 Message: {result['message']}")
            return True
        else:
            print_error(f"Erreur {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Erreur de connexion: {str(e)}")
        return False

def test_send_otp_email():
    """Tester l'envoi d'un email OTP"""
    print_header("Test d'Envoi d'Email OTP")
    
    otp_data = {
        "email": "test@example.com",  # Remplacez par votre email
        "code": "123456",
        "otp_type": "registration"
    }
    
    try:
        response = requests.post(f"{API_URL}/email/send-otp", json=otp_data)
        
        if response.status_code == 200:
            result = response.json()
            print_success("Email OTP envoyé avec succès")
            print(f"📧 Destinataire: {result['email']}")
            print(f"📧 Type OTP: {result['otp_type']}")
            print(f"📧 Message: {result['message']}")
            return True
        else:
            print_error(f"Erreur {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Erreur de connexion: {str(e)}")
        return False

def test_send_template_email():
    """Tester l'envoi d'un email avec template"""
    print_header("Test d'Envoi d'Email avec Template")
    
    template_data = {
        "to_email": "test@example.com",  # Remplacez par votre email
        "template_name": "welcome",
        "variables": {
            "name": "John Doe",
            "company": "Livraison Abidjan"
        }
    }
    
    try:
        response = requests.post(f"{API_URL}/email/send-template", json=template_data)
        
        if response.status_code == 200:
            result = response.json()
            print_success("Email template envoyé avec succès")
            print(f"📧 Destinataire: {result['to_email']}")
            print(f"📧 Template: {result['template_name']}")
            print(f"📧 Message: {result['message']}")
            return True
        else:
            print_error(f"Erreur {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Erreur de connexion: {str(e)}")
        return False

def test_send_bulk_emails():
    """Tester l'envoi d'emails en masse"""
    print_header("Test d'Envoi d'Emails en Masse")
    
    bulk_data = {
        "emails": [
            "test1@example.com",
            "test2@example.com",
            "test3@example.com"
        ],
        "subject": "Test Email en Masse - Livraison Abidjan",
        "text_content": "Ceci est un test d'envoi en masse via l'API email.",
        "html_content": """
        <html>
        <body>
            <h2>Test Email en Masse</h2>
            <p>Ceci est un test d'envoi en masse via l'API email de Livraison Abidjan.</p>
        </body>
        </html>
        """
    }
    
    try:
        response = requests.post(f"{API_URL}/email/send-bulk", json=bulk_data)
        
        if response.status_code == 200:
            result = response.json()
            print_success("Emails en masse envoyés")
            print(f"📧 Total: {result['total_sent']}")
            print(f"📧 Succès: {result['success_count']}")
            print(f"📧 Échecs: {result['failure_count']}")
            print(f"📧 Message: {result['message']}")
            return True
        else:
            print_error(f"Erreur {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Erreur de connexion: {str(e)}")
        return False

def test_get_templates():
    """Tester la récupération des templates disponibles"""
    print_header("Test de Récupération des Templates")
    
    try:
        response = requests.get(f"{API_URL}/email/templates")
        
        if response.status_code == 200:
            templates = response.json()
            print_success("Templates récupérés avec succès")
            print(f"📧 Templates disponibles: {', '.join(templates)}")
            return True
        else:
            print_error(f"Erreur {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Erreur de connexion: {str(e)}")
        return False

def test_delivery_notification_email():
    """Tester l'envoi d'un email de notification de livraison"""
    print_header("Test d'Email de Notification de Livraison")
    
    delivery_template_data = {
        "to_email": "test@example.com",  # Remplacez par votre email
        "template_name": "delivery_update",
        "variables": {
            "name": "Marie Dupont",
            "delivery_id": "12345",
            "status": "En cours de livraison",
            "address": "123 Rue de la Paix, Abidjan"
        }
    }
    
    try:
        response = requests.post(f"{API_URL}/email/send-template", json=delivery_template_data)
        
        if response.status_code == 200:
            result = response.json()
            print_success("Email de notification de livraison envoyé")
            print(f"📧 Destinataire: {result['to_email']}")
            print(f"📧 Template: {result['template_name']}")
            print(f"📧 Message: {result['message']}")
            return True
        else:
            print_error(f"Erreur {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Erreur de connexion: {str(e)}")
        return False

def main():
    """Fonction principale de test"""
    print_header("Test de l'API Email - Livraison Abidjan")
    
    print_info("Ce script teste les fonctionnalités de l'API email")
    print_info("Assurez-vous que le serveur backend est démarré sur http://localhost:8000")
    print_warning("Remplacez 'test@example.com' par votre vraie adresse email pour les tests")
    
    # Tests
    tests = [
        ("Statut du service email", test_email_service_status),
        ("Email simple", test_send_simple_email),
        ("Email OTP", test_send_otp_email),
        ("Email avec template", test_send_template_email),
        ("Emails en masse", test_send_bulk_emails),
        ("Récupération des templates", test_get_templates),
        ("Notification de livraison", test_delivery_notification_email)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n{Colors.PURPLE}{Colors.BOLD}Test: {test_name}{Colors.END}")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print_error(f"Erreur lors du test: {str(e)}")
            results.append((test_name, False))
    
    # Résumé
    print_header("Résumé des Tests")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print(f"📊 Tests réussis: {passed}/{total}")
    
    for test_name, result in results:
        status = f"{Colors.GREEN}✅ PASS{Colors.END}" if result else f"{Colors.RED}❌ FAIL{Colors.END}"
        print(f"  {status} {test_name}")
    
    if passed == total:
        print_success("Tous les tests ont réussi !")
    else:
        print_warning(f"{total - passed} test(s) ont échoué")
    
    print_info("Consultez la documentation de l'API sur http://localhost:8000/docs")

if __name__ == "__main__":
    main() 