from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from models import User
from auth import hash_password, verify_password, create_access_token, require_role
from pydantic import BaseModel

router = APIRouter(prefix="/auth")

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "viewer"

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/token", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="incorrect username or password"
        )
    token = create_access_token({"sub": user.username, "role": user.role})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/users", status_code=201)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin"))
):
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="username already exists")
    if payload.role not in ("admin", "analyst", "viewer"):
        raise HTTPException(status_code=400, detail="role must be admin, analyst, or viewer")
    user = User(
        username=payload.username,
        hashed_password=hash_password(payload.password),
        role=payload.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "username": user.username, "role": user.role}

@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin"))
):
    users = db.query(User).all()
    return [{"id": u.id, "username": u.username, "role": u.role} for u in users]
