"""
Application FastAPI principale - Livraison Abidjan
Version simplifiée pour déploiement Replit
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import sys
from pathlib import Path

# Configuration de base
app = FastAPI(
    title="Livraison Abidjan API",
    description="API pour la plateforme de livraison collaborative",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # À restreindre en production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Point d'entrée racine"""
    return {
        "message": "Livraison Abidjan API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Vérification de santé de l'API"""
    return {
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "python_version": sys.version
    }

@app.get("/api/test")
async def test_endpoint():
    """Endpoint de test"""
    return {
        "message": "API fonctionne correctement",
        "timestamp": "2025-01-21",
        "status": "success"
    }

# Gestion des erreurs
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "message": "Erreur interne du serveur",
            "detail": str(exc) if os.getenv("DEBUG") == "true" else "Une erreur est survenue"
        }
    )

# Import conditionnel des routes (si disponibles)
try:
    # Tenter d'importer les routes complètes
    from app.api import auth, deliveries, users
    app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
    app.include_router(deliveries.router, prefix="/api/deliveries", tags=["deliveries"])
    app.include_router(users.router, prefix="/api/users", tags=["users"])
    print("✅ Routes complètes chargées")
except ImportError as e:
    print(f"⚠️ Routes complètes non disponibles: {e}")
    print("ℹ️ Fonctionnement en mode dégradé")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )