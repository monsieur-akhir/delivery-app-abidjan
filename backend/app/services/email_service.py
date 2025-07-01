import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
import logging
import requests
import json
import asyncio
from jinja2 import Environment, FileSystemLoader, select_autoescape
import os

from app.core.config import settings

logger = logging.getLogger(__name__)

def render_template(template_name: str, context: dict) -> str:
    """
    Rendu d'un template Jinja2 pour email (dossier templates/email).
    """
    templates_dir = os.path.join(os.path.dirname(__file__), '../templates/email')
    if os.path.exists(templates_dir):
        env = Environment(
            loader=FileSystemLoader(templates_dir),
            autoescape=select_autoescape(['html', 'xml'])
        )
        template = env.get_template(template_name)
        return template.render(**context)
    return ""

class EmailService:
    """
    Service unifié pour l'envoi d'emails via Brevo (priorité) et SMTP (fallback).
    """

    def __init__(self):
        # Configuration Brevo
        self.brevo_api_key = os.environ.get('BREVO_API_KEY_MAIL') or getattr(settings, 'BREVO_API_KEY_MAIL', '')
        self.brevo_enabled = bool(self.brevo_api_key)
        self.brevo_url = os.environ.get('BREVO_MAIL_API_URL', 'https://api.brevo.com/v3/smtp/email')
        self.brevo_from_name = os.environ.get('EMAIL_SENDER_NAME', 'Royal Tech')
        self.brevo_from_email = getattr(settings, 'BREVO_FROM_EMAIL', '') or getattr(settings, 'FROM_EMAIL', '')

        # Configuration SMTP fallback
        self.smtp_server = getattr(settings, 'SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = getattr(settings, 'SMTP_PORT', 587)
        self.smtp_username = getattr(settings, 'SMTP_USERNAME', '')
        self.smtp_password = getattr(settings, 'SMTP_PASSWORD', '')
        self.from_email = getattr(settings, 'FROM_EMAIL', self.smtp_username)
        self.email_enabled = getattr(settings, 'EMAIL_ENABLED', True)

        logger.info(f"📧 EmailService initialisé - Brevo: {'✅' if self.brevo_enabled else '❌'}, SMTP: {'✅' if self.smtp_username else '❌'}")

    def send_email_via_brevo(self, to_email: str, subject: str, text_content: str, html_content: Optional[str] = None) -> bool:
        """
        Envoie un email via l'API Brevo.
        """
        if not self.brevo_enabled:
            logger.warning("❌ Service Brevo désactivé ou mal configuré")
            return False

        try:
            headers = {
                "accept": "application/json",
                "api-key": self.brevo_api_key,
                "content-type": "application/json"
            }

            payload = {
                "sender": {
                    "name": self.brevo_from_name,
                    "email": self.brevo_from_email
                },
                "to": [{"email": to_email}],
                "subject": subject,
                "textContent": text_content
            }

            if html_content:
                payload["htmlContent"] = html_content

            logger.info(f"[BREVO] Tentative d'envoi d'email à {to_email} via {self.brevo_url}")
            logger.info(f"[BREVO] Sujet: {subject}")
            logger.info(f"[BREVO] Contenu texte: {text_content}")
            if html_content:
                logger.info(f"[BREVO] Contenu HTML: {html_content}")

            response = requests.post(self.brevo_url, headers=headers, json=payload, timeout=10)

            if response.status_code in [200, 201]:
                logger.info(f"✅ Email Brevo envoyé avec succès à {to_email}")
                return True
            else:
                logger.error(f"❌ Erreur Brevo {response.status_code}: {response.text}")
                return False

        except Exception as e:
            logger.error(f"❌ Exception Brevo: {str(e)}")
            return False

    def send_email_via_smtp(self, to_email: str, subject: str, text_content: str, html_content: Optional[str] = None) -> bool:
        """
        Envoie un email via SMTP (fallback).
        """
        if not self.email_enabled:
            logger.warning("❌ Service SMTP désactivé")
            return False

        if not self.smtp_username or not self.smtp_password:
            logger.warning("❌ Identifiants SMTP manquants")
            return False

        try:
            # En développement, simuler l'envoi
            if settings.ENVIRONMENT == "development":
                logger.info(f"📧 [DEV SMTP] Email simulé envoyé à {to_email}")
                logger.info(f"📧 [DEV SMTP] Sujet: {subject}")
                return True

            # En production, envoyer réellement
            msg = MIMEMultipart("alternative")
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject

            # Ajouter le contenu texte
            msg.attach(MIMEText(text_content, 'plain', 'utf-8'))

            # Ajouter le contenu HTML si disponible
            if html_content:
                msg.attach(MIMEText(html_content, 'html', 'utf-8'))

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            logger.info(f"✅ Email SMTP envoyé avec succès à {to_email}")
            return True

        except Exception as e:
            logger.error(f"❌ Erreur SMTP: {str(e)}")
            return False

    def send_email(self, to_email: str, subject: str, text_content: str, html_content: Optional[str] = None) -> bool:
        """
        Envoie un email en essayant Brevo en premier, puis SMTP en fallback.
        """
        logger.info(f"[EMAIL_SERVICE] Appel send_email: to={to_email}, subject={subject}")
        # Essayer Brevo d'abord
        if self.brevo_enabled:
            if self.send_email_via_brevo(to_email, subject, text_content, html_content):
                logger.info(f"[EMAIL_SERVICE] Email envoyé avec succès à {to_email} via Brevo ou fallback SMTP")
                return True
            logger.warning("⚠️ Brevo a échoué, tentative SMTP...")

        # Fallback vers SMTP
        result = self.send_email_via_smtp(to_email, subject, text_content, html_content)
        if result:
            logger.info(f"[EMAIL_SERVICE] Email envoyé avec succès à {to_email} via SMTP")
        else:
            logger.error(f"[EMAIL_SERVICE] Échec de l'envoi d'email à {to_email} via tous les canaux")
        return result

    def send_otp_email(self, email: str, code: str, otp_type: str) -> bool:
        """
        Envoie un code OTP par email avec template professionnel.
        """
        logger.info(f"[EMAIL_SERVICE] Appel send_otp_email: email={email}, otp_type={otp_type}, code={code}")
        try:
            # Templates selon le type d'OTP
            templates = {
                "registration": {
                    "subject": "🔐 Code de vérification - Inscription Livraison Abidjan",
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
                            .otp-box {{ background: #f8f9fa; border: 2px dashed #007bff; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }}
                            .otp-code {{ font-size: 36px; font-weight: bold; color: #007bff; letter-spacing: 8px; margin: 10px 0; }}
                            .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; }}
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>🚚 Livraison Abidjan</h1>
                                <p>Bienvenue ! Vérifiez votre compte</p>
                            </div>
                            <div class="content">
                                <h2>Bonjour,</h2>
                                <p>Votre code de vérification pour l'inscription est :</p>
                                <div class="otp-box">
                                    <div class="otp-code">{code}</div>
                                    <p>Valide pendant 5 minutes</p>
                                </div>
                                <p>Si vous n'avez pas demandé ce code, ignorez ce message.</p>
                            </div>
                            <div class="footer">
                                <p>© 2024 Livraison Abidjan. Tous droits réservés.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                    """,
                    "text_content": f"Livraison Abidjan - Code de vérification inscription\n\nVotre code: {code}\n\nCe code expire dans 5 minutes.\n\nMerci de votre confiance !"
                },
                "login": {
                    "subject": "🔐 Code de connexion - Livraison Abidjan",
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
                            .otp-box {{ background: #f8f9fa; border: 2px dashed #28a745; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }}
                            .otp-code {{ font-size: 36px; font-weight: bold; color: #28a745; letter-spacing: 8px; margin: 10px 0; }}
                            .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; }}
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>🚚 Livraison Abidjan</h1>
                                <p>Connexion sécurisée</p>
                            </div>
                            <div class="content">
                                <h2>Bonjour,</h2>
                                <p>Votre code de connexion est :</p>
                                <div class="otp-box">
                                    <div class="otp-code">{code}</div>
                                    <p>Valide pendant 5 minutes</p>
                                </div>
                                <p>Si ce n'est pas vous, changez votre mot de passe immédiatement.</p>
                            </div>
                            <div class="footer">
                                <p>© 2024 Livraison Abidjan. Tous droits réservés.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                    """,
                    "text_content": f"Livraison Abidjan - Code de connexion\n\nVotre code: {code}\n\nCe code expire dans 5 minutes.\n\nSi ce n'est pas vous, changez votre mot de passe."
                },
                "password_reset": {
                    "subject": "🔑 Réinitialisation mot de passe - Livraison Abidjan",
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
                            .otp-box {{ background: #fff3cd; border: 2px dashed #ffc107; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }}
                            .otp-code {{ font-size: 36px; font-weight: bold; color: #ffc107; letter-spacing: 8px; margin: 10px 0; }}
                            .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; }}
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>🚚 Livraison Abidjan</h1>
                                <p>Réinitialisation de mot de passe</p>
                            </div>
                            <div class="content">
                                <h2>Bonjour,</h2>
                                <p>Votre code de réinitialisation est :</p>
                                <div class="otp-box">
                                    <div class="otp-code">{code}</div>
                                    <p>Valide pendant 5 minutes</p>
                                </div>
                                <p style="color: #dc3545;">Si vous n'avez pas demandé cette réinitialisation, contactez-nous immédiatement.</p>
                            </div>
                            <div class="footer">
                                <p>© 2024 Livraison Abidjan. Tous droits réservés.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                    """,
                    "text_content": f"Livraison Abidjan - Réinitialisation mot de passe\n\nVotre code: {code}\n\nCe code expire dans 5 minutes.\n\nSi vous n'avez pas demandé cette réinitialisation, contactez-nous."
                }
            }

            if otp_type not in templates:
                logger.error(f"[EMAIL_SERVICE] Type d'OTP inconnu: {otp_type}")
                return False
            tpl = templates[otp_type]
            subject = tpl["subject"]
            html_content = tpl["html_template"]
            text_content = tpl["text_content"]
            result = self.send_email(email, subject, text_content, html_content)
            if result:
                logger.info(f"[EMAIL_SERVICE] OTP email envoyé avec succès à {email}")
            else:
                logger.error(f"[EMAIL_SERVICE] Échec de l'envoi OTP email à {email}")
            return result

        except Exception as e:
            logger.error(f"❌ Exception send_otp_email: {str(e)}")
            return False