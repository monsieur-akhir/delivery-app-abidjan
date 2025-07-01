import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from ..db.session import get_db
from ..models.kyc_document import KycDocument, KycDocumentType, KycDocumentStatus
from ..models.user import User
from ..schemas.kyc_document import KycDocumentRead, KycDocumentCreate
from ..core.dependencies import get_current_active_user
from ..services import user as user_service
from ..services.user import update_kyc_status
from ..core.config import settings

router = APIRouter(prefix="/kyc-documents", tags=["kyc-documents"])

KYC_UPLOAD_DIR = getattr(settings, "KYC_UPLOAD_DIR", "backend/uploads/kyc_documents")

@router.get("/me", response_model=List[KycDocumentRead])
def get_my_kyc_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    docs = db.query(KycDocument).filter(KycDocument.user_id == current_user.id).all()
    return docs

@router.post("/me", response_model=KycDocumentRead)
def upload_kyc_document(
    doc: KycDocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        # Vérifier si un document du même type existe déjà pour cet utilisateur
        existing_doc = db.query(KycDocument).filter(
            KycDocument.user_id == current_user.id,
            KycDocument.type == doc.type
        ).first()
        if existing_doc:
            # Remplacement : on met à jour le document existant
            existing_doc.url = doc.url
            existing_doc.status = doc.status or KycDocumentStatus.pending
            existing_doc.rejection_reason = doc.rejection_reason
            db.commit()
            db.refresh(existing_doc)
            update_kyc_status(current_user.id, db)
            return existing_doc
        else:
            kyc_doc = KycDocument(
                user_id=current_user.id,
                type=doc.type,
                url=doc.url,
                status=doc.status or KycDocumentStatus.pending,
                rejection_reason=doc.rejection_reason
            )
            db.add(kyc_doc)
            db.commit()
            db.refresh(kyc_doc)
            update_kyc_status(current_user.id, db)
            return kyc_doc
    except Exception as e:
        db.rollback()
        if 'uq_user_document_type' in str(e):
            raise HTTPException(status_code=400, detail="Un document de ce type existe déjà pour cet utilisateur.")
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'ajout ou du remplacement du document KYC : {str(e)}")

@router.patch("/{doc_id}/status", response_model=KycDocumentRead)
def update_kyc_document_status(
    doc_id: int,
    status: KycDocumentStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        doc = db.query(KycDocument).filter(KycDocument.id == doc_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document non trouvé")
        doc.status = status
        db.commit()
        db.refresh(doc)
        update_kyc_status(doc.user_id, db)
        return doc
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur lors de la mise à jour du statut du document KYC : {str(e)}")

@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_kyc_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        doc = db.query(KycDocument).filter(KycDocument.id == doc_id, KycDocument.user_id == current_user.id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document non trouvé")
        db.delete(doc)
        db.commit()
        update_kyc_status(current_user.id, db)
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression du document KYC : {str(e)}")

@router.post("/upload", status_code=201)
def upload_kyc_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Vérification du type de fichier
    allowed_types = ["image/jpeg", "image/png", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Type de fichier non autorisé.")
    # Création du dossier utilisateur
    user_folder = os.path.join(KYC_UPLOAD_DIR, str(current_user.id))
    os.makedirs(user_folder, exist_ok=True)
    # Génération d'un nom de fichier unique
    ext = os.path.splitext(file.filename)[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(user_folder, unique_name)
    # Sauvegarde du fichier
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())
    # Retourne un chemin relatif sécurisé (pas le chemin absolu)
    relative_path = os.path.relpath(file_path, KYC_UPLOAD_DIR)
    return {"file_url": f"/kyc-documents/download/{current_user.id}/{unique_name}"}

@router.get("/download/{user_id}/{filename}")
def download_kyc_file(
    user_id: int,
    filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Vérification des droits : seul l'utilisateur ou un admin peut accéder au fichier
    if current_user.id != user_id and current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Accès refusé.")
    # Construction du chemin sécurisé
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(KYC_UPLOAD_DIR, str(user_id), safe_filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Fichier non trouvé.")
    # Sécurité : on ne retourne que des fichiers du dossier KYC
    return FileResponse(file_path, media_type="application/octet-stream", filename=safe_filename) 