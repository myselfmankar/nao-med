from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import get_settings

settings = get_settings()

def get_llm(api_key: str | None = None, model: str = "gemini-2.5-flash", temperature: float = 0.1):
    """
    Get a Gemini LLM instance. 
    If api_key is provided, use it. Otherwise use the server default.
    """
    final_key = api_key if api_key else settings.GEMINI_API_KEY
    
    if not final_key:
        raise ValueError("No Gemini API key provided. Service cannot function.")
        
    return ChatGoogleGenerativeAI(
        model=model,
        google_api_key=final_key,
        temperature=temperature
    )
