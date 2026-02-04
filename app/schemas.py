from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SessionCreate(BaseModel):
    doctor_lang: str = "en"
    patient_lang: str = "es"

class SessionResponse(BaseModel):
    id: str
    created_at: datetime
    doctor_lang: str
    patient_lang: str

class MessageCreate(BaseModel):
    role: str # 'doctor' or 'patient'
    content: str

class MessageResponse(BaseModel):
    id: int
    session_id: str
    role: str
    original_text: str
    translated_text: Optional[str] = None
    audio_url: Optional[str] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True

class SummaryRequest(BaseModel):
    pass # Session ID inferred from header

class SummaryResponse(BaseModel):
    summary: str
