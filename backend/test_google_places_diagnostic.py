#!/usr/bin/env python3
"""
Diagnostic de l'API Google Places
"""
import os
import requests
import json

def test_google_places_api():
    print("🔍 Diagnostic de l'API Google Places")
    print("=" * 50)
    
    # 1. Vérifier la clé API
    api_key = os.getenv("GOOGLE_PLACES_API_KEY")
    print(f"1️⃣ Clé API Google Places:")
    if api_key:
        print(f"   ✅ Clé présente: {api_key[:10]}...{api_key[-10:]}")
    else:
        print("   ❌ Clé API manquante (variable d'environnement GOOGLE_PLACES_API_KEY)")
        return
    
    # 2. Test simple avec l'API Google Places
    print(f"\n2️⃣ Test direct de l'API Google Places:")
    print("-" * 40)
    
    url = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
    params = {
        "input": "abidjan",
        "key": api_key,
        "language": "fr",
        "components": "country:ci",
        "types": "geocode"
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            status = data.get("status")
            print(f"   Status API: {status}")
            
            if status == "OK":
                predictions = data.get("predictions", [])
                print(f"   ✅ Succès! {len(predictions)} prédictions trouvées")
                for i, pred in enumerate(predictions[:3]):
                    print(f"      {i+1}. {pred.get('description', 'N/A')}")
            elif status == "ZERO_RESULTS":
                print("   ⚠️  ZERO_RESULTS - Aucun résultat trouvé")
                print("   💡 Possible: requête trop spécifique ou restrictions géographiques")
            elif status == "REQUEST_DENIED":
                print("   ❌ REQUEST_DENIED - Clé API invalide ou restrictions")
            elif status == "OVER_QUERY_LIMIT":
                print("   ❌ OVER_QUERY_LIMIT - Quota dépassé")
            else:
                print(f"   ❌ Erreur: {status}")
                print(f"   Détails: {data}")
        else:
            print(f"   ❌ Erreur HTTP: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Erreur de connexion: {e}")
    
    # 3. Test avec des requêtes différentes
    print(f"\n3️⃣ Test avec différentes requêtes:")
    print("-" * 40)
    
    test_queries = ["cocody", "yopougon", "plateau", "a", "ab", "abc"]
    
    for query in test_queries:
        params["input"] = query
        try:
            response = requests.get(url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                status = data.get("status")
                predictions_count = len(data.get("predictions", []))
                print(f"   '{query}': {status} ({predictions_count} résultats)")
            else:
                print(f"   '{query}': Erreur HTTP {response.status_code}")
        except Exception as e:
            print(f"   '{query}': Erreur {e}")
    
    # 4. Recommandations
    print(f"\n4️⃣ Recommandations:")
    print("-" * 40)
    
    if not api_key:
        print("   🔑 Obtenir une clé API Google Places:")
        print("      1. Aller sur Google Cloud Console")
        print("      2. Activer Places API")
        print("      3. Créer une clé API")
        print("      4. Définir GOOGLE_PLACES_API_KEY dans l'environnement")
    else:
        print("   ✅ Clé API configurée")
        print("   💡 Si ZERO_RESULTS persiste:")
        print("      - Vérifier les restrictions de la clé API")
        print("      - Tester avec des requêtes plus génériques")
        print("      - Vérifier le quota d'utilisation")

if __name__ == "__main__":
    test_google_places_api() 