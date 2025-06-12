
from sqlalchemy.orm import Session
from typing import List, Optional

from ..models.complaint import Complaint
from ..schemas.complaint import ComplaintCreate, ComplaintUpdate

def create_complaint(db: Session, complaint: ComplaintCreate, user_id: int) -> Complaint:
    """
    Créer une nouvelle plainte.
    """
    db_complaint = Complaint(
        user_id=user_id,
        type=complaint.type,
        subject=complaint.subject,
        description=complaint.description,
        delivery_id=complaint.delivery_id
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint

def get_complaint(db: Session, complaint_id: int) -> Optional[Complaint]:
    """
    Récupérer une plainte par son ID.
    """
    return db.query(Complaint).filter(Complaint.id == complaint_id).first()

def get_complaints(
    db: Session,
    user_id: Optional[int] = None,
    status: Optional[str] = None,
    type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Complaint]:
    """
    Récupérer la liste des plaintes avec filtres.
    """
    query = db.query(Complaint)
    
    if user_id is not None:
        query = query.filter(Complaint.user_id == user_id)
    
    if status:
        query = query.filter(Complaint.status == status)
    
    if type:
        query = query.filter(Complaint.type == type)
    
    return query.order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()

def update_complaint(db: Session, complaint_id: int, complaint_update: ComplaintUpdate) -> Complaint:
    """
    Mettre à jour une plainte.
    """
    db_complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not db_complaint:
        return None
    
    update_data = complaint_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_complaint, field, value)
    
    db.commit()
    db.refresh(db_complaint)
    return db_complaint
