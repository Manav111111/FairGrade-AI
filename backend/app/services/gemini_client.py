"""
Gemini Vision client wrapper — uses the new google-genai SDK.
Used for OCR on question papers and answer sheets (gemini-2.0-flash).
"""
import json
import logging
import base64
import re
from pathlib import Path

from google import genai
from google.genai import types
from app.config import GEMINI_API_KEY

logger = logging.getLogger(__name__)

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        if not GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY must be set in .env")
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client


def _load_file_as_part(file_path: str) -> types.Part:
    """Load a local file and convert to a Gemini-compatible inline data part."""
    path = Path(file_path)
    suffix = path.suffix.lower()

    mime_map = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".pdf": "application/pdf",
    }
    mime_type = mime_map.get(suffix, "application/octet-stream")

    with open(file_path, "rb") as f:
        data = f.read()

    return types.Part.from_bytes(data=data, mime_type=mime_type)


async def vision_extract(
    file_path: str,
    prompt: str,
    expect_json: bool = True,
) -> dict | str:
    """
    Send an image/PDF to Gemini for vision-based extraction.
    Returns parsed JSON dict or raw text.
    """
    client = _get_client()
    file_part = _load_file_as_part(file_path)

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt, file_part],
            config=types.GenerateContentConfig(
                temperature=0.1,
                max_output_tokens=8192,
            ),
        )
        content = response.text or ""

        if expect_json:
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                # Try to extract JSON from markdown code blocks
                json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", content)
                if json_match:
                    return json.loads(json_match.group(1).strip())
                logger.error("Failed to parse JSON from Gemini response: %s", content[:300])
                raise
        return content

    except Exception as e:
        logger.error("Gemini API error: %s", str(e))
        raise
