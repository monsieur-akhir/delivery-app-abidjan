from fastapi import APIRouter, Depends, HTTPException, status, Body, Path, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from ..db.session import get_db
from ..core.dependencies import get_current_user, get_current_active_user, get_current_manager
from ..services.assistant import (
    send_message_to_rasa, get_rasa_intents, train_rasa_model,
    moderate_message, translate_message
)
from ..models.user import User, UserRole

router = APIRouter(tags=["assistant"])

@router.post("/chat")
async def chat_with_assistant(
    message: str = Body(..., embed=True),
    language: Optional[str] = Body("fr", embed=True),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Envoie un message au chatbot et retourne les réponses.
    """
    # Vérifier si le message est approprié
    moderation_result = await moderate_message(message, language)
    if moderation_result["is_inappropriate"] and moderation_result["confidence"] > 0.7:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le message contient du contenu inapproprié"
        )
    
    # Envoyer le message au chatbot
    sender_id = f"user_{current_user.id}"
    responses = await send_message_to_rasa(message, sender_id, language)
    
    return responses

@router.get("/intents")
async def get_assistant_intents(
    current_user: User = Depends(get_current_manager)
) -> List[Dict[str, Any]]:
    """
    Récupère la liste des intents disponibles dans le chatbot.
    Réservé aux gestionnaires.
    """
    return await get_rasa_intents()

@router.post("/train")
async def train_assistant_model(
    training_data: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_manager)
) -> Dict[str, Any]:
    """
    Entraîne un nouveau modèle pour le chatbot.
    Réservé aux gestionnaires.
    """
    return await train_rasa_model(training_data)

@router.post("/moderate")
async def moderate_user_message(
    message: str = Body(..., embed=True),
    language: Optional[str] = Body("fr", embed=True),
    current_user: User = Depends(get_current_manager)
) -> Dict[str, Any]:
    """
    Modère un message pour détecter le contenu inapproprié.
    Réservé aux gestionnaires.
    """
    return await moderate_message(message, language)

@router.post("/translate")
async def translate_user_message(
    message: str = Body(..., embed=True),
    source_language: str = Body(..., embed=True),
    target_language: str = Body(..., embed=True),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, str]:
    """
    Traduit un message d'une langue à une autre.
    """
    translated_text = await translate_message(message, source_language, target_language)
    
    return {
        "original_text": message,
        "translated_text": translated_text,
        "source_language": source_language,
        "target_language": target_language
    }

@router.get("/supported-languages")
async def get_supported_languages() -> List[Dict[str, str]]:
    """
    Récupère la liste des langues supportées par le chatbot.
    """
    return [
        {"code": "fr", "name": "Français"},
        {"code": "dioula", "name": "Dioula"},
        {"code": "baoulé", "name": "Baoulé"}
    ]
