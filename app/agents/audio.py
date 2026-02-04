import openai
from app.core.config import get_settings
import os

settings = get_settings()

client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

async def transcribe_audio(file_path: str) -> str:
    """
    Transcribes audio file using OpenAI Whisper model.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file not found: {file_path}")

    try:
        with open(file_path, "rb") as audio_file:
            transcription = await client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file,
                response_format="text"
            )
        return transcription
    except Exception as e:
        print(f"Transcription Error: {e}")
        raise e
