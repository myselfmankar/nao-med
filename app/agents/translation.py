from fastapi import HTTPException
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.core.llm import get_llm

# Translation Prompt
translation_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a professional medical translator. Translate the user input accurately into {target_lang}. Preserve medical terminology. Do not add any conversational filler, just return the translated text."),
    ("user", "{text}")
])

async def translate_text(text: str, target_lang: str, api_key: str | None = None) -> str:
    """
    Translates text to target language using Gemini 2.0.
    Accepts optional api_key for user-provided keys.
    """
    if not text:
        return ""
    
    try:
        # Get LLM with specific key or default
        llm = get_llm(api_key=api_key, model="gemini-2.5-flash")
        
        # Create chain dynamically
        chain = translation_prompt | llm | StrOutputParser()
        
        response = await chain.ainvoke({
            "text": text,
            "target_lang": target_lang
        })
        return response
    except Exception as e:
        error_msg = str(e).lower()
        if "429" in error_msg or "quota" in error_msg or "exhausted" in error_msg:
             raise HTTPException(status_code=429, detail="Gemini API Quota Exceeded. Please provide a new API Key in Settings.")
        print(f"Translation Error: {e}")
        return text # Fallback to original text on error
