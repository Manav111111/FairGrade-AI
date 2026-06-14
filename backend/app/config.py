"""
Application configuration — loads environment variables.
"""
import os
from dotenv import load_dotenv

load_dotenv(override=True)

# ── Environment Cleanup ────────────────────────────────────────────────
# If GOOGLE_API_KEY is present in the global system environment, the google-genai
# SDK will prioritize it over GEMINI_API_KEY. We clear it to force the SDK to use GEMINI_API_KEY.
import os
os.environ.pop("GOOGLE_API_KEY", None)

# ── Groq (LLM scoring + reports) ──────────────────────────────────────
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

# ── Gemini (OCR / vision) ─────────────────────────────────────────────
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

# ── Supabase (database) ───────────────────────────────────────────────
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")

# ── Upload directory ──────────────────────────────────────────────────
UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
