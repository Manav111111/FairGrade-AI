"""
AI Examiner — Core Scoring Engine (Groq).
Used in BOTH Mode A (AI-only) and Mode B (audit comparison).
Evaluates a single answer against a question using subject expertise.
"""
import logging
from app.services.groq_client import chat_completion

logger = logging.getLogger(__name__)

EXAMINER_SYSTEM_PROMPT = """You are an expert subject examiner with deep knowledge of this
subject. You will receive:
- A question and its maximum marks
- A student's written answer to that question

You do NOT have a separate answer key — use your own subject expertise to
determine what a complete/correct answer should contain.

Evaluate like a fair, experienced human examiner:
- Award marks for each correct concept/point present, even if wording
  differs from a textbook answer
- Give partial credit for partially correct or incomplete answers
- Don't penalize for handwriting, formatting, length, or minor language
  issues — judge by content/conceptual accuracy
- Follow standard passing-criteria norms: if the core concept is covered
  reasonably, the answer should receive most of the available marks

Return JSON:
{
  "marks_awarded": <number, out of max_marks>,
  "max_marks": <number>,
  "key_points_covered": ["..."],
  "key_points_missing": ["..."],
  "reasoning": "<1-2 sentences>"
}

Return ONLY valid JSON, no additional text."""


async def score_answer(
    question_text: str,
    max_marks: float,
    answer_text: str,
    subject: str = "",
) -> dict:
    """
    Score a single student answer against a question.
    Returns dict with: marks_awarded, max_marks, key_points_covered,
    key_points_missing, reasoning
    """
    subject_context = f" (Subject: {subject})" if subject else ""
    user_prompt = f"""Question{subject_context}:
{question_text}

Maximum Marks: {max_marks}

Student's Answer:
{answer_text}"""

    logger.info("Scoring answer for question (max_marks=%s)", max_marks)

    result = await chat_completion(
        system_prompt=EXAMINER_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        temperature=0.2,
        expect_json=True,
    )

    # Normalize output
    marks = float(result.get("marks_awarded", 0))
    # Clamp marks to valid range
    marks = max(0, min(marks, max_marks))

    return {
        "marks_awarded": marks,
        "max_marks": max_marks,
        "key_points_covered": result.get("key_points_covered", []),
        "key_points_missing": result.get("key_points_missing", []),
        "reasoning": result.get("reasoning", ""),
    }
