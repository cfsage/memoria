# backend/main.py

from fastapi import FastAPI, UploadFile, File, HTTPException, Body, Depends
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import datetime
import os
import shutil
import uuid
import json
from openai import OpenAI
import chromadb
from chromadb.utils import embedding_functions

import models, auth, database
from prompts import DECONSTRUCTION_PROMPT, PERSONA_CHAT_PROMPT

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

origins = ["http://localhost:3000", "localhost:3000", "http://127.0.0.1:3000", "127.0.0.1:3000"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

UPLOAD_DIR, JSON_DIR, DB_DIR = "uploads", "processed_stories", "vector_db"

# Ensure directories exist with proper permissions
try:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(JSON_DIR, exist_ok=True)
    os.makedirs(DB_DIR, exist_ok=True)
    print(f"Directories created/verified: {UPLOAD_DIR}, {JSON_DIR}, {DB_DIR}")
except Exception as e:
    print(f"Error creating directories: {str(e)}")

# TODO: Replace with your actual OpenAI API key before using
client = OpenAI(api_key="sk-your-openai-api-key")
AI_MODEL = "gpt-3.5-turbo"
sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
db_client = chromadb.PersistentClient(path=DB_DIR)
collection = db_client.get_or_create_collection(name="memoria_stories", embedding_function=sentence_transformer_ef)

def get_db():
    db = database.SessionLocal()
    try: yield db
    finally: db.close()

class UserCreate(BaseModel): email: str; password: str
class StoryResponse(BaseModel):
    id: str; title: str; created_at: datetime.datetime; is_public: bool
    class Config:
        from_attributes = True

@app.get("/")
def read_root(): return {"status": "Memoria Backend is Online"}

@app.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user: raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(new_user); db.commit(); db.refresh(new_user)
    return {"email": new_user.email, "message": "User created successfully"}

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password", headers={"WWW-Authenticate": "Bearer"})
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/upload")
async def upload_audio(file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_user)):
    try:
        # Generate a unique ID for the story
        story_id = str(uuid.uuid4())
        
        # Get file extension, defaulting to .audio if none is provided
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ".audio"
        
        # Create the full file path
        file_path = os.path.join(UPLOAD_DIR, f"{story_id}{file_extension}")
        
        # Ensure the upload directory exists
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        
        # Save the file
        print(f"Saving file to {file_path}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"File saved successfully: {file_path}")
        return {"story_id": story_id}
    except Exception as e:
        print(f"Error in upload_audio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

def transcribe_audio_placeholder(file_path: str) -> str: return "Well, let me tell you about the winter of '78..."

@app.post("/process/{story_id}")
async def process_story(story_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    audio_file_path = next((os.path.join(UPLOAD_DIR, f) for f in os.listdir(UPLOAD_DIR) if f.startswith(story_id)), None)
    if not audio_file_path: raise HTTPException(status_code=404, detail="Story file not found.")
    transcript = transcribe_audio_placeholder(audio_file_path)
    formatted_prompt = DECONSTRUCTION_PROMPT.format(transcript=transcript)
    try:
        response = client.chat.completions.create(model=AI_MODEL, messages=[{"role": "user", "content": formatted_prompt}], response_format={"type": "json_object"})
        deconstructed_data = json.loads(response.choices[0].message.content)
    except Exception as e: raise HTTPException(status_code=500, detail=f"AI processing failed: {str(e)}")
    new_story = models.Story(id=story_id, title=deconstructed_data.get("title", "Untitled Story"), owner_id=current_user.id)
    db.add(new_story); db.commit()
    json_file_path = os.path.join(JSON_DIR, f"{story_id}.json")
    with open(json_file_path, "w") as f: json.dump(deconstructed_data, f, indent=2)
    collection.add(documents=[transcript], metadatas=[{"story_id": story_id, "owner_id": current_user.id}], ids=[story_id])
    return {"story_id": story_id, "data": deconstructed_data}

@app.get("/stories/me", response_model=List[StoryResponse])
def get_user_stories(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Story).filter(models.Story.owner_id == current_user.id).order_by(models.Story.created_at.desc()).all()

@app.patch("/stories/{story_id}/toggle-public", response_model=StoryResponse)
def toggle_story_public_status(story_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story or story.owner_id != current_user.id: raise HTTPException(status_code=403, detail="Story not found or not authorized")
    story.is_public = not story.is_public
    db.commit(); db.refresh(story)
    return story

@app.get("/stories/public/{story_id}")
def get_public_story(story_id: str, db: Session = Depends(get_db)):
    story = db.query(models.Story).filter(models.Story.id == story_id, models.Story.is_public == True).first()
    if not story: raise HTTPException(status_code=404, detail="Public story not found or is private")
    json_file_path = os.path.join(JSON_DIR, f"{story_id}.json")
    if not os.path.exists(json_file_path): raise HTTPException(status_code=404, detail="Story data is missing")
    with open(json_file_path, "r") as f: data = json.load(f)
    return data

@app.post("/chat/{story_id}")
async def chat_with_story(story_id: str, request_body: dict = Body(...), db: Session = Depends(get_db)):
    json_file_path = os.path.join(JSON_DIR, f"{story_id}.json")
    if not os.path.exists(json_file_path): raise HTTPException(status_code=404, detail="Story data not found.")
    with open(json_file_path, "r") as f: story_data = json.load(f)
    personality = ", ".join(story_data.get("personality_traits", ["kind"]))
    results = collection.query(query_texts=[request_body.get("question")], n_results=1, where={"story_id": story_id})
    context = "\n".join(results['documents'][0]) if results['documents'] else "I don't recall that part."
    chat_prompt = PERSONA_CHAT_PROMPT.format(personality=personality, context=context, question=request_body.get("question"))
    response = client.chat.completions.create(model=AI_MODEL, messages=[{"role": "user", "content": chat_prompt}], temperature=0.7)
    return {"answer": response.choices[0].message.content}
