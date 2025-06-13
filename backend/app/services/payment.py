from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
import requests
import json
import uuid
import hmac
import hashlib
import base64

from ..core.config import settings
from ..models.delivery import Delivery, DeliveryStatus
from ..models.wallet import Wallet, Transaction, TransactionType, TransactionStatus
from ..models.user import User, UserRole
from ..db.session import get_db

async def process_payment(db: Session, delivery_id: int) -> Dict[str, Any]:
    """
    Traiter le paiement d'une livraison.
    """
    # Récupérer la livraison
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise ValueError("Livraison non trouvée")
    
    # Vérifier si la livraison est terminée
    if delivery.status != DeliveryStatus.completed:
        raise ValueError("La livraison n'est pas terminée")
    
    # Récupérer les portefeuilles
    client_wallet = db.query(Wallet).filter(Wallet.user_id == delivery.client_id).first()
    courier_wallet = db.query(Wallet).filter(Wallet.user_id == delivery.courier_id).first()
    
    if not client_wallet or not courier_wallet:
        raise ValueError("Portefeuille non trouvé")
    
    # Calculer la commission
    commission_rate = settings.DEFAULT_COMMISSION_RATE
    commission_amount = delivery.final_price * commission_rate
    courier_amount = delivery.final_price - commission_amount
    
    # Créer les transactions
    reference = str(uuid.uuid4())
    
    # Transaction du client (paiement)
    client_transaction = Transaction(
        wallet_id=client_wallet.id,
        amount=delivery.final_price,
        type=TransactionType.delivery_payment,
        status=TransactionStatus.completed,
        reference=reference,
        description=f"Paiement pour la livraison #{delivery.id}",
        delivery_id=delivery.id,
        completed_at=datetime.now()
    )
    db.add(client_transaction)
    
    # Transaction du coursier (réception)
    courier_transaction = Transaction(
        wallet_id=courier_wallet.id,
        amount=courier_amount,
        type=TransactionType.delivery_payment,
        status=TransactionStatus.completed,
        reference=reference,
        description=f"Paiement reçu pour la livraison #{delivery.id}",
        delivery_id=delivery.id,
        completed_at=datetime.now()
    )
    db.add(courier_transaction)
    
    # Mettre à jour les soldes
    client_wallet.balance -= delivery.final_price
    courier_wallet.balance += courier_amount
    
    # Enregistrer les modifications
    db.commit()
    
    return {
        "delivery_id": delivery.id,
        "final_price": delivery.final_price,
        "commission_amount": commission_amount,
        "courier_amount": courier_amount,
        "reference": reference,
        "status": "completed"
    }

async def initiate_cinetpay_payment(
    amount: float, 
    description: str, 
    transaction_id: str,
    customer_name: str,
    customer_email: str = None,
    customer_phone: str = None,
    customer_address: str = None
) -> Dict[str, Any]:
    """
    Initier un paiement via CinetPay.
    """
    url = "https://api-checkout.cinetpay.com/v2/payment"
    
    # Préparer les données de base
    payload = {
        "apikey": settings.CINETPAY_API_KEY,
        "site_id": settings.CINETPAY_SITE_ID,
        "transaction_id": transaction_id,
        "amount": int(amount),  # CinetPay attend un entier
        "currency": "XOF",
        "description": description,
        "return_url": settings.CINETPAY_RETURN_URL,
        "notify_url": f"{settings.API_V1_STR}/payments/webhook",
        "channels": "ALL",
        "lang": "fr",
        "metadata": json.dumps({"transaction_id": transaction_id})
    }
    
    # Ajouter les informations client
    if customer_name:
        payload["customer_name"] = customer_name
    if customer_email:
        payload["customer_email"] = customer_email
    if customer_phone:
        payload["customer_phone_number"] = customer_phone
    if customer_address:
        payload["customer_address"] = customer_address
    
    # Ajouter la signature
    signature_data = f"{settings.CINETPAY_SITE_ID}|{transaction_id}|{int(amount)}|XOF|{description}|{settings.CINETPAY_API_KEY}"
    signature = hmac.new(
        settings.CINETPAY_SECRET_KEY.encode(),
        signature_data.encode(),
        hashlib.sha256
    ).hexdigest()
    
    payload["signature"] = signature
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            
            if result.get("code") == "201":
                # Paiement initié avec succès
                return {
                    "status": "success",
                    "payment_url": result.get("data", {}).get("payment_url"),
                    "payment_token": result.get("data", {}).get("payment_token"),
                    "transaction_id": transaction_id
                }
            else:
                # Erreur lors de l'initialisation
                return {
                    "status": "error",
                    "code": result.get("code"),
                    "message": result.get("message"),
                    "transaction_id": transaction_id
                }
        else:
            return {
                "status": "error",
                "message": f"Erreur HTTP: {response.status_code}",
                "transaction_id": transaction_id
            }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "transaction_id": transaction_id
        }

