
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from enum import Enum

from ..models.support import TicketStatus, TicketPriority, TicketCategory

class SupportTicketCreate(BaseModel):
    title: str
    description: str
    category: TicketCategory
    priority: TicketPriority = TicketPriority.normal
    delivery_id: Optional[int] = None

class SupportTicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[TicketCategory] = None
    priority: Optional[TicketPriority] = None
    status: Optional[TicketStatus] = None
    assigned_agent_id: Optional[int] = None
    estimated_resolution_time: Optional[datetime] = None
    customer_satisfaction_score: Optional[int] = None

class TicketMessageCreate(BaseModel):
    message: str
    is_internal: bool = False

class TicketMessageResponse(BaseModel):
    id: int
    message: str
    is_internal: bool
    is_automated: bool
    created_at: datetime
    sender: Dict[str, Any]

class SupportTicketResponse(BaseModel):
    id: int
    ticket_number: str
    title: str
    description: str
    category: TicketCategory
    priority: TicketPriority
    status: TicketStatus
    created_at: datetime
    updated_at: Optional[datetime]
    resolved_at: Optional[datetime]
    user: Dict[str, Any]
    assigned_agent: Optional[Dict[str, Any]]
    messages: List[TicketMessageResponse] = []

class KnowledgeBaseCreate(BaseModel):
    title: str
    content: str
    category: str
    tags: Optional[str] = None

class KnowledgeBaseResponse(BaseModel):
    id: int
    title: str
    content: str
    category: str
    tags: Optional[str]
    view_count: int
    helpful_count: int
    created_at: datetime
