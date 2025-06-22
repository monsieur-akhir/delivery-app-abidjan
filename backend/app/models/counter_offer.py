from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from ..db.base import Base

class CounterOffer(Base):
    __tablename__ = "counter_offers"
    
    id = Column(Integer, primary_key=True, index=True)
    original_bid_id = Column(Integer, ForeignKey("bids.id"), nullable=False)
    new_price = Column(Float, nullable=False)
    message = Column(Text, nullable=True)
    status = Column(String(20), default="pending")  # pending, accepted, declined, counter
    created_at = Column(DateTime, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)
    response_type = Column(String(20), nullable=True)  # accept, decline, counter
    courier_response_price = Column(Float, nullable=True)
    courier_response_message = Column(Text, nullable=True)
    
    # Relations
    original_bid = relationship("Bid", back_populates="counter_offers")
    
    def __repr__(self):
        return f"<CounterOffer(id={self.id}, original_bid_id={self.original_bid_id}, new_price={self.new_price}, status={self.status})>" 