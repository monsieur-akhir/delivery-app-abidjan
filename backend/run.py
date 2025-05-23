import uvicorn
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

if __name__ == "__main__":
    # Récupérer le port depuis les variables d'environnement ou utiliser 8000 par défaut
    port = int(os.getenv("PORT", 8000))
    
    # Démarrer le serveur
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("ENVIRONMENT", "development") == "development"
    )
