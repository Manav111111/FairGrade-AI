"""
Gemini Vision client wrapper — used for OCR on question papers and answer sheets.
Uses gemini-2.0-flash via Google's free API.
"""
import json
import logging
import base64
import re
from pathlib import Path

import google.generativeai as genai
from app.config import GEMINI_API_KEY

logger = logging.getLogger(__name__)

_configured = False


def _ensure_configured():
    global _configured
    if not _configured:
        if not GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY must be set in .env")
        genai.configure(api_key=GEMINI_API_KEY)
        _configured = True


def _load_file_as_part(file_path: str) -> dict:
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

    return {"inline_data": {"mime_type": mime_type, "data": base64.b64encode(data).decode()}}


async def vision_extract(
    file_path: str,
    prompt: str,
    expect_json: bool = True,
) -> dict | str:
    """
    Send an image/PDF to Gemini for vision-based extraction.
    Returns parsed JSON dict or raw text.
    """
    _ensure_configured()
    model = genai.GenerativeModel("gemini-2.0-flash")

    file_part = _load_file_as_part(file_path)

    try:
        response = model.generate_content(
            [prompt, file_part],
            generation_config=genai.types.GenerationConfig(
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
