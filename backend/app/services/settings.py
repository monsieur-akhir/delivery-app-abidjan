
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
import json
import yaml
import os
from datetime import datetime
from fastapi import HTTPException, status, UploadFile
from fastapi.responses import Response

from ..models.user import User
from ..core.config import settings as app_settings

class SettingsService:
    
    DEFAULT_SETTINGS = {
        # Paramètres généraux
        "platform_name": "CourseCI",
        "platform_description": "Plateforme de livraison moderne pour Abidjan",
        "support_email": "support@courseci.com",
        "support_phone": "+225 01 02 03 04 05",
        "enable_real_time_tracking": True,
        "enable_sms_notifications": True,
        "enable_auto_assignment": True,
        "enable_express_delivery": True,
        
        # Paramètres de livraison
        "base_price_per_km": 250.0,
        "minimum_price": 1000.0,
        "express_surcharge": 500.0,
        "platform_commission": 15.0,
        "max_assignment_radius": 10.0,
        "assignment_timeout": 5,
        "delivery_timeout": 24,
        
        # Paramètres de paiement
        "enable_cash_payment": True,
        "enable_mobile_money": True,
        "enable_card_payment": True,
        "enable_wallet_payment": True,
        "stripe_public_key": "",
        "stripe_secret_key": "",
        "orange_money_api_key": "",
        "mtn_momo_api_key": "",
        
        # Paramètres de notification
        "smtp_host": "smtp.gmail.com",
        "smtp_port": 587,
        "smtp_username": "",
        "smtp_password": "",
        "smtp_use_tls": True,
        "sms_provider": "orange",
        "sms_api_key": "",
        "sms_api_secret": "",
        "sms_sender_id": "CourseCI",
        
        # Paramètres de sécurité
        "require_phone_verification": True,
        "require_email_verification": False,
        "enable_two_factor_auth": False,
        "session_timeout": 120,
        "require_courier_kyc": True,
        "require_business_kyc": True,
        "max_login_attempts": 5,
        "lockout_duration": 30,
        
        # Paramètres avancés
        "google_maps_api_key": "",
        "firebase_api_key": "",
        "redis_url": "redis://localhost:6379",
        "backup_frequency": "daily",
        "enable_maintenance_mode": False,
        "maintenance_message": "Maintenance en cours, veuillez réessayer plus tard.",
        "log_level": "info",
        "max_log_size": 100
    }
    
    @classmethod
    def get_all_settings(cls, db: Session) -> Dict[str, Any]:
        """Récupérer tous les paramètres"""
        # En réalité, on devrait lire depuis la base de données
        # Pour la démo, on utilise les paramètres par défaut
        return cls.DEFAULT_SETTINGS.copy()
    
    @classmethod
    def update_settings(cls, db: Session, settings: Dict[str, Any], user_id: int) -> Dict[str, Any]:
        """Mettre à jour les paramètres"""
        # Valider les paramètres
        validation_result = cls.validate_settings(settings)
        if not validation_result["valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Paramètres invalides: {', '.join(validation_result['errors'])}"
            )
        
        # Sauvegarder l'historique
        cls._save_settings_history(db, settings, user_id, "update")
        
        # En réalité, on sauvegarderait en base
        return {"message": "Paramètres mis à jour avec succès"}
    
    @classmethod
    def reset_to_defaults(cls, db: Session, user_id: int) -> Dict[str, Any]:
        """Réinitialiser aux paramètres par défaut"""
        cls._save_settings_history(db, cls.DEFAULT_SETTINGS, user_id, "reset")
        return {"message": "Paramètres réinitialisés aux valeurs par défaut"}
    
    @classmethod
    def validate_settings(cls, settings: Dict[str, Any]) -> Dict[str, Any]:
        """Valider les paramètres"""
        errors = []
        warnings = []
        
        # Validation des types et valeurs
        if "base_price_per_km" in settings:
            try:
                price = float(settings["base_price_per_km"])
                if price <= 0:
                    errors.append("Le prix de base par km doit être positif")
            except (ValueError, TypeError):
                errors.append("Le prix de base par km doit être un nombre")
        
        if "platform_commission" in settings:
            try:
                commission = float(settings["platform_commission"])
                if commission < 0 or commission > 50:
                    errors.append("La commission doit être entre 0 et 50%")
            except (ValueError, TypeError):
                errors.append("La commission doit être un nombre")
        
        if "support_email" in settings:
            email = settings["support_email"]
            if email and "@" not in email:
                errors.append("L'email de support n'est pas valide")
        
        # Validation des clés API
        if settings.get("enable_sms_notifications") and not settings.get("sms_api_key"):
            warnings.append("Les notifications SMS sont activées mais aucune clé API n'est configurée")
        
        if settings.get("enable_card_payment") and not settings.get("stripe_secret_key"):
            warnings.append("Les paiements par carte sont activés mais Stripe n'est pas configuré")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
    
    @classmethod
    def get_settings_history(cls, db: Session) -> List[Dict[str, Any]]:
        """Récupérer l'historique des modifications"""
        # Simulation d'historique
        return [
            {
                "id": 1,
                "action": "Paramètres mis à jour",
                "user": {
                    "id": 1,
                    "full_name": "Admin System",
                    "profile_picture": None
                },
                "changed_fields": ["base_price_per_km", "platform_commission"],
                "created_at": "2024-01-15T10:30:00Z"
            },
            {
                "id": 2,
                "action": "Paramètres réinitialisés",
                "user": {
                    "id": 1,
                    "full_name": "Admin System",
                    "profile_picture": None
                },
                "changed_fields": ["all"],
                "created_at": "2024-01-10T14:20:00Z"
            }
        ]
    
    @classmethod
    def export_settings(cls, db: Session, format: str = "json") -> Response:
        """Exporter la configuration"""
        settings = cls.get_all_settings(db)
        
        if format.lower() == "yaml":
            content = yaml.dump(settings, default_flow_style=False)
            media_type = "application/x-yaml"
            filename = f"settings_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.yaml"
        else:
            content = json.dumps(settings, indent=2, ensure_ascii=False)
            media_type = "application/json"
            filename = f"settings_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        return Response(
            content=content,
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    @classmethod
    def import_settings(cls, db: Session, file: UploadFile, user_id: int) -> Dict[str, Any]:
        """Importer la configuration"""
        try:
            content = file.file.read()
            
            if file.filename.endswith('.yaml') or file.filename.endswith('.yml'):
                settings = yaml.safe_load(content)
            else:
                settings = json.loads(content)
            
            # Valider les paramètres importés
            validation_result = cls.validate_settings(settings)
            if not validation_result["valid"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Fichier de configuration invalide: {', '.join(validation_result['errors'])}"
                )
            
            # Sauvegarder
            cls._save_settings_history(db, settings, user_id, "import")
            
            return {
                "message": "Configuration importée avec succès",
                "warnings": validation_result.get("warnings", [])
            }
            
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Fichier JSON invalide"
            )
        except yaml.YAMLError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Fichier YAML invalide"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Erreur lors de l'importation: {str(e)}"
            )
    
    @classmethod
    def test_external_connections(cls, db: Session) -> Dict[str, Any]:
        """Tester la connectivité des services externes"""
        results = {}
        
        # Test de connexion à la base de données
        try:
            db.execute("SELECT 1")
            results["database"] = {"status": "ok", "message": "Connexion réussie"}
        except Exception as e:
            results["database"] = {"status": "error", "message": str(e)}
        
        # Test Redis (simulation)
        results["redis"] = {"status": "ok", "message": "Connexion réussie"}
        
        # Test SMTP (simulation)
        results["smtp"] = {"status": "warning", "message": "Configuration manquante"}
        
        # Test SMS API (simulation)
        results["sms"] = {"status": "warning", "message": "Clé API manquante"}
        
        # Test Google Maps API (simulation)
        results["google_maps"] = {"status": "warning", "message": "Clé API manquante"}
        
        return results
    
    @classmethod
    def _save_settings_history(cls, db: Session, settings: Dict[str, Any], user_id: int, action: str):
        """Sauvegarder l'historique des modifications"""
        # En réalité, on sauvegarderait en base de données
        pass