async def verify_cinetpay_payment(transaction_id: str) -> Dict[str, Any]:
    """
    Vérifier le statut d'un paiement CinetPay.
    """
    url = "https://api-checkout.cinetpay.com/v2/payment/check"
    
    payload = {
        "apikey": settings.CINETPAY_API_KEY,
        "site_id": settings.CINETPAY_SITE_ID,
        "transaction_id": transaction_id
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            
            if result.get("code") == "00":
                # Paiement vérifié avec succès
                payment_data = result.get("data", {})
                
                return {
                    "status": "success",
                    "transaction_id": transaction_id,
                    "payment_status": payment_data.get("status"),
                    "amount": payment_data.get("amount"),
                    "currency": payment_data.get("currency"),
                    "payment_method": payment_data.get("payment_method"),
                    "operator_id": payment_data.get("operator_id"),
                    "payment_date": payment_data.get("payment_date")
                }
            else:
                # Erreur lors de la vérification
                return {
                    "status": "error",
                    "code": result.get("code"),
                    "message": result.get("message"),
                    "transaction_id": transaction_id
                }
        else:
            return {
                "status": "error",
                "message": f"Erreur HTTP: {response.status_code}",
                "transaction_id": transaction_id
            }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "transaction_id": transaction_id
        }

async def process_cinetpay_webhook(webhook_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Traiter les notifications webhook de CinetPay.
    """
    # Vérifier la signature
    if "signature" in webhook_data:
        expected_signature = hmac.new(
            settings.CINETPAY_SECRET_KEY.encode(),
            json.dumps(webhook_data, sort_keys=True).encode(),
            hashlib.sha256
        ).hexdigest()
        
        if webhook_data["signature"] != expected_signature:
            return {
                "status": "error",
                "message": "Signature invalide"
            }
    
    # Récupérer les données du paiement
    transaction_id = webhook_data.get("transaction_id")
    status = webhook_data.get("status")
    
    if not transaction_id or not status:
        return {
            "status": "error",
            "message": "Données manquantes"
        }
    
    # Mettre à jour la transaction dans la base de données
    db = next(get_db())
    transaction = db.query(Transaction).filter(Transaction.reference == transaction_id).first()
    
    if not transaction:
        return {
            "status": "error",
            "message": "Transaction non trouvée"
        }
    
    # Mettre à jour le statut de la transaction
    if status == "ACCEPTED":
        transaction.status = TransactionStatus.completed
        transaction.completed_at = datetime.now()
    elif status == "REFUSED":
        transaction.status = TransactionStatus.failed
    elif status == "WAITING":
        transaction.status = TransactionStatus.pending
    
    db.commit()
    
    return {
        "status": "success",
        "transaction_id": transaction_id,
        "payment_status": status
    }

async def process_mobile_money_payment(
    phone: str, 
    amount: float, 
    description: str, 
    transaction_id: str,
    operator: str = "orange"  # orange, mtn, moov
) -> Dict[str, Any]:
    """
    Traiter un paiement via Mobile Money (Orange Money, MTN Mobile Money).
    """
    # Utiliser CinetPay pour le paiement mobile money
    return await initiate_cinetpay_payment(
        amount=amount,
        description=description,
        transaction_id=transaction_id,
        customer_name="",
        customer_phone=phone,
        customer_email=""
    )

async def process_wallet_topup(
    db: Session,
    user_id: int,
    amount: float,
    payment_method: str,
    transaction_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Traiter un rechargement de portefeuille.
    """
    # Récupérer l'utilisateur et son portefeuille
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("Utilisateur non trouvé")
    
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        raise ValueError("Portefeuille non trouvé")
    
    # Générer un ID de transaction si non fourni
    if not transaction_id:
        transaction_id = str(uuid.uuid4())
    
    # Créer la transaction
    transaction = Transaction(
        wallet_id=wallet.id,
        amount=amount,
        type=TransactionType.topup,
        status=TransactionStatus.pending,
        reference=transaction_id,
        description=f"Rechargement de {amount} FCFA via {payment_method}",
        payment_method=payment_method
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    # Initialiser le paiement selon la méthode
    if payment_method == "cinetpay":
        payment_result = await initiate_cinetpay_payment(
            amount=amount,
            description=f"Rechargement de portefeuille - {user.phone}",
            transaction_id=transaction_id,
            customer_name=user.full_name,
            customer_phone=user.phone,
            customer_email=user.email
        )
        
        return {
            "status": "pending",
            "transaction_id": transaction_id,
            "payment_url": payment_result.get("payment_url"),
            "payment_token": payment_result.get("payment_token")
        }
    elif payment_method in ["orange_money", "mtn_money", "moov_money"]:
        operator = payment_method.split("_")[0]
        payment_result = await process_mobile_money_payment(
            phone=user.phone,
            amount=amount,
            description=f"Rechargement de portefeuille - {user.phone}",
            transaction_id=transaction_id,
            operator=operator
        )
        
        return {
            "status": "pending",
            "transaction_id": transaction_id,
            "payment_url": payment_result.get("payment_url"),
            "payment_token": payment_result.get("payment_token")
        }
    else:
        # Méthode de paiement non supportée
        transaction.status = TransactionStatus.failed
        db.commit()
        
        raise ValueError(f"Méthode de paiement non supportée: {payment_method}")

async def process_payment_transaction(
    db: Session,
    wallet_id: int,
    amount: float,
    transaction_type: TransactionType,
    description: str,
    delivery_id: Optional[int] = None,
    reference: Optional[str] = None
) -> Transaction:
    """
    Traiter une transaction de paiement.
    
    Args:
        db: Session de base de données
        wallet_id: ID du portefeuille
        amount: Montant de la transaction
        transaction_type: Type de transaction
        description: Description de la transaction
        delivery_id: ID de la livraison (optionnel)
        reference: Référence de la transaction (optionnel)
        
    Returns:
        Transaction: L'objet transaction créé
    """
    # Vérifier le portefeuille
    wallet = db.query(Wallet).filter(Wallet.id == wallet_id).first()
    if not wallet:
        raise ValueError("Portefeuille non trouvé")
    
    # Vérifier le solde pour les paiements
    if transaction_type in [TransactionType.delivery_payment, TransactionType.transfer]:
        if wallet.balance < amount:
            raise ValueError("Solde insuffisant")
    
    # Créer la transaction
    transaction = Transaction(
        wallet_id=wallet_id,
        amount=amount,
        type=transaction_type,
        status=TransactionStatus.completed,
        description=description,
        delivery_id=delivery_id,
        reference=reference or str(uuid.uuid4()),
        completed_at=datetime.now()
    )
    
    # Mettre à jour le solde du portefeuille
    if transaction_type in [TransactionType.delivery_payment, TransactionType.transfer]:
        wallet.balance -= amount
    else:
        wallet.balance += amount
    
    # Enregistrer les modifications
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return transaction
