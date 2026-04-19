# =============================================================
# PART 14 — Auth Router
# POST /api/auth/register
# POST /api/auth/login
# JWT auth — bcrypt password hashing — structlog
# =============================================================
import os
import structlog
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt

log = structlog.get_logger(__name__)
router = APIRouter(tags=["Auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.environ.get("JWT_SECRET_KEY", "changeme_to_random_256bit_secret")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))


class RegisterPayload(BaseModel):
    email: str
    password: str
    full_name: str = ""


class LoginPayload(BaseModel):
    email: str
    password: str


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


@router.post("/auth/register", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterPayload):
    log.info("auth.register", email=payload.email)
    hashed = pwd_context.hash(payload.password)
    # In production: insert into users table via SQLAlchemy async session
    token = create_access_token({"sub": payload.email, "role": "officer"})
    return {"access_token": token, "token_type": "bearer", "email": payload.email}


@router.post("/auth/login")
async def login(payload: LoginPayload):
    log.info("auth.login", email=payload.email)
    # In production: verify hash from DB
    token = create_access_token({"sub": payload.email, "role": "officer"})
    return {"access_token": token, "token_type": "bearer", "email": payload.email}
