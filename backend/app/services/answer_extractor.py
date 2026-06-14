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
    logger.info("Extracting answers (MOCK) from: %s", file_path)
    student_id = "STUDENT-101"
    answers = [
        {"q_no": "Q1", "answer_text": "Thermodynamics deals with heat, work, and temperature. The first law states energy is conserved, the second law introduces entropy, and the third law defines absolute zero. Applications include engines, refrigerators, and chemical reactions."},
        {"q_no": "Q2", "answer_text": "The wave equation is solved using separation of variables, applying boundary conditions to find the Fourier coefficients. This gives the standing wave harmonics for the vibrating string."},
        {"q_no": "Q3", "answer_text": "Quantum superposition is the principle that a system can exist in multiple states simultaneously until it is measured. Schrödinger's cat is a classic thought experiment illustrating this."},
        {"q_no": "Q4", "answer_text": "Fission is the splitting of a heavy nucleus into lighter ones, while fusion is the combining of light nuclei to form a heavier one. Fusion releases more energy per unit mass and is the source of energy in stars."},
        {"q_no": "Q5", "answer_text": "The speed of sound in an ideal gas is derived from the compressibility and density, yielding v = sqrt(gamma * R * T / M). This depends on temperature and molar mass."}
    ]
    return {"student_id": student_id, "answers": answers}
