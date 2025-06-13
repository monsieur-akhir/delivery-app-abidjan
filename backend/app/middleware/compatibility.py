
from fastapi import Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware
from typing import Callable
import json

class CompatibilityMiddleware(BaseHTTPMiddleware):
    """Middleware pour assurer la compatibilité entre les différentes versions d'API"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Ajouter des headers de compatibilité
        response = await call_next(request)
        
        # Ajouter des métadonnées de version
        response.headers["X-API-Version"] = "1.0"
        response.headers["X-Features-Enabled"] = "promotions,zones,gamification,collaborative"
        
        # Gérer la rétrocompatibilité des réponses
        if request.url.path.startswith("/api/v1/deliveries"):
            # Ajouter les nouveaux champs aux réponses existantes
            if response.headers.get("content-type") == "application/json":
                try:
                    content = response.body.decode()
                    data = json.loads(content)
                    
                    # Ajouter les champs de promotion si ils n'existent pas
                    if isinstance(data, dict) and "id" in data:
                        data.setdefault("total_discount", 0.0)
                        data.setdefault("cashback_earned", 0.0)
                        data.setdefault("applied_promotions", [])
                    
                    response._content = json.dumps(data).encode()
                except:
                    pass
        
        return response
