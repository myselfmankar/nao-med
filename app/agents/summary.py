from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.core.config import get_settings

settings = get_settings()

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.GEMINI_API_KEY,
    temperature=0.3
)

summary_prompt = ChatPromptTemplate.from_template(
    """
    You are a medical assistant. Summarize the following doctor-patient conversation.
    
    Conversation History:
    {conversation_text}
    
    Please structure your summary with the following sections if applicable:
    - **Symptoms**: What is the patient complaining about?
    - **Diagnoses**: What did the doctor suspect or confirm?
    - **Medications**: Any prescriptions mentioned?
    - **Next Steps**: Follow-up instructions.
    
    Keep it concise and professional.
    """
)

summary_chain = summary_prompt | llm | StrOutputParser()

async def generate_summary(messages: list) -> str:
    """
    Generates a medical summary from a list of message objects.
    """
    if not messages:
        return "No conversation history to summarize."

    # Format messages into a string
    conversation_text = "\n".join([
        f"{msg.role.upper()}: {msg.original_text}" for msg in messages
    ])

    try:
        response = await summary_chain.ainvoke({
            "conversation_text": conversation_text
        })
        return response
    except Exception as e:
        print(f"Summary Error: {e}")
        return "Failed to generate summary."
