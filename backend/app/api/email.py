from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
import logging

from ..db.session import get_db
from ..services.email_service import EmailService
from ..schemas.email import (
    EmailRequest, 
    EmailResponse, 
    OTPEmailRequest, 
    OTPEmailResponse,
    BulkEmailRequest,
    BulkEmailResponse,
    EmailTemplateRequest,
    EmailTemplateResponse
)
from ..core.security import get_current_user
from ..models.user import User
from ..core.exceptions import BadRequestError

router = APIRouter(prefix="/email", tags=["email"])
logger = logging.getLogger(__name__)

@router.post("/send", response_model=EmailResponse)
async def send_email(
    email_request: EmailRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> EmailResponse:
    """
    Envoyer un email personnalisé.
    """
    try:
        email_service = EmailService()
        
        # Vérifier que l'utilisateur a les permissions (admin ou manager)
        if current_user.role not in ["admin", "manager"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permissions insuffisantes pour envoyer des emails"
            )
        
        # Envoyer l'email
        success = email_service.send_email(
            to_email=email_request.to_email,
            subject=email_request.subject,
            text_content=email_request.text_content,
            html_content=email_request.html_content
        )
        
        if success:
            logger.info(f"✅ Email envoyé avec succès à {email_request.to_email} par {current_user.full_name}")
            return EmailResponse(
                success=True,
                message="Email envoyé avec succès",
                to_email=email_request.to_email,
                subject=email_request.subject
            )
        else:
            logger.error(f"❌ Échec envoi email à {email_request.to_email}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Échec de l'envoi de l'email"
            )
            
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'envoi d'email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'envoi de l'email: {str(e)}"
        )

@router.post("/send-otp", response_model=OTPEmailResponse)
async def send_otp_email(
    otp_request: OTPEmailRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> OTPEmailResponse:
    """
    Envoyer un email OTP avec template professionnel.
    """
    try:
        email_service = EmailService()
        
        # Vérifier que l'utilisateur a les permissions
        if current_user.role not in ["admin", "manager"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permissions insuffisantes pour envoyer des emails OTP"
            )
        
        # Envoyer l'email OTP
        success = email_service.send_otp_email(
            email=otp_request.email,
            code=otp_request.code,
            otp_type=otp_request.otp_type
        )
        
        if success:
            logger.info(f"✅ Email OTP envoyé avec succès à {otp_request.email}")
            return OTPEmailResponse(
                success=True,
                message="Email OTP envoyé avec succès",
                email=otp_request.email,
                otp_type=otp_request.otp_type
            )
        else:
            logger.error(f"❌ Échec envoi email OTP à {otp_request.email}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Échec de l'envoi de l'email OTP"
            )
            
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'envoi d'email OTP: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'envoi de l'email OTP: {str(e)}"
        )

@router.post("/send-bulk", response_model=BulkEmailResponse)
async def send_bulk_emails(
    bulk_request: BulkEmailRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> BulkEmailResponse:
    """
    Envoyer des emails en masse à plusieurs destinataires.
    """
    try:
        # Vérifier que l'utilisateur a les permissions
        if current_user.role not in ["admin", "manager"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permissions insuffisantes pour envoyer des emails en masse"
            )
        
        email_service = EmailService()
        results = []
        success_count = 0
        failure_count = 0
        
        for email in bulk_request.emails:
            try:
                success = email_service.send_email(
                    to_email=email,
                    subject=bulk_request.subject,
                    text_content=bulk_request.text_content,
                    html_content=bulk_request.html_content
                )
                
                if success:
                    success_count += 1
                    results.append({"email": email, "status": "success"})
                else:
                    failure_count += 1
                    results.append({"email": email, "status": "failed"})
                    
            except Exception as e:
                failure_count += 1
                results.append({"email": email, "status": "failed", "error": str(e)})
        
        logger.info(f"📧 Bulk email terminé: {success_count} succès, {failure_count} échecs")
        
        return BulkEmailResponse(
            success=True,
            message=f"Envoi en masse terminé: {success_count} succès, {failure_count} échecs",
            total_sent=len(bulk_request.emails),
            success_count=success_count,
            failure_count=failure_count,
            results=results
        )
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'envoi en masse: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'envoi en masse: {str(e)}"
        )

