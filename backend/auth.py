# backend/auth.py
# SnapFlow — Authentication Module
# Register, Login, Google OAuth, JWT Session

import os
import re
import jwt
import sqlite3
import secrets
import hashlib
import requests as http_requests

from datetime import datetime, timedelta
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

load_dotenv()

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

security = HTTPBearer(auto_error=False)

# =========================
# ENV CONFIG
# =========================

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

JWT_SECRET = os.getenv("JWT_SECRET", "snapflow_secret_demo")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", 8))

ALLOW_ALL_GOOGLE_USERS = os.getenv("ALLOW_ALL_GOOGLE_USERS", "true").lower() == "true"

ALLOWED_EMAILS = [
    email.strip().lower()
    for email in os.getenv("ALLOWED_EMAILS", "").split(",")
    if email.strip()
]

AUTH_DB_PATH = os.getenv("AUTH_DB_PATH", "clario.db")


# =========================
# REQUEST MODELS
# =========================

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: str
    password: str = Field(..., min_length=6)
    company: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    # Untuk frontend yang pakai useGoogleLogin, kirim access_token
    access_token: Optional[str] = None

    # Untuk frontend yang pakai GoogleLogin component, kirim credential / ID token
    credential: Optional[str] = None


# =========================
# DATABASE
# =========================

def get_connection():
    conn = sqlite3.connect(AUTH_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_auth_db():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            company TEXT,
            password_hash TEXT,
            password_salt TEXT,
            provider TEXT NOT NULL DEFAULT 'manual',
            picture TEXT,
            role TEXT NOT NULL DEFAULT 'user',
            created_at TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


init_auth_db()


# =========================
# HELPERS
# =========================

def normalize_email(email: str) -> str:
    return email.strip().lower()


def is_valid_email(email: str) -> bool:
    pattern = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
    return re.match(pattern, email) is not None


def hash_password(password: str, salt: Optional[str] = None):
    if salt is None:
        salt = secrets.token_hex(16)

    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000
    ).hex()

    return password_hash, salt


def verify_password(password: str, password_hash: str, salt: str) -> bool:
    new_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(new_hash, password_hash)


def create_access_token(user: dict) -> str:
    payload = {
        "id": user.get("id"),
        "name": user.get("name"),
        "email": user.get("email"),
        "role": user.get("role", "user"),
        "picture": user.get("picture"),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)
    }

    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token sudah kedaluwarsa. Silakan login ulang.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token tidak valid.")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Token tidak ditemukan.")

    return verify_access_token(credentials.credentials)


def user_to_response(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "company": row["company"],
        "provider": row["provider"],
        "picture": row["picture"],
        "role": row["role"]
    }


def check_google_access(email: str):
    if ALLOW_ALL_GOOGLE_USERS:
        return

    if not ALLOWED_EMAILS:
        raise HTTPException(
            status_code=403,
            detail="Daftar email internal belum dikonfigurasi."
        )

    if email not in ALLOWED_EMAILS:
        raise HTTPException(
            status_code=403,
            detail="Akses ditolak. Email tidak terdaftar sebagai pengguna SnapFlow."
        )


def upsert_google_user(name: str, email: str, picture: Optional[str]):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM users WHERE email = ?", (email,))
    existing = cur.fetchone()

    if existing:
        cur.execute("""
            UPDATE users
            SET name = ?, picture = ?, provider = ?
            WHERE email = ?
        """, (name, picture, "google", email))
        conn.commit()

        cur.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cur.fetchone()
        conn.close()
        return user

    cur.execute("""
        INSERT INTO users (
            name, email, company, password_hash, password_salt,
            provider, picture, role, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        name,
        email,
        None,
        None,
        None,
        "google",
        picture,
        "user",
        datetime.utcnow().isoformat()
    ))

    conn.commit()

    cur.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cur.fetchone()

    conn.close()
    return user


# =========================
# ROUTES
# =========================

@router.post("/register")
def register(req: RegisterRequest):
    email = normalize_email(req.email)

    if not is_valid_email(email):
        raise HTTPException(status_code=400, detail="Format email tidak valid.")

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id FROM users WHERE email = ?", (email,))
    existing = cur.fetchone()

    if existing:
        conn.close()
        raise HTTPException(status_code=409, detail="Email sudah terdaftar.")

    password_hash, salt = hash_password(req.password)

    cur.execute("""
        INSERT INTO users (
            name, email, company, password_hash, password_salt,
            provider, picture, role, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        req.name.strip(),
        email,
        req.company,
        password_hash,
        salt,
        "manual",
        None,
        "user",
        datetime.utcnow().isoformat()
    ))

    conn.commit()

    cur.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cur.fetchone()
    conn.close()

    user_data = user_to_response(user)
    access_token = create_access_token(user_data)

    return {
        "success": True,
        "message": "Register berhasil.",
        "access_token": access_token,
        "user": user_data
    }


@router.post("/login")
def login(req: LoginRequest):
    email = normalize_email(req.email)

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cur.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="Email atau kata sandi salah.")

    if user["provider"] == "google" and not user["password_hash"]:
        raise HTTPException(
            status_code=400,
            detail="Akun ini terdaftar menggunakan Google. Silakan masuk dengan Google."
        )

    if not verify_password(req.password, user["password_hash"], user["password_salt"]):
        raise HTTPException(status_code=401, detail="Email atau kata sandi salah.")

    user_data = user_to_response(user)
    access_token = create_access_token(user_data)

    return {
        "success": True,
        "message": "Login berhasil.",
        "access_token": access_token,
        "user": user_data
    }


@router.post("/google")
def login_google(req: GoogleAuthRequest):
    if not req.access_token and not req.credential:
        raise HTTPException(
            status_code=400,
            detail="access_token atau credential Google wajib dikirim."
        )

    try:
        # Mode 1: frontend pakai GoogleLogin component, kirim credential / ID token
        if req.credential:
            if not GOOGLE_CLIENT_ID:
                raise HTTPException(
                    status_code=500,
                    detail="GOOGLE_CLIENT_ID belum diset di backend."
                )

            payload = id_token.verify_oauth2_token(
                req.credential,
                google_requests.Request(),
                GOOGLE_CLIENT_ID
            )

            email = normalize_email(payload.get("email", ""))
            name = payload.get("name", "Google User")
            picture = payload.get("picture")

        # Mode 2: frontend kamu sekarang pakai useGoogleLogin, kirim access_token
        else:
            res = http_requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={
                    "Authorization": f"Bearer {req.access_token}"
                },
                timeout=10
            )

            if res.status_code != 200:
                raise HTTPException(status_code=401, detail="Token Google tidak valid.")

            payload = res.json()

            email = normalize_email(payload.get("email", ""))
            name = payload.get("name", "Google User")
            picture = payload.get("picture")

        if not email:
            raise HTTPException(status_code=401, detail="Email Google tidak ditemukan.")

        check_google_access(email)

        user = upsert_google_user(name=name, email=email, picture=picture)
        user_data = user_to_response(user)

        access_token = create_access_token(user_data)

        return {
            "success": True,
            "message": "Login Google berhasil.",
            "access_token": access_token,
            "user": user_data
        }

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Autentikasi Google gagal.")


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "user": current_user
    }


@router.post("/logout")
def logout():
    # JWT sifatnya stateless, jadi logout cukup hapus token di frontend.
    return {
        "success": True,
        "message": "Logout berhasil. Hapus token di frontend."
    }