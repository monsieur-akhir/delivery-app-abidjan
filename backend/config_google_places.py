#!/usr/bin/env python3
"""
Configuration Google Places API
Remplacez VOTRE_CLE_API_ICI par votre vraie clé API
"""
import os

# Configuration de la clé Google Places API
GOOGLE_PLACES_API_KEY = "VOTRE_CLE_API_ICI"  # Remplacez par votre vraie clé

def setup_google_places_api():
    """Configure la clé API Google Places"""
    if GOOGLE_PLACES_API_KEY != "VOTRE_CLE_API_ICI":
        os.environ["GOOGLE_PLACES_API_KEY"] = GOOGLE_PLACES_API_KEY
        print("✅ Clé Google Places API configurée")
        return True
    else:
        print("❌ Veuillez remplacer VOTRE_CLE_API_ICI par votre vraie clé API")
        return False

if __name__ == "__main__":
    setup_google_places_api() 