#!/usr/bin/env python3
"""
Test de configuration Google Places API
"""
import os
import sys

# Importer la configuration
try:
    from config_google_places import setup_google_places_api
    setup_google_places_api()
except ImportError:
    print("❌ Fichier config_google_places.py non trouvé")
    sys.exit(1)

# Tester la clé API
api_key = os.getenv("GOOGLE_PLACES_API_KEY")
if not api_key or api_key == "VOTRE_CLE_API_ICI":
    print("❌ Clé API non configurée ou invalide")
    print("💡 Modifiez config_google_places.py avec votre vraie clé API")
    sys.exit(1)

print(f"✅ Clé API configurée: {api_key[:10]}...{api_key[-10:]}")

# Lancer le diagnostic
print("\n🔍 Lancement du diagnostic Google Places...")
from test_google_places_diagnostic import test_google_places_api
test_google_places_api() 