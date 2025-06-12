
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from ..db.session import get_db
from ..core.dependencies import get_current_manager
from ..models.user import User
from ..models.promotions import Promotion, PromotionUsage, ReferralProgram, PromotionType, PromotionStatus
from ..schemas.promotions import (
    PromotionCreate, PromotionUpdate, PromotionResponse,
    ReferralProgramCreate, PromotionUsageResponse
)
from ..services.notification import send_notification

router = APIRouter()

@router.post("/", response_model=PromotionResponse)
async def create_promotion(
    promotion_data: PromotionCreate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """
    Créer une nouvelle promotion
    """
    promotion = Promotion(
        **promotion_data.dict(),
        created_by_id=current_user.id
    )
    
    db.add(promotion)
    db.commit()
    db.refresh(promotion)
    
    return promotion

@router.get("/", response_model=List[PromotionResponse])
async def get_promotions(
    status: Optional[PromotionStatus] = None,
    promotion_type: Optional[PromotionType] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """
    Récupérer toutes les promotions avec filtrage
    """
    query = db.query(Promotion)
    
    if status:
        query = query.filter(Promotion.status == status)
    if promotion_type:
        query = query.filter(Promotion.promotion_type == promotion_type)
    
    query = query.order_by(desc(Promotion.created_at))
    
    promotions = query.offset((page - 1) * limit).limit(limit).all()
    return promotions

@router.get("/{promotion_id}", response_model=PromotionResponse)
async def get_promotion(
    promotion_id: int,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """
    Récupérer une promotion spécifique
    """
    promotion = db.query(Promotion).filter(Promotion.id == promotion_id).first()
    if not promotion:
        raise HTTPException(status_code=404, detail="Promotion non trouvée")
    
    return promotion

@router.put("/{promotion_id}", response_model=PromotionResponse)
async def update_promotion(
    promotion_id: int,
    promotion_data: PromotionUpdate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """
    Mettre à jour une promotion
    """
    promotion = db.query(Promotion).filter(Promotion.id == promotion_id).first()
    if not promotion:
        raise HTTPException(status_code=404, detail="Promotion non trouvée")
    
    update_fields = promotion_data.dict(exclude_unset=True)
    for field, value in update_fields.items():
        if hasattr(promotion, field):
            setattr(promotion, field, value)
    
    db.commit()
    db.refresh(promotion)
    
    return promotion

@router.delete("/{promotion_id}")
async def delete_promotion(
    promotion_id: int,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """
    Supprimer une promotion
    """
    promotion = db.query(Promotion).filter(Promotion.id == promotion_id).first()
    if not promotion:
        raise HTTPException(status_code=404, detail="Promotion non trouvée")
    
    db.delete(promotion)
    db.commit()
    
    return {"message": "Promotion supprimée avec succès"}

@router.post("/{promotion_id}/activate")
async def activate_promotion(
    promotion_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """
    Activer une promotion
    """
    promotion = db.query(Promotion).filter(Promotion.id == promotion_id).first()
    if not promotion:
        raise HTTPException(status_code=404, detail="Promotion non trouvée")
    
    promotion.status = PromotionStatus.active
    db.commit()
    
    # Notifier les utilisateurs concernés
    if promotion.is_auto_apply:
        background_tasks.add_task(
            notify_promotion_users,
            db, promotion
        )
    
    return {"message": "Promotion activée avec succès"}

@router.get("/{promotion_id}/usage", response_model=List[PromotionUsageResponse])
async def get_promotion_usage(
    promotion_id: int,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """
    Récupérer l'utilisation d'une promotion
    """
    usages = db.query(PromotionUsage).filter(
        PromotionUsage.promotion_id == promotion_id
    ).order_by(desc(PromotionUsage.used_at)).all()
    
    return usages

@router.get("/analytics/overview")
async def get_promotions_analytics(
    period: str = Query("month", regex="^(week|month|quarter|year)$"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """
    Analyses des promotions
    """
    # Période de calcul
    now = datetime.utcnow()
    if period == "week":
        start_date = now - timedelta(weeks=1)
    elif period == "month":
        start_date = now - timedelta(days=30)
    elif period == "quarter":
        start_date = now - timedelta(days=90)
    else:  # year
        start_date = now - timedelta(days=365)
    
    # Total des promotions
    total_promotions = db.query(func.count(Promotion.id)).scalar()
    active_promotions = db.query(func.count(Promotion.id)).filter(
        Promotion.status == PromotionStatus.active
    ).scalar()
    
    # Utilisation des promotions
    total_usage = db.query(func.count(PromotionUsage.id)).filter(
        PromotionUsage.used_at >= start_date
    ).scalar()
    
    total_discount = db.query(func.sum(PromotionUsage.discount_applied)).filter(
        PromotionUsage.used_at >= start_date
    ).scalar() or 0
    
    # Promotions les plus utilisées
    top_promotions = db.query(
        Promotion.name,
        func.count(PromotionUsage.id).label('usage_count'),
        func.sum(PromotionUsage.discount_applied).label('total_discount')
    ).join(PromotionUsage).filter(
        PromotionUsage.used_at >= start_date
    ).group_by(Promotion.id, Promotion.name).order_by(
        desc('usage_count')
    ).limit(10).all()
    
    # Utilisation par jour
    daily_usage = db.query(
        func.date(PromotionUsage.used_at).label('date'),
        func.count(PromotionUsage.id).label('count'),
        func.sum(PromotionUsage.discount_applied).label('discount')
    ).filter(
        PromotionUsage.used_at >= start_date
    ).group_by(func.date(PromotionUsage.used_at)).order_by('date').all()
    
    return {
        "overview": {
            "total_promotions": total_promotions,
            "active_promotions": active_promotions,
            "total_usage": total_usage,
            "total_discount": float(total_discount),
            "period": period
        },
        "top_promotions": [
            {
                "name": item.name,
                "usage_count": item.usage_count,
                "total_discount": float(item.total_discount or 0)
            }
            for item in top_promotions
        ],
        "daily_usage": [
            {
                "date": str(item.date),
                "count": item.count,
                "discount": float(item.discount or 0)
            }
            for item in daily_usage
        ]
    }

async def notify_promotion_users(db: Session, promotion: Promotion):
    """
    Notifier les utilisateurs d'une nouvelle promotion
    """
    # Logic to notify users based on promotion targeting
    pass
