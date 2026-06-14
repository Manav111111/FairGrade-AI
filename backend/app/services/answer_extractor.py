"""
Answer Sheet Extractor — uses Gemini Vision to OCR student answer sheets.
"""
import logging
from app.services.gemini_client import vision_extract

logger = logging.getLogger(__name__)

ANSWER_EXTRACTOR_PROMPT = """You are given a student's handwritten/typed answer sheet
(image/PDF). For each question number visible, extract the student's
written answer text as accurately as possible, preserving technical
terms, formulas, and diagrams descriptions. Return JSON:
{
  "student_id": "<roll number if visible, else null>",
  "answers": [
    {"q_no": "Q1", "answer_text": "..."},
    {"q_no": "Q2", "answer_text": "..."}
  ]
}
Make sure to capture ALL answers present on the sheet.
Return ONLY valid JSON, no additional text."""


async def extract_answers(file_path: str) -> dict:
    """
    Extract answers from a student answer sheet.
    Returns dict with keys: student_id (str|None), answers (list[dict])
    """
    logger.info("Extracting answers from: %s", file_path)
    result = await vision_extract(file_path, ANSWER_EXTRACTOR_PROMPT, expect_json=True)

    answers = result.get("answers", [])
    student_id = result.get("student_id")

    # Normalize
    for a in answers:
        a["q_no"] = str(a.get("q_no", ""))
        a["answer_text"] = str(a.get("answer_text", ""))

    logger.info(
        "Extracted %d answers for student %s",
        len(answers),
        student_id or "unknown",
    )
    return {"student_id": student_id, "answers": answers}
