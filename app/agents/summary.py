from fastapi import HTTPException
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.core.llm import get_llm

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

async def generate_summary(messages: list, api_key: str | None = None) -> str:
    """
    Generates a medical summary from a list of message objects.
    Accepts optional api_key for user-provided keys.
    """
    if not messages:
        return "No conversation history to summarize."

    # Format messages into a string
    conversation_text = "\n".join([
        f"{msg.role.upper()}: {msg.original_text}" for msg in messages
    ])

    try:
        # Get LLM with specific key or default
        llm = get_llm(api_key=api_key, model="gemini-2.5-flash", temperature=0.3)
        
        # Create chain dynamically
        chain = summary_prompt | llm | StrOutputParser()
        
        response = await chain.ainvoke({
            "conversation_text": conversation_text
        })
        return response
    except Exception as e:
        error_msg = str(e).lower()
        if "429" in error_msg or "quota" in error_msg or "exhausted" in error_msg:
             raise HTTPException(status_code=429, detail="Gemini API Quota Exceeded. Please provide a new API Key in Settings.")
        print(f"Summary Error: {e}")
        return "Failed to generate summary."
