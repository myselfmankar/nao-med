from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models import ChatSession, Message
from app.schemas import SessionCreate, SessionResponse, MessageCreate, MessageResponse, SummaryRequest, SummaryResponse
from app.agents.translation import translate_text
from app.agents.summary import generate_summary
from app.agents.audio import transcribe_audio
import shutil
import os
import uuid

router = APIRouter()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def get_current_session(
    x_session_id: str = Header(..., alias="X-Session-ID"),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ChatSession).where(ChatSession.id == x_session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.post("/session", response_model=SessionResponse)
async def create_session(session_data: SessionCreate, db: AsyncSession = Depends(get_db)):
    new_session = ChatSession(
        doctor_lang=session_data.doctor_lang,
        patient_lang=session_data.patient_lang
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    return new_session

@router.get("/session", response_model=SessionResponse)
async def get_session_info(session: ChatSession = Depends(get_current_session)):
    return session

@router.get("/messages", response_model=list[MessageResponse])
async def get_messages(session: ChatSession = Depends(get_current_session), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Message).where(Message.session_id == session.id).order_by(Message.timestamp))
    return result.scalars().all()

@router.post("/chat", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate, 
    session: ChatSession = Depends(get_current_session),
    db: AsyncSession = Depends(get_db)
):
    # 1. Determine Target Lang
    target_lang = session.patient_lang if message_data.role == 'doctor' else session.doctor_lang
    
    # 2. Translate
    translation = await translate_text(message_data.content, target_lang)
    
    # 3. Save
    new_message = Message(
        session_id=session.id,
        role=message_data.role,
        original_text=message_data.content,
        translated_text=translation
    )
    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)
    return new_message

@router.post("/audio", response_model=MessageResponse)
async def upload_audio(
    role: str = Form(...),
    file: UploadFile = File(...),
    session: ChatSession = Depends(get_current_session),
    db: AsyncSession = Depends(get_db)
):
    # 1. Save File
    file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 2. Transcribe
    try:
        transcription = await transcribe_audio(file_path)
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

    target_lang = session.patient_lang if role == 'doctor' else session.doctor_lang

    # 3. Translate Transcription
    translation = await translate_text(transcription, target_lang)

    # 4. Save
    new_message = Message(
        session_id=session.id,
        role=role,
        original_text=transcription,
        translated_text=translation,
        audio_url=f"/uploads/{os.path.basename(file_path)}" # URL path
    )
    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)
    return new_message

@router.post("/summary", response_model=SummaryResponse)
async def get_summary(
    req: SummaryRequest, # Kept for potential future params, currently empty
    session: ChatSession = Depends(get_current_session),
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch messages
    result = await db.execute(select(Message).where(Message.session_id == session.id).order_by(Message.timestamp))
    messages = result.scalars().all()
    
    # 2. Generate Summary
    summary_text = await generate_summary(messages)
    return SummaryResponse(summary=summary_text)

@router.get("/search", response_model=list[MessageResponse])
async def search_messages(
    q: str,
    session: ChatSession = Depends(get_current_session),
    db: AsyncSession = Depends(get_db)
):
    """
    Search messages in the current session for keywords.
    """
    if not q:
        return []

    # Case-insensitive search in original OR translated text
    search_pattern = f"%{q}%"
    stmt = select(Message).where(
        Message.session_id == session.id,
        (Message.original_text.ilike(search_pattern)) | (Message.translated_text.ilike(search_pattern))
    ).order_by(Message.timestamp)
    
    result = await db.execute(stmt)
    return result.scalars().all()
