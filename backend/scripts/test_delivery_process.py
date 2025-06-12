#!/usr/bin/env python3
"""
Test complet du processus de livraison
Teste le flow complet : création → enchères → acceptation → suivi → livraison
"""

import asyncio
import json
import requests
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
WEBSOCKET_URL = "ws://localhost:8001"

class DeliveryProcessTest:
    def __init__(self):
        self.base_url = BASE_URL
        self.admin_token = None
        self.client_token = None
        self.courier_token = None
        self.client_id = None
        self.courier_id = None
        self.delivery_id = None
        self.bid_id = None
        
    def get_admin_token(self):
        """Récupérer le token admin"""
        print("🔐 Connexion administrateur...")
        
        response = requests.post(f"{self.base_url}/api/auth/login", json={
            "phone": "+2250700000000",
            "password": "admin123"
        })
        
        if response.status_code == 200:
            data = response.json()
            self.admin_token = data["access_token"]
            print("✅ Connexion administrateur réussie")
            return True
        else:
            print(f"❌ Erreur connexion admin: {response.status_code} - {response.text}")
            return False
    
    def create_test_users(self):
        """Créer des utilisateurs de test"""
        print("\n👥 Création des utilisateurs de test...")
        
        if not self.admin_token:
            return False
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Créer un client
        client_data = {
            "phone": "+2250707123456",
            "email": "client.test@yopmail.com",
            "password": "client123",
            "full_name": "Client Test",
            "role": "client"
        }
        
        response = requests.post(f"{self.base_url}/api/users", json=client_data, headers=headers)
        if response.status_code == 201:
            client = response.json()
            self.client_id = client["id"]
            print(f"✅ Client créé: ID {self.client_id}")
        else:
            print(f"⚠️ Client existe déjà ou erreur: {response.status_code}")
        
        # Créer un coursier
        courier_data = {
            "phone": "+2250708123456",
            "email": "courier.test@yopmail.com", 
            "password": "courier123",
            "full_name": "Coursier Test",
            "role": "courier",
            "vehicle_type": "scooter",
            "is_available": True
        }
        
        response = requests.post(f"{self.base_url}/api/users", json=courier_data, headers=headers)
        if response.status_code == 201:
            courier = response.json()
            self.courier_id = courier["id"]
            print(f"✅ Coursier créé: ID {self.courier_id}")
        else:
            print(f"⚠️ Coursier existe déjà ou erreur: {response.status_code}")
        
        return True
    
    def login_test_users(self):
        """Connecter les utilisateurs de test"""
        print("\n🔑 Connexion des utilisateurs de test...")
        
        # Connexion client
        response = requests.post(f"{self.base_url}/api/auth/login", json={
            "phone": "+2250707123456",
            "password": "client123"
        })
        
        if response.status_code == 200:
            data = response.json()
            self.client_token = data["access_token"]
            print("✅ Client connecté")
        else:
            print(f"❌ Erreur connexion client: {response.status_code}")
            return False
        
        # Connexion coursier
        response = requests.post(f"{self.base_url}/api/auth/login", json={
            "phone": "+2250708123456", 
            "password": "courier123"
        })
        
        if response.status_code == 200:
            data = response.json()
            self.courier_token = data["access_token"]
            print("✅ Coursier connecté")
        else:
            print(f"❌ Erreur connexion coursier: {response.status_code}")
            return False
        
        return True
    
    def create_delivery(self):
        """Créer une livraison"""
        print("\n📦 Création d'une livraison...")
        
        if not self.client_token:
            return False
            
        headers = {"Authorization": f"Bearer {self.client_token}"}
        
        delivery_data = {
            "pickup_address": "Rue de la République, Plateau",
            "pickup_commune": "Plateau",
            "pickup_lat": 5.3199517,
            "pickup_lng": -4.0282563,
            "delivery_address": "Boulevard Lagunaire, Cocody",
            "delivery_commune": "Cocody", 
            "delivery_lat": 5.3599517,
            "delivery_lng": -3.9882563,
            "delivery_contact_phone": "+2250709123456",
            "description": "Test de livraison automatique",
            "package_size": "medium",
            "package_type": "electronics",
            "is_fragile": True,
            "is_urgent": False,
            "proposed_price": 2500,
            "notes": "Livraison de test - système automatique",
            "estimated_distance": 12.5,
            "estimated_duration": 35
        }
        
        response = requests.post(f"{self.base_url}/api/deliveries", json=delivery_data, headers=headers)
        
        if response.status_code == 201:
            delivery = response.json()
            self.delivery_id = delivery["id"]
            print(f"✅ Livraison créée: ID {self.delivery_id}")
            print(f"   Status: {delivery['status']}")
            print(f"   Prix: {delivery['proposed_price']} FCFA")
            return True
        else:
            print(f"❌ Erreur création livraison: {response.status_code} - {response.text}")
            return False
    
    def create_bid(self):
        """Créer une enchère"""
        print("\n💰 Création d'une enchère...")
        
        if not self.courier_token or not self.delivery_id:
            return False
            
        headers = {"Authorization": f"Bearer {self.courier_token}"}
        
        bid_data = {
            "amount": 2200,
            "note": "Coursier expérimenté, livraison rapide garantie"
        }
        
        response = requests.post(
            f"{self.base_url}/api/deliveries/{self.delivery_id}/bids", 
            json=bid_data, 
            headers=headers
        )
        
        if response.status_code == 201:
            bid = response.json()
            self.bid_id = bid["id"]
            print(f"✅ Enchère créée: ID {self.bid_id}")
            print(f"   Montant: {bid['amount']} FCFA")
            return True
        else:
            print(f"❌ Erreur création enchère: {response.status_code} - {response.text}")
            return False
    
    def get_bids(self):
        """Récupérer les enchères pour la livraison"""
        print("\n📋 Récupération des enchères...")
        
        if not self.client_token or not self.delivery_id:
            return False
            
        headers = {"Authorization": f"Bearer {self.client_token}"}
        
        response = requests.get(
            f"{self.base_url}/api/deliveries/{self.delivery_id}/bids",
            headers=headers
        )
        
        if response.status_code == 200:
            bids = response.json()
            print(f"✅ {len(bids)} enchère(s) trouvée(s)")
            for bid in bids:
                print(f"   Enchère {bid['id']}: {bid['amount']} FCFA - {bid.get('note', 'Pas de note')}")
            return True
        else:
            print(f"❌ Erreur récupération enchères: {response.status_code}")
            return False
    
    def accept_bid(self):
        """Accepter l'enchère"""
        print("\n✅ Acceptation de l'enchère...")
        
        if not self.client_token or not self.delivery_id or not self.bid_id:
            return False
            
        headers = {"Authorization": f"Bearer {self.client_token}"}
        
        response = requests.post(
            f"{self.base_url}/api/deliveries/{self.delivery_id}/bids/{self.bid_id}/accept",
            headers=headers
        )
        
        if response.status_code == 200:
            delivery = response.json()
            print(f"✅ Enchère acceptée")
            print(f"   Status: {delivery['status']}")
            print(f"   Prix final: {delivery.get('final_price', 'N/A')} FCFA")
            print(f"   Coursier assigné: {delivery.get('courier_id', 'N/A')}")
            return True
        else:
            print(f"❌ Erreur acceptation enchère: {response.status_code} - {response.text}")
            return False
    
    def update_delivery_status(self, status):
        """Mettre à jour le statut de la livraison"""
        print(f"\n🔄 Mise à jour du statut vers: {status}")
        
        token = self.courier_token if status in ["in_progress", "delivered"] else self.client_token
        if not token or not self.delivery_id:
            return False
            
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.put(
            f"{self.base_url}/api/deliveries/{self.delivery_id}/status",
            json={"status": status},
            headers=headers
        )
        
        if response.status_code == 200:
            delivery = response.json()
            print(f"✅ Statut mis à jour vers: {delivery['status']}")
            return True
        else:
            print(f"❌ Erreur mise à jour statut: {response.status_code} - {response.text}")
            return False
    
    def add_tracking_point(self):
        """Ajouter un point de tracking"""
        print("\n📍 Ajout d'un point de tracking...")
        
        if not self.courier_token or not self.delivery_id:
            return False
            
        headers = {"Authorization": f"Bearer {self.courier_token}"}
        
        tracking_data = {
            "lat": 5.3399517,
            "lng": -4.0082563
        }
        
        response = requests.post(
            f"{self.base_url}/api/deliveries/{self.delivery_id}/tracking",
            json=tracking_data,
            headers=headers
        )
        
        if response.status_code == 201:
            tracking = response.json()
            print(f"✅ Point de tracking ajouté: {tracking['lat']}, {tracking['lng']}")
            return True
        else:
            print(f"❌ Erreur ajout tracking: {response.status_code} - {response.text}")
            return False
    
    def get_delivery_details(self):
        """Récupérer les détails de la livraison"""
        print("\n📊 Récupération des détails de livraison...")
        
        if not self.client_token or not self.delivery_id:
            return False
            
        headers = {"Authorization": f"Bearer {self.client_token}"}
        
        response = requests.get(
            f"{self.base_url}/api/deliveries/{self.delivery_id}",
            headers=headers
        )
        
        if response.status_code == 200:
            delivery = response.json()
            print(f"✅ Détails récupérés:")
            print(f"   ID: {delivery['id']}")
            print(f"   Status: {delivery['status']}")
            print(f"   Prix proposé: {delivery['proposed_price']} FCFA")
            print(f"   Prix final: {delivery.get('final_price', 'N/A')} FCFA")
            print(f"   Client: {delivery['client_id']}")
            print(f"   Coursier: {delivery.get('courier_id', 'N/A')}")
            print(f"   Créé le: {delivery['created_at']}")
            return True
        else:
            print(f"❌ Erreur récupération détails: {response.status_code}")
            return False
    
    def run_complete_test(self):
        """Exécuter le test complet"""
        print("🚀 DÉBUT DU TEST COMPLET DU PROCESSUS DE LIVRAISON")
        print("=" * 60)
        
        # Étape 1: Authentification admin
        if not self.get_admin_token():
            print("❌ Test arrêté - Erreur authentification admin")
            return False
        
        # Étape 2: Création des utilisateurs de test
        if not self.create_test_users():
            print("❌ Test arrêté - Erreur création utilisateurs")
            return False
        
        # Étape 3: Connexion des utilisateurs
        if not self.login_test_users():
            print("❌ Test arrêté - Erreur connexion utilisateurs")
            return False
        
        # Étape 4: Création de la livraison
        if not self.create_delivery():
            print("❌ Test arrêté - Erreur création livraison")
            return False
        
        # Étape 5: Création d'une enchère
        if not self.create_bid():
            print("❌ Test arrêté - Erreur création enchère")
            return False
        
        # Étape 6: Récupération des enchères
        if not self.get_bids():
            print("❌ Test arrêté - Erreur récupération enchères")
            return False
        
        # Étape 7: Acceptation de l'enchère
        if not self.accept_bid():
            print("❌ Test arrêté - Erreur acceptation enchère")
            return False
        
        # Étape 8: Mise à jour du statut vers "in_progress"
        if not self.update_delivery_status("in_progress"):
            print("❌ Test arrêté - Erreur mise à jour statut")
            return False
        
        # Étape 9: Ajout d'un point de tracking
        if not self.add_tracking_point():
            print("❌ Test arrêté - Erreur ajout tracking")
            return False
        
        # Étape 10: Mise à jour du statut vers "delivered"
        if not self.update_delivery_status("delivered"):
            print("❌ Test arrêté - Erreur statut delivered")
            return False
        
        # Étape 11: Confirmation par le client
        if not self.update_delivery_status("completed"):
            print("❌ Test arrêté - Erreur statut completed")
            return False
        
        # Étape 12: Récupération finale des détails
        if not self.get_delivery_details():
            print("❌ Test arrêté - Erreur récupération finale")
            return False
        
        print("\n" + "=" * 60)
        print("🎉 TEST COMPLET RÉUSSI - PROCESSUS DE LIVRAISON FONCTIONNEL")
        print("=" * 60)
        return True


if __name__ == "__main__":
    test = DeliveryProcessTest()
    success = test.run_complete_test()
    
    if success:
        print("\n✅ Tous les tests sont passés avec succès!")
    else:
        print("\n❌ Certains tests ont échoué - vérifiez les logs ci-dessus")
        exit(1)
