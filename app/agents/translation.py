from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.core.config import get_settings

settings = get_settings()

# Initialize Gemini 2.0 Flash
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.GEMINI_API_KEY,
    temperature=0.1
)

# Translation Chain
translation_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a professional medical translator. Translate the user input accurately into {target_lang}. Preserve medical terminology. Do not add any conversational filler, just return the translated text."),
    ("user", "{text}")
])

translation_chain = translation_prompt | llm | StrOutputParser()

async def translate_text(text: str, target_lang: str) -> str:
    """
    Translates text to target language using Gemini 2.0.
    """
    if not text:
        return ""
    
    try:
        response = await translation_chain.ainvoke({
            "text": text,
            "target_lang": target_lang
        })
        return response
    except Exception as e:
        print(f"Translation Error: {e}")
        return text # Fallback to original text on error
