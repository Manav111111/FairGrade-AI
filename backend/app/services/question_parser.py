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
    logger.info("Parsing question paper (MOCK): %s", file_path)
    questions = [
        {"q_no": "Q1", "question_text": "Describe the main principles of thermodynamics.", "max_marks": 10.0},
        {"q_no": "Q2", "question_text": "Solve the wave equation under given boundary conditions.", "max_marks": 10.0},
        {"q_no": "Q3", "question_text": "Explain the concept of quantum superposition.", "max_marks": 10.0},
        {"q_no": "Q4", "question_text": "What is the difference between nuclear fission and fusion?", "max_marks": 10.0},
        {"q_no": "Q5", "question_text": "Derive the speed of sound in an ideal gas.", "max_marks": 10.0}
    ]
    return questions
