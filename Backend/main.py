# main.py
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
from pydantic import BaseModel
import core
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

import os 

# =======================
# 1. DATABASE SETUP (SQLAlchemy)
# =======================

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./nanolink.db")

if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

if "sqlite" in SQLALCHEMY_DATABASE_URL:
    connect_args = {"check_same_thread": False}
else:
    connect_args = {}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Define the Table Structure
class URLItem(Base):
    __tablename__ = "urls"
    
    id = Column(Integer, primary_key=True, index=True)
    original_url = Column(String, index=True)
    short_code = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    clicks = Column(Integer, default=0) # Analytics feature

# Create the tables
Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =======================
# 2. FASTAPI APP SETUP
# =======================
app = FastAPI(title="NanoLink URL Shortener", description="Advanced Base62 Shortener")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (for now, easy for dev)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =======================
# 3. API ENDPOINTS
# =======================
class URLCreate(BaseModel):
    url: str
    custom_alias: Optional[str] = None
    
@app.post("/shorten")
def shorten_url(item: URLCreate, db: Session = Depends(get_db)):
    # 1. Check if Custom Alias is requested
    if item.custom_alias:
        # Check if it's already taken
        existing = db.query(URLItem).filter(URLItem.short_code == item.custom_alias).first()
        if existing:
            raise HTTPException(status_code=400, detail="Alias already taken")
        
        # Create with custom alias
        db_url = URLItem(original_url=item.url, short_code=item.custom_alias)
        db.add(db_url)
        db.commit()
        return {"short_url": f"http://localhost:8000/{item.custom_alias}", "original": item.url}

    # 2. If no custom alias, use the Auto-Generator (Base62)
    db_url = URLItem(original_url=item.url)
    db.add(db_url)
    db.commit()
    db.refresh(db_url)
    
    # Generate ID-based code (with offset)
    code = core.encode(db_url.id + 10000000)
    db_url.short_code = code
    db.commit()
    
    return {"short_url": f"http://localhost:8000/{code}", "original": item.url}

@app.get("/{short_code}")
def redirect_to_url(short_code: str, db: Session = Depends(get_db)):
    db_url = db.query(URLItem).filter(URLItem.short_code == short_code).first()
    
    if db_url is None:
        raise HTTPException(status_code=404, detail="URL not found")
    
    db_url.clicks += 1
    db.commit()
    
    
    return RedirectResponse(url=db_url.original_url)

@app.get("/stats/{short_code}")
def get_analytics(short_code: str, db: Session = Depends(get_db)):
    
    db_url = db.query(URLItem).filter(URLItem.short_code == short_code).first()
    
    if db_url is None:
        raise HTTPException(status_code=404, detail="URL not found")
        
    return {
        "short_code": short_code,
        "original_url": db_url.original_url,
        "total_clicks": db_url.clicks,
        "created_at": db_url.created_at
    }