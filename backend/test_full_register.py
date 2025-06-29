import requests
import json
import random

def test_full_register():
    # Générer des données uniques
    random_num = random.randint(1000, 9999)
    base_url = "http://localhost:8000/api/auth"
    
    # Données d'inscription
    register_data = {
        "full_name": f"Test User {random_num}",
        "phone": f"0701{random_num:04d}",
        "email": f"test{random_num}@example.com",
        "password": "password123",
        "role": "client"
    }
    
    print(f"🔵 Test avec téléphone: {register_data['phone']}")
    print(f"🔵 Test avec email: {register_data['email']}")
    
    try:
        # 1. Inscription
        print("\n📝 ÉTAPE 1: Inscription...")
        response = requests.post(f"{base_url}/register-with-otp", json=register_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            register_response = response.json()
            print(f"✅ Inscription réussie - User ID: {register_response.get('user_id')}")
            print(f"📱 OTP envoyé à: {register_response.get('otp_sent_to')}")
            
            # Récupérer le code OTP depuis les logs (en mode dev)
            otp_code = None
            if "dev_otp_code" in register_response:
                otp_code = register_response["dev_otp_code"]
                print(f"🔑 CODE OTP: {otp_code}")
            else:
                print("❌ Code OTP non trouvé dans la réponse")
                return
            
            # 2. Vérification OTP
            print("\n🔐 ÉTAPE 2: Vérification OTP...")
            verify_data = {
                "phone": register_data["phone"],
                "code": otp_code,
                "otp_type": "registration"
            }
            
            verify_response = requests.post(f"{base_url}/verify-otp", json=verify_data)
            print(f"Status Code: {response.status_code}")
            
            if verify_response.status_code == 200:
                verify_result = verify_response.json()
                print(f"✅ Vérification réussie: {verify_result.get('message')}")
                
                if "token" in verify_result:
                    token = verify_result["token"]
                    print(f"🎫 Token généré: {token[:50]}...")
                    
                    # 3. Test de connexion avec le token
                    print("\n🔗 ÉTAPE 3: Test de connexion avec le token...")
                    headers = {"Authorization": f"Bearer {token}"}
                    user_response = requests.get(f"{base_url}/user", headers=headers)
                    
                    if user_response.status_code == 200:
                        user_data = user_response.json()
                        print(f"✅ Connexion réussie - User: {user_data.get('full_name')}")
                        print(f"📱 Numéro en base: {user_data.get('phone')}")
                    else:
                        print(f"❌ Erreur connexion: {user_response.status_code}")
                        print(f"Response: {user_response.text}")
                else:
                    print("❌ Token non généré")
            else:
                print(f"❌ Erreur vérification: {verify_response.status_code}")
                print(f"Response: {verify_response.text}")
        else:
            print(f"❌ Erreur inscription: {response.status_code}")
            print(f"Response: {response.text}")
                
    except Exception as e:
        print(f"❌ Erreur: {e}")

if __name__ == "__main__":
    test_full_register() 