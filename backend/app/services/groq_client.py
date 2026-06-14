"""
Groq LLM client wrapper — used for scoring answers and generating reports.
Uses Llama 3.1 70B via Groq's free API.
"""
import json
import logging
from groq import Groq
from app.config import GROQ_API_KEY

logger = logging.getLogger(__name__)

_client: Groq | None = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        if not GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY must be set in .env")
        _client = Groq(api_key=GROQ_API_KEY)
    return _client


async def chat_completion(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.2,
    max_tokens: int = 4096,
    expect_json: bool = True,
) -> dict | str:
    """
    Send a chat completion request to Groq.
    If expect_json is True, parse the response as JSON and return a dict.
    Otherwise return the raw text.
    """
    client = _get_client()
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"} if expect_json else None,
        )
        content = response.choices[0].message.content or ""

        if expect_json:
            # Try to parse JSON from the response
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                # Try to extract JSON from markdown code blocks
                import re
                json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", content)
                if json_match:
                    return json.loads(json_match.group(1).strip())
                logger.error("Failed to parse JSON from Groq response: %s", content[:200])
                raise
        return content

    except Exception as e:
        logger.error("Groq API error: %s", str(e))
        raise
