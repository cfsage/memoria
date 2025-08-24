# backend/models.py
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    stories = relationship("Story", back_populates="owner")

class Story(Base):
    __tablename__ = "stories"
    id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_public = Column(Boolean, default=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="stories")