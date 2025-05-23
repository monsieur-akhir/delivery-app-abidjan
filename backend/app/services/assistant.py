from typing import Dict, Any, List, Optional
import requests
import json
from fastapi import HTTPException, status

from ..core.config import settings

async def send_message_to_rasa(
    message: str, 
    sender_id: str, 
    language: str = "fr"
) -> List[Dict[str, Any]]:
    """
    Envoie un message au chatbot Rasa et retourne les réponses.
    """
    url = f"{settings.RASA_URL}/webhooks/rest/webhook"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "sender": sender_id,
        "message": message,
        "metadata": {
            "language": language
        }
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Erreur Rasa: {response.text}")
            return [{"text": "Désolé, je rencontre des difficultés techniques. Veuillez réessayer plus tard."}]
    except Exception as e:
        print(f"Exception lors de l'appel à Rasa: {str(e)}")
        return [{"text": "Désolé, je rencontre des difficultés techniques. Veuillez réessayer plus tard."}]

async def get_rasa_intents() -> List[Dict[str, Any]]:
    """
    Récupère la liste des intents disponibles dans Rasa.
    """
    url = f"{settings.RASA_URL}/domain"
    
    try:
        response = requests.get(url)
        
        if response.status_code == 200:
            domain = response.json()
            return [{"name": intent, "examples": []} for intent in domain.get("intents", [])]
        else:
            print(f"Erreur lors de la récupération des intents: {response.text}")
            return []
    except Exception as e:
        print(f"Exception lors de la récupération des intents: {str(e)}")
        return []

async def train_rasa_model(training_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Entraîne un nouveau modèle Rasa avec les données fournies.
    Réservé aux gestionnaires.
    """
    url = f"{settings.RASA_URL}/model/train"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=training_data, headers=headers)
        
        if response.status_code == 200:
            return {"status": "success", "message": "Modèle entraîné avec succès"}
        else:
            print(f"Erreur lors de l'entraînement du modèle: {response.text}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erreur lors de l'entraînement du modèle"
            )
    except Exception as e:
        print(f"Exception lors de l'entraînement du modèle: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Exception lors de l'entraînement du modèle: {str(e)}"
        )

async def moderate_message(message: str, language: str = "fr") -> Dict[str, Any]:
    """
    Modère un message pour détecter le contenu inapproprié.
    """
    url = f"{settings.RASA_URL}/model/parse"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "text": message,
        "message_id": "moderation_check"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            
            # Vérifier si l'intent est lié à du contenu inapproprié
            inappropriate_intents = ["insult", "threat", "hate_speech", "scam"]
            detected_intent = result.get("intent", {}).get("name", "")
            
            is_inappropriate = detected_intent in inappropriate_intents
            confidence = result.get("intent", {}).get("confidence", 0)
            
            return {
                "is_inappropriate": is_inappropriate,
                "confidence": confidence,
                "detected_intent": detected_intent,
                "original_message": message
            }
        else:
            print(f"Erreur lors de la modération: {response.text}")
            return {
                "is_inappropriate": False,
                "confidence": 0,
                "detected_intent": "unknown",
                "original_message": message
            }
    except Exception as e:
        print(f"Exception lors de la modération: {str(e)}")
        return {
            "is_inappropriate": False,
            "confidence": 0,
            "detected_intent": "error",
            "original_message": message
        }

async def translate_message(message: str, source_language: str, target_language: str) -> str:
    """
    Traduit un message d'une langue à une autre.
    """
    url = f"{settings.RASA_URL}/translate"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "text": message,
        "source_language": source_language,
        "target_language": target_language
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            return result.get("translated_text", message)
        else:
            print(f"Erreur lors de la traduction: {response.text}")
            return message
    except Exception as e:
        print(f"Exception lors de la traduction: {str(e)}")
        return message
