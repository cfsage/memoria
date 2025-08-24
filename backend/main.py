# backend/main.py


from fastapi import FastAPI, UploadFile, File, HTTPException, Body, Depends
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
import shutil
import uuid
import json
import datetime
import models, auth, database
from prompts import DECONSTRUCTION_PROMPT, PERSONA_CHAT_PROMPT
from gpt5_service import GPT5Service
from chromadb.utils import embedding_functions
import chromadb


app = FastAPI()
gpt5_service = GPT5Service()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for demo/prototype
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR, JSON_DIR, DB_DIR = "uploads", "processed_stories", "vector_db"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(JSON_DIR, exist_ok=True)
os.makedirs(DB_DIR, exist_ok=True)

sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
db_client = chromadb.PersistentClient(path=DB_DIR)
collection = db_client.get_or_create_collection(name="memoria_stories", embedding_function=sentence_transformer_ef)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


class UserCreate(BaseModel):
    email: str
    password: str

class StoryResponse(BaseModel):
    id: str
    title: str
    created_at: datetime.datetime
    is_public: bool
    class Config:
        from_attributes = True


@app.get("/")
def read_root():
    """Health check endpoint."""
    return {"status": "Memoria Backend is Online"}


@app.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"email": new_user.email, "message": "User created successfully"}


@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login and get access token."""
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password", headers={"WWW-Authenticate": "Bearer"})
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    """Upload an audio file for a new story."""
    try:
        story_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ".audio"
        file_path = os.path.join(UPLOAD_DIR, f"{story_id}{file_extension}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"story_id": story_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


def transcribe_audio_placeholder(file_path: str) -> str:
    """Placeholder for audio transcription."""
    return "Well, let me tell you about the winter of '78..."


@app.post("/process/{story_id}")
async def process_story(story_id: str, db: Session = Depends(get_db)):
    """Process an uploaded audio file, transcribe, and deconstruct story using GPT-5."""
    audio_file_path = next((os.path.join(UPLOAD_DIR, f) for f in os.listdir(UPLOAD_DIR) if f.startswith(story_id)), None)
    if not audio_file_path:
        raise HTTPException(status_code=404, detail="Story file not found.")
    transcript = transcribe_audio_placeholder(audio_file_path)
    formatted_prompt = DECONSTRUCTION_PROMPT.format(transcript=transcript)
    try:
        deconstructed_data = gpt5_service.chat([{"role": "user", "content": formatted_prompt}])
        # If GPT-5 returns a JSON string, parse it
        if isinstance(deconstructed_data, str):
            try:
                deconstructed_data = json.loads(deconstructed_data)
            except Exception:
                pass
    except Exception as e:
        # Fallback dummy data for demo
        deconstructed_data = {
            "title": "The Winter of '78",
            "summary": "A family gathers around the fireplace during a harsh winter, sharing laughter and warmth.",
            "themes": ["Family", "Resilience", "Tradition", "Humor"],
            "humor": "The story is sprinkled with light-hearted jokes about the cold and the family's quirky habits.",
            "essence": "Cherish togetherness and find joy even in tough times.",
            "personality_traits": ["kind", "funny", "wise"],
            "memorable_quote": "And that's how we survived the blizzard—with love, laughter, and a lot of hot cocoa!"
        }
    # For demo, set owner_id to None or a dummy value
    new_story = models.Story(id=story_id, title=deconstructed_data.get("title", "Untitled Story"), owner_id="demo")
    db.add(new_story)
    db.commit()
    json_file_path = os.path.join(JSON_DIR, f"{story_id}.json")
    with open(json_file_path, "w") as f:
        json.dump(deconstructed_data, f, indent=2)
    collection.add(documents=[transcript], metadatas=[{"story_id": story_id, "owner_id": "demo"}], ids=[story_id])
    return {"story_id": story_id, "data": deconstructed_data}


@app.get("/stories/me", response_model=list[StoryResponse])
def get_user_stories(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Get all stories for the current user."""
    return db.query(models.Story).filter(models.Story.owner_id == current_user.id).order_by(models.Story.created_at.desc()).all()


@app.patch("/stories/{story_id}/toggle-public", response_model=StoryResponse)
def toggle_story_public_status(story_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Toggle the public/private status of a story."""
    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story or story.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Story not found or not authorized")
    story.is_public = not story.is_public
    db.commit()
    db.refresh(story)
    return story


@app.get("/stories/public/{story_id}")
def get_public_story(story_id: str, db: Session = Depends(get_db)):
    """Get a public story by ID."""
    story = db.query(models.Story).filter(models.Story.id == story_id, models.Story.is_public == True).first()
    if not story:
        raise HTTPException(status_code=404, detail="Public story not found or is private")
    json_file_path = os.path.join(JSON_DIR, f"{story_id}.json")
    if not os.path.exists(json_file_path):
        raise HTTPException(status_code=404, detail="Story data is missing")
    with open(json_file_path, "r") as f:
        data = json.load(f)
    return data


@app.get("/stories/public")
def list_public_stories(db: Session = Depends(get_db)):
    """List all public stories with metadata for display."""
    stories = db.query(models.Story).filter(models.Story.is_public == True).order_by(models.Story.created_at.desc()).all()
    result = []
    for story in stories:
        json_file_path = os.path.join(JSON_DIR, f"{story.id}.json")
        if os.path.exists(json_file_path):
            with open(json_file_path, "r") as f:
                data = json.load(f)
            result.append({
                "id": story.id,
                "title": data.get("title", story.title),
                "summary": data.get("summary", ""),
                "humor": data.get("humor", ""),
                "essence": data.get("essence", ""),
                "memorable_quote": data.get("memorable_quote", ""),
                "created_at": story.created_at,
            })
    return result


@app.post("/chat/{story_id}")
async def chat_with_story(story_id: str, request_body: dict = Body(...), db: Session = Depends(get_db)):
    """Chat with a story persona using GPT-5."""
    json_file_path = os.path.join(JSON_DIR, f"{story_id}.json")
    if not os.path.exists(json_file_path):
        raise HTTPException(status_code=404, detail="Story data not found.")
    with open(json_file_path, "r") as f:
        story_data = json.load(f)
    personality = ", ".join(story_data.get("personality_traits", ["kind"]))
    results = collection.query(query_texts=[request_body.get("question")], n_results=1, where={"story_id": story_id})
    context = "\n".join(results['documents'][0]) if results['documents'] else "I don't recall that part."
    user_question = request_body.get("question", "")
    # If user wants to continue the story, use a special prompt
    if any(word in user_question.lower() for word in ["continue", "next", "more", "go on", "what happened after"]):
        continue_prompt = f"You are a master storyteller. Continue the following story in the same style and voice, picking up where it left off. Be vivid, warm, and keep the tone consistent.\n\nSTORY SO FAR:\n{context}\n\nContinue the story:"
        try:
            answer = gpt5_service.chat([{"role": "user", "content": continue_prompt}])
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI story continuation failed: {str(e)}")
    else:
        chat_prompt = PERSONA_CHAT_PROMPT.format(personality=personality, context=context, question=user_question)
        try:
            answer = gpt5_service.chat([{"role": "user", "content": chat_prompt}])
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")
    return {"answer": answer}
