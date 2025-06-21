import jwt
from datetime import datetime

# Token de votre log
token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIrMjI1MDcwNzEyMzQ1NiIsInJvbGUiOiJjbGllbnQiLCJleHAiOjE3NTA0NTc1ODl9._sypaTsuqQzYwQFIDw1viC1vtCWmeqCFBJkUNhRTpqE'

try:
    # Décoder le token sans vérifier la signature
    payload = jwt.decode(token, options={'verify_signature': False})
    
    print("=== ANALYSE DU TOKEN JWT ===")
    print(f"Payload complet: {payload}")
    print(f"Subject (phone): {payload.get('sub')}")
    print(f"Role: {payload.get('role')}")
    print(f"Expiration (timestamp): {payload.get('exp')}")
    
    # Convertir le timestamp en datetime
    exp_datetime = datetime.fromtimestamp(payload['exp'])
    now = datetime.now()
    
    print(f"Expiration (datetime): {exp_datetime}")
    print(f"Maintenant: {now}")
    print(f"Expiré: {now.timestamp() > payload['exp']}")
    
    # Vérifier si le token est expiré
    if now.timestamp() > payload['exp']:
        print("❌ TOKEN EXPIRÉ - C'est pourquoi vous avez une erreur 403!")
        print(f"Le token a expiré il y a {int(now.timestamp() - payload['exp'])} secondes")
    else:
        print("✅ TOKEN VALIDE")
        print(f"Le token expire dans {int(payload['exp'] - now.timestamp())} secondes")
        
except Exception as e:
    print(f"Erreur lors du décodage: {e}") 