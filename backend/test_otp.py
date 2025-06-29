import requests
import json
import random

def test_register():
    # Générer des données uniques
    random_num = random.randint(1000, 9999)
    url = "http://localhost:8000/api/auth/register-with-otp"
    data = {
        "full_name": f"Test User {random_num}",
        "phone": f"0701{random_num:04d}",
        "email": f"test{random_num}@example.com",
        "password": "password123",
        "role": "client"
    }
    
    print(f"Testing with phone: {data['phone']}")
    print(f"Testing with email: {data['email']}")
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            response_data = response.json()
            if "dev_otp_code" in response_data:
                print(f"\n🔑 CODE OTP POUR DEBUG: {response_data['dev_otp_code']}")
            if "dev_note" in response_data:
                print(f"📝 Note: {response_data['dev_note']}")
                
    except Exception as e:
        print(f"Erreur: {e}")

if __name__ == "__main__":
    test_register() 