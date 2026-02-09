from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models import ChatSession, Message
from app.schemas import SessionCreate, SessionResponse, MessageCreate, MessageResponse, SummaryRequest, SummaryResponse
from app.agents.translation import translate_text
from app.agents.summary import generate_summary
from app.agents.audio import transcribe_audio
from app.core.websocket import manager
import shutil
import os
import uuid

router = APIRouter()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, listen for pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

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

@router.get("/session/demo", response_model=SessionResponse)
async def get_demo_session(
    doctor_lang: str = "en",
    patient_lang: str = "es",
    db: AsyncSession = Depends(get_db)
):
    """
    Get or create the shared demo session for testing.
    This allows Doctor and Patient to use the same conversation.
    Accepts optional language parameters to configure translation.
    """
    DEMO_SESSION_ID = "demo-session-2026"
    
    # Try to find existing demo session
    result = await db.execute(select(ChatSession).where(ChatSession.id == DEMO_SESSION_ID))
    session = result.scalars().first()
    
    if not session:
        # Create new demo session with specified or default languages
        session = ChatSession(
            id=DEMO_SESSION_ID,
            doctor_lang=doctor_lang,
            patient_lang=patient_lang
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
    else:

        # Check if languages changed
        if session.doctor_lang != doctor_lang or session.patient_lang != patient_lang:
            # Update languages
            session.doctor_lang = doctor_lang
            session.patient_lang = patient_lang
            
            # Clear chat history (delete messages)
            stmt = select(Message).where(Message.session_id == DEMO_SESSION_ID)
            result_msgs = await db.execute(stmt)
            messages = result_msgs.scalars().all()
            
            for msg in messages:
                await db.delete(msg)
            
            await db.commit()
            
            # Broadcast clear event so connected clients update immediately
            from app.core.websocket import manager
            await manager.broadcast({
                "type": "clear_history",
                "session_id": DEMO_SESSION_ID
            })
        else:
            # Just refresh if no changes
            await db.refresh(session)
    
    return session

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
    db: AsyncSession = Depends(get_db),
    x_gemini_api_key: str | None = Header(None, alias="X-Gemini-API-Key")
):
    # 1. Determine Target Lang
    target_lang = session.patient_lang if message_data.role == 'doctor' else session.doctor_lang
    
    # 2. Translate
    try:
        translation = await translate_text(message_data.content, target_lang, api_key=x_gemini_api_key)
    except Exception as e:
        # Fallback: Use original text and append warning
        print(f"Translation failed: {e}")
        translation = f"{message_data.content}\n\n[⚠️ System: Translation failed (API Quota Exceeded). Please check Settings.]"
    
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
    
    # 4. Broadcast to WebSocket clients
    from app.core.websocket import manager
    await manager.broadcast({
        "type": "new_message",
        "message": {
            "id": new_message.id,
            "session_id": new_message.session_id,
            "role": new_message.role,
            "original_text": new_message.original_text,
            "translated_text": new_message.translated_text,
            "audio_url": new_message.audio_url,
            "timestamp": new_message.timestamp.isoformat()
        }
    })
    
    return new_message

@router.post("/audio", response_model=MessageResponse)
async def upload_audio(
    role: str = Form(...),
    file: UploadFile = File(...),
    session: ChatSession = Depends(get_current_session),
    db: AsyncSession = Depends(get_db),
    x_gemini_api_key: str | None = Header(None, alias="X-Gemini-API-Key"),
    x_openai_api_key: str | None = Header(None, alias="X-OpenAI-API-Key")
):
    # 1. Save File
    file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 2. Transcribe
    try:
        transcription = await transcribe_audio(file_path, api_key=x_openai_api_key)
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

    target_lang = session.patient_lang if role == 'doctor' else session.doctor_lang

    # 3. Translate Transcription
    try:
        translation = await translate_text(transcription, target_lang, api_key=x_gemini_api_key)
    except Exception as e:
        # Fallback: Use transcription and append warning
        print(f"Translation failed: {e}")
        translation = f"{transcription}\n\n[⚠️ System: Translation failed (API Quota Exceeded). Please check Settings.]"

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
    
    # 5. Broadcast to WebSocket clients
    from app.core.websocket import manager
    await manager.broadcast({
        "type": "new_message",
        "message": {
            "id": new_message.id,
            "session_id": new_message.session_id,
            "role": new_message.role,
            "original_text": new_message.original_text,
            "translated_text": new_message.translated_text,
            "audio_url": new_message.audio_url,
            "timestamp": new_message.timestamp.isoformat()
        }
    })
    
    return new_message

@router.post("/summary", response_model=SummaryResponse)
async def get_summary(
    req: SummaryRequest, # Kept for potential future params, currently empty
    session: ChatSession = Depends(get_current_session),
    db: AsyncSession = Depends(get_db),
    x_gemini_api_key: str | None = Header(None, alias="X-Gemini-API-Key")
):
    # 1. Fetch messages
    result = await db.execute(select(Message).where(Message.session_id == session.id).order_by(Message.timestamp))
    messages = result.scalars().all()
    
    # 2. Generate Summary
    summary_text = await generate_summary(messages, api_key=x_gemini_api_key)
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

@router.post("/clear/{session_id}")
async def clear_chat_history(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Clears all messages for a specific session and notifies clients.
    DOES NOT delete the session itself, only messages.
    """
    # 1. Delete messages
    stmt = select(Message).where(Message.session_id == session_id)
    result = await db.execute(stmt)
    messages = result.scalars().all()
    
    for msg in messages:
        await db.delete(msg)
    
    await db.commit()
    
    # 2. Broadcast clear event
    from app.core.websocket import manager
    await manager.broadcast({
        "type": "clear_history",
        "session_id": session_id
    })
    
    return {"status": "success", "message": "Chat history cleared"}
