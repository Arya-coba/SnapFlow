# backend/auth.py
# SnapFlow — AI Workplace Assistant
# Authentication — session-based login/logout untuk multi-user sederhana

import uuid
import hashlib
from datetime import datetime, timedelta
from typing import Optional

# ── Konfigurasi ───────────────────────────────────────────────────────────────
SESSION_DURATION_HOURS = 24  # session expired setelah 24 jam

# ── Daftar user (hardcoded untuk demo — tidak perlu DB terpisah) ──────────────
# Password disimpan sebagai SHA-256 hash
# Untuk generate hash baru: hashlib.sha256("password".encode()).hexdigest()
USERS = {
    "admin@snapflow.id": {
        "password_hash": hashlib.sha256("snapflow2024".encode()).hexdigest(),
        "nama"         : "Admin SnapFlow",
        "role"         : "Admin",
        "avatar_seed"  : "Admin",
    },
    "arya@snapflow.id": {
        "password_hash": hashlib.sha256("snapflow2024".encode()).hexdigest(),
        "nama"         : "Arya Choirul Fikri",
        "role"         : "AI Project Lead",
        "avatar_seed"  : "Arya",
    },
    "iqbal@snapflow.id": {
        "password_hash": hashlib.sha256("snapflow2024".encode()).hexdigest(),
        "nama"         : "Muhammad Iqbal Faza",
        "role"         : "NLP Model Engineer",
        "avatar_seed"  : "Iqbal",
    },
    "pradnya@snapflow.id": {
        "password_hash": hashlib.sha256("snapflow2024".encode()).hexdigest(),
        "nama"         : "Pradnya Aliya Maharani",
        "role"         : "AI Integration Engineer",
        "avatar_seed"  : "Pradnya",
    },
    "rizqiyah@snapflow.id": {
        "password_hash": hashlib.sha256("snapflow2024".encode()).hexdigest(),
        "nama"         : "Rizqiyah",
        "role"         : "AI Interface & Deployment Engineer",
        "avatar_seed"  : "Rizqiyah",
    },
    "ardian@snapflow.id": {
        "password_hash": hashlib.sha256("snapflow2024".encode()).hexdigest(),
        "nama"         : "Ardian Gymnastiar",
        "role"         : "AI Data Specialist & QA",
        "avatar_seed"  : "Ardian",
    },
}

# ── In-memory session store ───────────────────────────────────────────────────
# Format: { token: { "email": str, "nama": str, "role": str,
#                    "avatar_seed": str, "expires_at": datetime } }
_sessions: dict = {}


# ── Helper ────────────────────────────────────────────────────────────────────
def _hash_password(password: str) -> str:
    """Hash password menggunakan SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()


def _generate_token() -> str:
    """Generate token session unik."""
    return str(uuid.uuid4()).replace("-", "")


def _clean_expired_sessions():
    """Hapus session yang sudah expired dari memory."""
    now = datetime.now()
    expired = [t for t, data in _sessions.items() if data["expires_at"] < now]
    for t in expired:
        del _sessions[t]


# ══════════════════════════════════════════════════════════════════════════════
# PUBLIC FUNCTIONS — dipanggil dari main.py
# ══════════════════════════════════════════════════════════════════════════════

def login(email: str, password: str) -> Optional[dict]:
    """
    Autentikasi user dan buat session baru.

    Args:
        email    (str): Email user
        password (str): Password plaintext

    Returns:
        dict | None: Data session jika berhasil, None jika gagal.
        Format dict: {
            "token"      : str,
            "email"      : str,
            "nama"       : str,
            "role"       : str,
            "avatar_seed": str,
            "expires_at" : str  (ISO format)
        }
    """
    # Normalisasi email
    email = email.strip().lower()

    # Cek user ada
    user = USERS.get(email)
    if not user:
        return None

    # Verifikasi password
    if user["password_hash"] != _hash_password(password):
        return None

    # Buat session baru
    _clean_expired_sessions()
    token      = _generate_token()
    expires_at = datetime.now() + timedelta(hours=SESSION_DURATION_HOURS)

    _sessions[token] = {
        "email"      : email,
        "nama"       : user["nama"],
        "role"       : user["role"],
        "avatar_seed": user["avatar_seed"],
        "expires_at" : expires_at,
    }

    return {
        "token"      : token,
        "email"      : email,
        "nama"       : user["nama"],
        "role"       : user["role"],
        "avatar_seed": user["avatar_seed"],
        "expires_at" : expires_at.isoformat(),
    }


def logout(token: str) -> bool:
    """
    Hapus session berdasarkan token.

    Args:
        token (str): Token session yang akan dihapus

    Returns:
        bool: True jika session ditemukan dan dihapus, False jika tidak ada
    """
    if token in _sessions:
        del _sessions[token]
        return True
    return False


def get_session(token: str) -> Optional[dict]:
    """
    Ambil data user dari session token.

    Args:
        token (str): Token session

    Returns:
        dict | None: Data user jika session valid dan belum expired, None jika tidak valid.
        Format dict: {
            "email"      : str,
            "nama"       : str,
            "role"       : str,
            "avatar_seed": str,
            "expires_at" : str  (ISO format)
        }
    """
    session = _sessions.get(token)

    if not session:
        return None

    # Cek expired
    if session["expires_at"] < datetime.now():
        del _sessions[token]
        return None

    return {
        "email"      : session["email"],
        "nama"       : session["nama"],
        "role"       : session["role"],
        "avatar_seed": session["avatar_seed"],
        "expires_at" : session["expires_at"].isoformat(),
    }


# ── Testing langsung ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("TEST: Auth Module (SnapFlow)")
    print("=" * 60)

    # Test login berhasil
    print("\n1. Test login valid...")
    result = login("admin@snapflow.id", "snapflow2024")
    if result:
        print(f"   ✅ Login berhasil!")
        print(f"   Token   : {result['token'][:16]}...")
        print(f"   Nama    : {result['nama']}")
        print(f"   Role    : {result['role']}")
        token = result["token"]
    else:
        print("   ❌ Login gagal")
        token = None

    # Test get_session
    if token:
        print("\n2. Test get_session...")
        user = get_session(token)
        if user:
            print(f"   ✅ Session valid: {user['nama']} ({user['email']})")
        else:
            print("   ❌ Session tidak ditemukan")

    # Test login password salah
    print("\n3. Test login password salah...")
    result = login("admin@snapflow.id", "passwordsalah")
    if result is None:
        print("   ✅ Login ditolak dengan benar (password salah)")
    else:
        print("   ❌ Seharusnya ditolak!")

    # Test login email tidak ada
    print("\n4. Test login email tidak terdaftar...")
    result = login("tidakada@snapflow.id", "snapflow2024")
    if result is None:
        print("   ✅ Login ditolak dengan benar (email tidak ada)")
    else:
        print("   ❌ Seharusnya ditolak!")

    # Test logout
    if token:
        print("\n5. Test logout...")
        ok = logout(token)
        if ok:
            print("   ✅ Logout berhasil")
            # Pastikan session sudah dihapus
            user = get_session(token)
            if user is None:
                print("   ✅ Session sudah tidak valid setelah logout")
            else:
                print("   ❌ Session masih ada padahal sudah logout!")

    print("\n✅ Semua test selesai!")
