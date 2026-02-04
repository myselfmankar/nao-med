from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class ChatSession(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    created_at = Column(DateTime, default=datetime.utcnow)
    doctor_lang = Column(String, default="en")
    patient_lang = Column(String, default="es")
    
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id"))
    role = Column(String)  # 'doctor' or 'patient'
    original_text = Column(Text)
    translated_text = Column(Text)
    audio_url = Column(String, nullable=True) # Path to stored audio file
    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")
