# backend/schemas.py
from pydantic import BaseModel, Field
from typing import List

class CulturalReference(BaseModel):
    term: str = Field(description="The specific term, phrase, or historical event mentioned.")
    explanation: str = Field(description="A simple, modern explanation for the term (e.g., 'The Icebox was an early refrigerator').")

class StoryDeconstruction(BaseModel):
    title: str = Field(description="A short, compelling title for the story.")
    summary: str = Field(description="A one-paragraph summary of the story's main narrative.")
    themes: List[str] = Field(description="A list of 3-5 key themes identified in the story (e.g., 'Family', 'Childhood', 'Tradition', 'Humor').")
    emoji_summary: str = Field(description="A 3-5 emoji summary that captures the essence of the story (e.g., '❄️👨‍👩‍👧‍👦🔥').")
    underlying_values: List[str] = Field(description="A list of core human values or lessons (e.g., 'Perseverance', 'Responsibility').")
    personality_traits: List[str] = Field(description="Adjectives describing the speaker's personality (e.g., 'Witty', 'Humble', 'Nostalgic').")
    cultural_references: List[CulturalReference] = Field(description="A list of culturally or historically specific items that need explanation.")