@router.post("/send-template", response_model=EmailResponse)
async def send_template_email(
    template_request: EmailTemplateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> EmailResponse:
    """
    Envoyer un email en utilisant un template prédéfini.
    """
    try:
        email_service = EmailService()
        
        # Vérifier que l'utilisateur a les permissions
        if current_user.role not in ["admin", "manager"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permissions insuffisantes pour envoyer des emails template"
            )
        
        # Templates disponibles
        templates = {
            "welcome": {
                "subject": "🎉 Bienvenue sur Livraison Abidjan !",
                "html_template": f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f7fa; }}
                        .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }}
                        .content {{ padding: 30px; }}
                        .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🚚 Livraison Abidjan</h1>
                            <p>Bienvenue dans notre communauté !</p>
                        </div>
                        <div class="content">
                            <h2>Bonjour {template_request.variables.get('name', '')},</h2>
                            <p>Nous sommes ravis de vous accueillir sur Livraison Abidjan !</p>
                            <p>Votre compte a été créé avec succès et vous pouvez maintenant :</p>
                            <ul>
                                <li>📦 Commander des livraisons</li>
                                <li>🚚 Devenir coursier</li>
                                <li>🏢 Gérer votre entreprise</li>
                                <li>💰 Suivre vos paiements</li>
                            </ul>
                            <p>Merci de votre confiance !</p>
                        </div>
                        <div class="footer">
                            <p>© 2024 Livraison Abidjan. Tous droits réservés.</p>
                        </div>
                    </div>
                </body>
                </html>
                """,
                "text_content": f"Bienvenue sur Livraison Abidjan !\n\nBonjour {template_request.variables.get('name', '')},\n\nNous sommes ravis de vous accueillir !"
            },
            "delivery_update": {
                "subject": "📦 Mise à jour de votre livraison",
                "html_template": f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f7fa; }}
                        .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                        .header {{ background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; }}
                        .content {{ padding: 30px; }}
                        .status-box {{ background: #f8f9fa; border: 2px solid #28a745; border-radius: 10px; padding: 20px; margin: 20px 0; }}
                        .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🚚 Livraison Abidjan</h1>
                            <p>Mise à jour de livraison</p>
                        </div>
                        <div class="content">
                            <h2>Bonjour {template_request.variables.get('name', '')},</h2>
                            <p>Votre livraison a été mise à jour :</p>
                            <div class="status-box">
                                <h3>Livraison #{template_request.variables.get('delivery_id', '')}</h3>
                                <p><strong>Statut :</strong> {template_request.variables.get('status', '')}</p>
                                <p><strong>Adresse :</strong> {template_request.variables.get('address', '')}</p>
                            </div>
                            <p>Suivez votre livraison en temps réel dans l'application.</p>
                        </div>
                        <div class="footer">
                            <p>© 2024 Livraison Abidjan. Tous droits réservés.</p>
                        </div>
                    </div>
                </body>
                </html>
                """,
                "text_content": f"Mise à jour de livraison\n\nLivraison #{template_request.variables.get('delivery_id', '')}\nStatut: {template_request.variables.get('status', '')}"
            },
            "payment_confirmation": {
                "subject": "💰 Confirmation de paiement",
                "html_template": f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f7fa; }}
                        .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                        .header {{ background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; }}
                        .content {{ padding: 30px; }}
                        .payment-box {{ background: #fff3cd; border: 2px solid #ffc107; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }}
                        .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🚚 Livraison Abidjan</h1>
                            <p>Confirmation de paiement</p>
                        </div>
                        <div class="content">
                            <h2>Bonjour {template_request.variables.get('name', '')},</h2>
                            <p>Votre paiement a été confirmé :</p>
                            <div class="payment-box">
                                <h3>Montant : {template_request.variables.get('amount', '')} FCFA</h3>
                                <p>Transaction : {template_request.variables.get('transaction_id', '')}</p>
                                <p>Date : {template_request.variables.get('date', '')}</p>
                            </div>
                            <p>Merci pour votre confiance !</p>
                        </div>
                        <div class="footer">
                            <p>© 2024 Livraison Abidjan. Tous droits réservés.</p>
                        </div>
                    </div>
                </body>
                </html>
                """,
                "text_content": f"Confirmation de paiement\n\nMontant: {template_request.variables.get('amount', '')} FCFA\nTransaction: {template_request.variables.get('transaction_id', '')}"
            }
        }
        
        # Récupérer le template
        template_data = templates.get(template_request.template_name)
        if not template_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Template '{template_request.template_name}' non trouvé"
            )
        
        # Remplacer les variables dans le template
        html_content = template_data["html_template"]
        text_content = template_data["text_content"]
        
        for key, value in template_request.variables.items():
            html_content = html_content.replace(f"{{{{{key}}}}}", str(value))
            text_content = text_content.replace(f"{{{{{key}}}}}", str(value))
        
        # Envoyer l'email
        success = email_service.send_email(
            to_email=template_request.to_email,
            subject=template_data["subject"],
            text_content=text_content,
            html_content=html_content
        )
        
        if success:
            logger.info(f"✅ Email template '{template_request.template_name}' envoyé à {template_request.to_email}")
            return EmailResponse(
                success=True,
                message=f"Email template '{template_request.template_name}' envoyé avec succès",
                to_email=template_request.to_email,
                subject=template_data["subject"]
            )
        else:
            logger.error(f"❌ Échec envoi email template à {template_request.to_email}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Échec de l'envoi de l'email template"
            )
            
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'envoi d'email template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'envoi de l'email template: {str(e)}"
        )

@router.get("/templates", response_model=List[str])
async def get_available_templates(
    current_user: User = Depends(get_current_user)
) -> List[str]:
    """
    Obtenir la liste des templates d'email disponibles.
    """
    try:
        # Vérifier que l'utilisateur a les permissions
        if current_user.role not in ["admin", "manager"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permissions insuffisantes"
            )
        
        templates = ["welcome", "delivery_update", "payment_confirmation"]
        return templates
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de la récupération des templates: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des templates: {str(e)}"
        )

@router.get("/status")
async def get_email_service_status(
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Obtenir le statut du service email.
    """
    try:
        # Vérifier que l'utilisateur a les permissions
        if current_user.role not in ["admin", "manager"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permissions insuffisantes"
            )
        
        email_service = EmailService()
        
        return {
            "brevo_enabled": email_service.brevo_enabled,
            "smtp_configured": bool(email_service.smtp_username and email_service.smtp_password),
            "email_enabled": email_service.email_enabled,
            "from_email": email_service.brevo_from_email or email_service.from_email,
            "from_name": email_service.brevo_from_name
        }
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de la vérification du statut email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la vérification du statut: {str(e)}"
        ) 