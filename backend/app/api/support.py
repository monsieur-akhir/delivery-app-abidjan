
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid

from ..db.session import get_db
from ..core.dependencies import get_current_active_user, get_current_manager
from ..models.user import User, UserRole
from ..models.support import SupportTicket, TicketMessage, TicketAttachment, SupportKnowledgeBase
from ..models.support import TicketStatus, TicketPriority, TicketCategory
from ..schemas.support import (
    SupportTicketCreate, SupportTicketResponse, TicketMessageCreate,
    KnowledgeBaseCreate, SupportTicketUpdate
)
from ..services.notification import send_notification
from ..services.storage import upload_file

router = APIRouter()

@router.post("/tickets", response_model=SupportTicketResponse)
async def create_ticket(
    ticket_data: SupportTicketCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Créer un nouveau ticket de support
    """
    # Générer un numéro de ticket unique
    ticket_number = f"TICK-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    ticket = SupportTicket(
        ticket_number=ticket_number,
        user_id=current_user.id,
        title=ticket_data.title,
        description=ticket_data.description,
        category=ticket_data.category,
        priority=ticket_data.priority,
        delivery_id=ticket_data.delivery_id
    )
    
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    
    # Notifier l'équipe support
    await send_notification(
        db, None,  # Notification système
        f"Nouveau ticket: {ticket.title}",
        f"Ticket #{ticket.ticket_number} créé par {current_user.full_name}",
        notification_type="support_ticket"
    )
    
    return ticket

@router.get("/tickets", response_model=Dict[str, Any])
async def get_tickets(
    status: Optional[TicketStatus] = None,
    priority: Optional[TicketPriority] = None,
    category: Optional[TicketCategory] = None,
    assigned_to_me: bool = False,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer les tickets avec filtrage
    """
    query = db.query(SupportTicket)
    
    # Filtres basés sur le rôle
    if current_user.role == UserRole.manager:
        # Les managers peuvent voir tous les tickets
        pass
    else:
        # Les autres utilisateurs ne voient que leurs tickets
        query = query.filter(SupportTicket.user_id == current_user.id)
    
    # Filtres additionnels
    if status:
        query = query.filter(SupportTicket.status == status)
    if priority:
        query = query.filter(SupportTicket.priority == priority)
    if category:
        query = query.filter(SupportTicket.category == category)
    if assigned_to_me and current_user.role == UserRole.manager:
        query = query.filter(SupportTicket.assigned_agent_id == current_user.id)
    
    # Tri par priorité et date
    query = query.order_by(
        desc(SupportTicket.priority),
        desc(SupportTicket.created_at)
    )
    
    # Pagination
    total = query.count()
    tickets = query.offset((page - 1) * limit).limit(limit).all()
    
    return {
        "tickets": tickets,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }

@router.get("/tickets/{ticket_id}", response_model=SupportTicketResponse)
async def get_ticket_details(
    ticket_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer les détails d'un ticket
    """
    query = db.query(SupportTicket).filter(SupportTicket.id == ticket_id)
    
    # Vérifier les permissions
    if current_user.role != UserRole.manager:
        query = query.filter(SupportTicket.user_id == current_user.id)
    
    ticket = query.first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket non trouvé")
    
    return ticket

@router.put("/tickets/{ticket_id}")
async def update_ticket(
    ticket_id: int,
    ticket_data: SupportTicketUpdate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """
    Mettre à jour un ticket (managers seulement)
    """
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket non trouvé")
    
    # Mettre à jour les champs
    update_fields = ticket_data.dict(exclude_unset=True)
    for field, value in update_fields.items():
        if hasattr(ticket, field):
            setattr(ticket, field, value)
    
    # Gérer les changements de statut
    if ticket_data.status == TicketStatus.resolved and not ticket.resolved_at:
        ticket.resolved_at = datetime.utcnow()
    elif ticket_data.status == TicketStatus.closed and not ticket.closed_at:
        ticket.closed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(ticket)
    
    # Notifier l'utilisateur des changements
    await send_notification(
        db, ticket.user_id,
        f"Mise à jour de votre ticket #{ticket.ticket_number}",
        f"Statut: {ticket.status.value}",
        notification_type="ticket_update"
    )
    
    return ticket

@router.post("/tickets/{ticket_id}/messages")
async def add_message(
    ticket_id: int,
    message_data: TicketMessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Ajouter un message à un ticket
    """
    # Vérifier l'accès au ticket
    query = db.query(SupportTicket).filter(SupportTicket.id == ticket_id)
    if current_user.role != UserRole.manager:
        query = query.filter(SupportTicket.user_id == current_user.id)
    
    ticket = query.first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket non trouvé")
    
    message = TicketMessage(
        ticket_id=ticket_id,
        sender_id=current_user.id,
        message=message_data.message,
        is_internal=message_data.is_internal if current_user.role == UserRole.manager else False
    )
    
    db.add(message)
    
    # Mettre à jour le statut du ticket si nécessaire
    if ticket.status == TicketStatus.waiting_customer and current_user.id == ticket.user_id:
        ticket.status = TicketStatus.in_progress
    
    db.commit()
    db.refresh(message)
    
    # Notifier les parties concernées
    if not message.is_internal:
        recipient_id = ticket.assigned_agent_id if current_user.id == ticket.user_id else ticket.user_id
        if recipient_id:
            await send_notification(
                db, recipient_id,
                f"Nouveau message - Ticket #{ticket.ticket_number}",
                message_data.message[:100] + "..." if len(message_data.message) > 100 else message_data.message,
                notification_type="ticket_message"
            )
    
    return message

@router.post("/tickets/{ticket_id}/attachments")
async def add_attachment(
    ticket_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Ajouter une pièce jointe à un ticket
    """
    # Vérifier l'accès au ticket
    query = db.query(SupportTicket).filter(SupportTicket.id == ticket_id)
    if current_user.role != UserRole.manager:
        query = query.filter(SupportTicket.user_id == current_user.id)
    
    ticket = query.first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket non trouvé")
    
    # Uploader le fichier
    file_url = await upload_file(file, f"support/tickets/{ticket_id}")
    
    attachment = TicketAttachment(
        ticket_id=ticket_id,
        uploaded_by_id=current_user.id,
        filename=file.filename,
        file_url=file_url,
        file_size=file.size if hasattr(file, 'size') else 0,
        content_type=file.content_type
    )
    
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    
    return attachment

@router.get("/tickets/{ticket_id}/messages")
async def get_ticket_messages(
    ticket_id: int,
    include_internal: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer les messages d'un ticket
    """
    # Vérifier l'accès au ticket
    query = db.query(SupportTicket).filter(SupportTicket.id == ticket_id)
    if current_user.role != UserRole.manager:
        query = query.filter(SupportTicket.user_id == current_user.id)
    
    ticket = query.first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket non trouvé")
    
    # Récupérer les messages
    messages_query = db.query(TicketMessage).filter(TicketMessage.ticket_id == ticket_id)
    
    # Filtrer les messages internes pour les non-managers
    if current_user.role != UserRole.manager or not include_internal:
        messages_query = messages_query.filter(TicketMessage.is_internal == False)
    
    messages = messages_query.order_by(TicketMessage.created_at).all()
    
    return {"messages": messages}

@router.get("/knowledge-base")
async def get_knowledge_base(
    category: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Récupérer les articles de la base de connaissances
    """
    query = db.query(SupportKnowledgeBase).filter(SupportKnowledgeBase.is_published == True)
    
    if category:
        query = query.filter(SupportKnowledgeBase.category == category)
    
    if search:
        search_filter = or_(
            SupportKnowledgeBase.title.ilike(f"%{search}%"),
            SupportKnowledgeBase.content.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    # Tri par popularité
    query = query.order_by(desc(SupportKnowledgeBase.view_count))
    
    total = query.count()
    articles = query.offset((page - 1) * limit).limit(limit).all()
    
    return {
        "articles": articles,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }

@router.post("/knowledge-base")
async def create_knowledge_article(
    article_data: KnowledgeBaseCreate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """
    Créer un article de base de connaissances
    """
    article = SupportKnowledgeBase(
        title=article_data.title,
        content=article_data.content,
        category=article_data.category,
        tags=article_data.tags,
        created_by_id=current_user.id
    )
    
    db.add(article)
    db.commit()
    db.refresh(article)
    
    return article

@router.get("/dashboard")
async def get_support_dashboard(
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """
    Tableau de bord du support client
    """
    today = datetime.now().date()
    week_ago = today - timedelta(days=7)
    
    # Statistiques des tickets
    total_tickets = db.query(func.count(SupportTicket.id)).scalar()
    open_tickets = db.query(func.count(SupportTicket.id)).filter(
        SupportTicket.status.in_([TicketStatus.open, TicketStatus.in_progress])
    ).scalar()
    
    tickets_today = db.query(func.count(SupportTicket.id)).filter(
        func.date(SupportTicket.created_at) == today
    ).scalar()
    
    # Temps de résolution moyen
    avg_resolution_time = db.query(
        func.avg(func.extract('epoch', SupportTicket.resolved_at - SupportTicket.created_at) / 3600)
    ).filter(SupportTicket.resolved_at.isnot(None)).scalar()
    
    # Satisfaction client moyenne
    avg_satisfaction = db.query(
        func.avg(SupportTicket.customer_satisfaction_score)
    ).filter(SupportTicket.customer_satisfaction_score.isnot(None)).scalar()
    
    # Tickets par catégorie
    tickets_by_category = db.query(
        SupportTicket.category,
        func.count(SupportTicket.id).label('count')
    ).group_by(SupportTicket.category).all()
    
    # Tickets par agent
    tickets_by_agent = db.query(
        User.full_name,
        func.count(SupportTicket.id).label('count')
    ).join(SupportTicket, User.id == SupportTicket.assigned_agent_id)\
     .group_by(User.id, User.full_name).all()
    
    return {
        "overview": {
            "total_tickets": total_tickets,
            "open_tickets": open_tickets,
            "tickets_today": tickets_today,
            "avg_resolution_time_hours": float(avg_resolution_time or 0),
            "avg_satisfaction_score": float(avg_satisfaction or 0)
        },
        "tickets_by_category": [
            {"category": item.category, "count": item.count}
            for item in tickets_by_category
        ],
        "tickets_by_agent": [
            {"agent": item.full_name, "count": item.count}
            for item in tickets_by_agent
        ]
    }
