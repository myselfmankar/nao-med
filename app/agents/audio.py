import openai
from app.core.config import get_settings
import os

settings = get_settings()

def get_openai_client(api_key: str | None = None):
    """
    Get OpenAI Async Client.
    If api_key is provided, use it. Otherwise use the server default.
    """
    final_key = api_key if api_key else settings.OPENAI_API_KEY
    if not final_key:
         raise ValueError("No OpenAI API key provided.")
    return openai.AsyncOpenAI(api_key=final_key)

async def transcribe_audio(file_path: str, api_key: str | None = None) -> str:
    """
    Transcribes audio file using OpenAI Whisper model.
    Accepts optional api_key for user-provided keys.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file not found: {file_path}")

    try:
        # Get Client with specific key or default
        client = get_openai_client(api_key)
        
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
