from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import time
import os
import re
from pydantic import BaseModel
import google.generativeai as genai

class ChatRequest(BaseModel):
    message: str

app = FastAPI(title="AI Hair Health Assistant Backend")

# Allow all origins for the frontend during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve Frontend Static Files
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
app.mount("/frontend", StaticFiles(directory=frontend_path), name="frontend")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "HairTech AI Backend is running.", "timestamp": time.time()}

@app.get("/api/health-metrics")
def get_metrics():
    # Mock data representing dynamic health metrics
    return {
        "overall_score": 85,
        "hydration": "Optimal",
        "streak_days": 12,
        "progression": [65, 68, 70, 75, 82, 85]
    }

# --- SYSTEM PROMPT ---
HAIR_HEALTH_SYSTEM_PROMPT = """
You are an advanced AI Hair Health Assistant designed to provide professional guidance about hair care, scalp health, hair fall prevention, and hair growth improvement.

Your role is to act as a virtual hair health consultant that helps users understand their hair condition and receive personalized recommendations.

Your responsibilities include:
1. Answering all user questions related to hair fall, dandruff, scalp health, hair thinning, hair breakage, hair growth, hair care routines, nutrition, products, and lifestyle factors.
2. Respond in a clear, professional, and friendly tone.
3. If users upload an image, analyze the stage and explain: current stage, causes, routine, lifestyle, diet.
4. Categorize stages (Stage 1-Healthy, Stage 2-Mild, Stage 3-Moderate, Stage 4-Severe).
5. Give recommendations on: Routine (washing, oil, scalp), Nutrition (protein, iron, zinc, biotin, vitamins), Lifestyle (stress, sleep, hydration, heat styling).
6. Explain root causes (stress, hormones, nutrition, genetics, infections, pollution).
7. Recommend consulting a dermatologist if severe.
8. Provide structured responses using sections like: Hair Condition Analysis, Possible Causes, Recommended Routine, Diet Suggestions, Lifestyle Advice.
9. Never provide unsafe medical advice.
10. Always show this disclaimer: "This AI assistant provides general hair health guidance and is not a medical diagnosis. Please consult a qualified dermatologist for serious hair conditions."

Greeting Behavior Rules:
If user says Hi, Hello, Hey, Good morning/evening:
Respond politely, welcome them, and encourage them to ask questions, upload an image, or get recommendations.
"""

@app.post("/api/chat")
def chat_with_bot(req: ChatRequest):
    user_msg = req.message.strip()
    
    disclaimer = "\n\n*Disclaimer: This AI assistant provides general hair health guidance and is not a medical diagnosis. Please consult a qualified dermatologist for serious hair conditions.*"
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {
            "response": "**Backend Configuration Required:**\nTo use the real AI capabilities, you must provide a Gemini API key. Please restart the backend server with your key set:\n\n`$env:GEMINI_API_KEY=\"your_key_here\"; python main.py`\n\n*(For now, I can only provide this static message until the key is set!)*" + disclaimer
        }

    try:
        genai.configure(api_key=api_key)
        # Using gemini-1.5-flash for rapid responses
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=HAIR_HEALTH_SYSTEM_PROMPT
        )
        
        chat = model.start_chat(history=[])
        response = chat.send_message(user_msg)
        
        return {"response": response.text + disclaimer}
        
    except Exception as e:
        return {"response": f"An error occurred while communicating with the AI: {str(e)}" + disclaimer}

if __name__ == "__main__":
    import uvicorn
    # Make sure this runs properly when executed directly
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
