#!/usr/bin/env python3
"""
Test de création de livraison avec tous les champs requis
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
DELIVERY_URL = f"{BASE_URL}/api/v1/deliveries/"

def test_delivery_creation():
    """Test de création de livraison avec authentification"""
    
    # 1. Connexion utilisateur
    login_data = {
        "phone": "+2250701234567",
        "password": "test123"
    }
    
    print("🔐 Connexion utilisateur...")
    login_response = requests.post(LOGIN_URL, json=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Erreur de connexion: {login_response.status_code}")
        print(login_response.text)
        return
    
    login_result = login_response.json()
    if not login_result.get("success"):
        print(f"❌ Échec de connexion: {login_result.get('message')}")
        return
    
    access_token = login_result.get("access_token")
    print("✅ Connexion réussie")
    
    # 2. Création de livraison
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Exemple complet de livraison
    delivery_data = {
        # Champs obligatoires
        "pickup_address": "123 Rue des Cocotiers, Cocody",
        "pickup_commune": "Cocody",
        "delivery_address": "456 Avenue de la Paix, Plateau",
        "delivery_commune": "Plateau",
        "proposed_price": 1500.0,
        
        # Coordonnées GPS (optionnelles mais recommandées)
        "pickup_lat": 5.3600,
        "pickup_lng": -3.9678,
        "delivery_lat": 5.3167,
        "delivery_lng": -4.0167,
        
        # Contacts (optionnels)
        "pickup_contact_name": "Jean Dupont",
        "pickup_contact_phone": "+2250701234567",
        "delivery_contact_name": "Marie Martin",
        "delivery_contact_phone": "+2250707654321",
        
        # Informations sur le colis (optionnelles)
        "package_description": "Documents importants",
        "package_size": "small",
        "package_weight": 0.5,
        "is_fragile": False,
        "cargo_category": "documents",
        "required_vehicle_type": "motorcycle",
        "delivery_type": "standard",
        
        # Champs additionnels du mobile (optionnels)
        "package_type": "envelope",
        "recipient_name": "Marie Martin",
        "recipient_phone": "+2250707654321",
        "special_instructions": "Livrer entre 9h et 17h",
        "distance": 8.5,
        "estimated_duration": 25,
        "weather_conditions": "clear",
        "vehicle_type": "motorcycle",
        "delivery_speed": "normal",
        "extras": ["insurance", "tracking"]
    }
    
    print("\n📦 Création de livraison...")
    print("Données envoyées:")
    print(json.dumps(delivery_data, indent=2, ensure_ascii=False))
    
    delivery_response = requests.post(DELIVERY_URL, json=delivery_data, headers=headers)
    
    print(f"\n📊 Réponse du serveur:")
    print(f"Status: {delivery_response.status_code}")
    
    if delivery_response.status_code == 200:
        result = delivery_response.json()
        print("✅ Livraison créée avec succès!")
        print(f"ID de livraison: {result.get('delivery', {}).get('id')}")
        print(f"Message: {result.get('message')}")
        
        # Afficher les détails de la livraison créée
        delivery = result.get('delivery', {})
        print(f"\n📋 Détails de la livraison:")
        print(f"  - Statut: {delivery.get('status')}")
        print(f"  - Prix proposé: {delivery.get('proposed_price')} FCFA")
        print(f"  - Adresse de ramassage: {delivery.get('pickup_address')}")
        print(f"  - Adresse de livraison: {delivery.get('delivery_address')}")
        print(f"  - Créée le: {delivery.get('created_at')}")
        
    else:
        print("❌ Erreur lors de la création:")
        try:
            error_detail = delivery_response.json()
            print(json.dumps(error_detail, indent=2, ensure_ascii=False))
        except:
            print(delivery_response.text)

def test_minimal_delivery():
    """Test de création de livraison avec champs minimaux"""
    
    # 1. Connexion utilisateur
    login_data = {
        "phone": "+2250701234567",
        "password": "test123"
    }
    
    print("\n🔐 Connexion utilisateur pour test minimal...")
    login_response = requests.post(LOGIN_URL, json=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Erreur de connexion: {login_response.status_code}")
        return
    
    login_result = login_response.json()
    access_token = login_result.get("access_token")
    
    # 2. Création de livraison minimale
    headers = {"Authorization": f"Bearer {access_token}"}
    
    minimal_delivery = {
        "pickup_address": "789 Boulevard de la République, Treichville",
        "pickup_commune": "Treichville",
        "delivery_address": "321 Rue du Commerce, Marcory",
        "delivery_commune": "Marcory",
        "proposed_price": 800.0
    }
    
    print("\n📦 Création de livraison minimale...")
    print("Données minimales:")
    print(json.dumps(minimal_delivery, indent=2, ensure_ascii=False))
    
    delivery_response = requests.post(DELIVERY_URL, json=minimal_delivery, headers=headers)
    
    print(f"\n📊 Réponse du serveur:")
    print(f"Status: {delivery_response.status_code}")
    
    if delivery_response.status_code == 200:
        result = delivery_response.json()
        print("✅ Livraison minimale créée avec succès!")
        print(f"ID: {result.get('delivery', {}).get('id')}")
    else:
        print("❌ Erreur lors de la création minimale:")
        try:
            error_detail = delivery_response.json()
            print(json.dumps(error_detail, indent=2, ensure_ascii=False))
        except:
            print(delivery_response.text)

if __name__ == "__main__":
    print("🚀 Test de création de livraison")
    print("=" * 50)
    
    # Test avec livraison complète
    test_delivery_creation()
    
    # Test avec livraison minimale
    test_minimal_delivery()
    
    print("\n" + "=" * 50)
    print("✅ Tests terminés") 