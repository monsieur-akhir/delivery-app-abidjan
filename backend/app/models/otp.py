from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime, timedelta, timezone

from ..db.base import Base

class OTPType(str, enum.Enum):
    REGISTRATION = "registration"
    LOGIN = "login"
    PASSWORD_RESET = "password_reset"
    TWO_FACTOR = "two_factor"

class OTPStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    EXPIRED = "expired"
    FAILED = "failed"

class OTP(Base):
    __tablename__ = "otps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable for registration OTPs
    phone = Column(String, nullable=False, index=True)
    email = Column(String, nullable=True, index=True)
    code = Column(String, nullable=False)
    otp_type = Column(Enum(OTPType), nullable=False)
    status = Column(Enum(OTPStatus), default=OTPStatus.PENDING)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=3)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    verified_at = Column(DateTime(timezone=True), nullable=True)
    
        # Relations
    user = relationship("User", backref="otps")
    
    def is_expired(self) -> bool:
        """Check if the OTP has expired."""
        return datetime.now(timezone.utc) > self.expires_at
    
    def can_attempt(self) -> bool:
        """Check if more attempts are allowed."""
        return self.attempts < self.max_attempts and not self.is_expired()
    
    def increment_attempts(self) -> None:
        """Increment the attempt counter."""
        self.attempts += 1
        if self.attempts >= self.max_attempts:
            self.status = OTPStatus.FAILED
    
    def mark_as_verified(self) -> None:
        """Mark the OTP as verified."""
        self.status = OTPStatus.VERIFIED
        self.verified_at = datetime.now(timezone.utc)
    
    def mark_as_expired(self) -> None:
        """Mark the OTP as expired."""
        self.status = OTPStatus.EXPIRED
    
    @classmethod
    def generate_expiry_time(cls, minutes: int = 5) -> datetime:
        """Generate expiry time for OTP (default 5 minutes)."""
        return datetime.now(timezone.utc) + timedelta(minutes=minutes)
