from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class EmailRequest(BaseModel):
    """Schéma pour l'envoi d'un email personnalisé."""
    to_email: EmailStr = Field(..., description="Adresse email du destinataire")
    subject: str = Field(..., description="Sujet de l'email", min_length=1, max_length=200)
    text_content: str = Field(..., description="Contenu texte de l'email", min_length=1)
    html_content: Optional[str] = Field(None, description="Contenu HTML de l'email")

class EmailResponse(BaseModel):
    """Schéma de réponse pour l'envoi d'email."""
    success: bool = Field(..., description="Indique si l'envoi a réussi")
    message: str = Field(..., description="Message de statut")
    to_email: str = Field(..., description="Adresse email du destinataire")
    subject: str = Field(..., description="Sujet de l'email")
    sent_at: Optional[datetime] = Field(None, description="Date et heure d'envoi")

class OTPEmailRequest(BaseModel):
    """Schéma pour l'envoi d'un email OTP."""
    email: EmailStr = Field(..., description="Adresse email du destinataire")
    code: str = Field(..., description="Code OTP à envoyer", min_length=4, max_length=10)
    otp_type: str = Field(..., description="Type d'OTP (registration, login, password_reset)")

class OTPEmailResponse(BaseModel):
    """Schéma de réponse pour l'envoi d'email OTP."""
    success: bool = Field(..., description="Indique si l'envoi a réussi")
    message: str = Field(..., description="Message de statut")
    email: str = Field(..., description="Adresse email du destinataire")
    otp_type: str = Field(..., description="Type d'OTP envoyé")
    sent_at: Optional[datetime] = Field(None, description="Date et heure d'envoi")

class BulkEmailRequest(BaseModel):
    """Schéma pour l'envoi d'emails en masse."""
    emails: List[EmailStr] = Field(..., description="Liste des adresses email", min_items=1, max_items=100)
    subject: str = Field(..., description="Sujet de l'email", min_length=1, max_length=200)
    text_content: str = Field(..., description="Contenu texte de l'email", min_length=1)
    html_content: Optional[str] = Field(None, description="Contenu HTML de l'email")

class BulkEmailResult(BaseModel):
    """Schéma pour le résultat d'un email individuel dans un envoi en masse."""
    email: str = Field(..., description="Adresse email")
    status: str = Field(..., description="Statut de l'envoi (success/failed)")
    error: Optional[str] = Field(None, description="Message d'erreur si échec")

class BulkEmailResponse(BaseModel):
    """Schéma de réponse pour l'envoi d'emails en masse."""
    success: bool = Field(..., description="Indique si l'opération a réussi")
    message: str = Field(..., description="Message de statut")
    total_sent: int = Field(..., description="Nombre total d'emails traités")
    success_count: int = Field(..., description="Nombre d'emails envoyés avec succès")
    failure_count: int = Field(..., description="Nombre d'emails en échec")
    results: List[BulkEmailResult] = Field(..., description="Résultats détaillés pour chaque email")

class EmailTemplateRequest(BaseModel):
    """Schéma pour l'envoi d'un email avec template."""
    to_email: EmailStr = Field(..., description="Adresse email du destinataire")
    template_name: str = Field(..., description="Nom du template à utiliser")
    variables: Dict[str, Any] = Field(default_factory=dict, description="Variables à injecter dans le template")

class EmailTemplateResponse(BaseModel):
    """Schéma de réponse pour l'envoi d'email avec template."""
    success: bool = Field(..., description="Indique si l'envoi a réussi")
    message: str = Field(..., description="Message de statut")
    to_email: str = Field(..., description="Adresse email du destinataire")
    template_name: str = Field(..., description="Nom du template utilisé")
    sent_at: Optional[datetime] = Field(None, description="Date et heure d'envoi")

class EmailServiceStatus(BaseModel):
    """Schéma pour le statut du service email."""
    brevo_enabled: bool = Field(..., description="Service Brevo activé")
    smtp_configured: bool = Field(..., description="Configuration SMTP disponible")
    email_enabled: bool = Field(..., description="Service email activé")
    from_email: str = Field(..., description="Adresse email expéditeur")
    from_name: str = Field(..., description="Nom de l'expéditeur") 