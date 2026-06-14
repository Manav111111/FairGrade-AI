"""
Question Paper Parser — uses Gemini Vision to extract questions + max marks
from an uploaded question paper image/PDF.
"""
import logging
from app.services.gemini_client import vision_extract

logger = logging.getLogger(__name__)

QUESTION_PAPER_PROMPT = """You are given an exam question paper (image/PDF). Extract every
question with its question number and maximum marks. Return JSON:
{
  "questions": [
    {"q_no": "Q1", "question_text": "...", "max_marks": 5},
    {"q_no": "Q2", "question_text": "...", "max_marks": 10}
  ]
}
If a question has sub-parts (a, b, c), list each sub-part separately with
its own marks. For example Q1(a), Q1(b), etc.
Make sure to capture ALL questions on the paper.
Return ONLY valid JSON, no additional text."""


async def parse_question_paper(file_path: str) -> list[dict]:
    """
    Parse a question paper file and return a list of question dicts.
    Each dict has keys: q_no, question_text, max_marks
    """
    logger.info("Parsing question paper: %s", file_path)
    result = await vision_extract(file_path, QUESTION_PAPER_PROMPT, expect_json=True)

    questions = result.get("questions", [])
    if not questions:
        raise ValueError("No questions extracted from the question paper")

    # Normalize
    for q in questions:
        q["q_no"] = str(q.get("q_no", ""))
        q["question_text"] = str(q.get("question_text", ""))
        q["max_marks"] = float(q.get("max_marks", 0))

    logger.info("Extracted %d questions from question paper", len(questions))
    return questions
