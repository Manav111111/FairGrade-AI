"""
Exam router — create exams, set mode, parse question papers.
"""
import os
import uuid
import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.db.supabase_client import get_supabase
from app.services.question_parser import parse_question_paper
from app.config import UPLOAD_DIR

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/exam", tags=["exam"])


@router.post("/create")
async def create_exam(
    exam_name: str = Form(...),
    subject: str = Form(""),
    mode: str = Form(...),  # AI_ONLY or AUDIT
    question_paper: UploadFile = File(...),
):
    """
    Create a new exam:
    1. Save the uploaded question paper
    2. Parse it with Gemini to extract questions + max marks
    3. Store in Supabase
    """
    if mode not in ("AI_ONLY", "AUDIT"):
        raise HTTPException(status_code=400, detail="mode must be AI_ONLY or AUDIT")

    # Save uploaded file
    file_ext = os.path.splitext(question_paper.filename or "file.pdf")[1]
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"qp_{file_id}{file_ext}")

    content = await question_paper.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Parse question paper
    try:
        questions = await parse_question_paper(file_path)
    except Exception as e:
        logger.error("Failed to parse question paper: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse question paper: {str(e)}",
        )

    # Store in Supabase
    db = get_supabase()
    exam_data = {
        "exam_name": exam_name,
        "subject": subject,
        "mode": mode,
        "question_paper_url": file_path,
        "questions_json": questions,
    }

    result = db.table("exams").insert(exam_data).execute()
    exam = result.data[0] if result.data else None

    if not exam:
        raise HTTPException(status_code=500, detail="Failed to create exam")

    return {
        "exam_id": exam["id"],
        "exam_name": exam_name,
        "mode": mode,
        "questions": questions,
        "total_max_marks": sum(q["max_marks"] for q in questions),
    }


@router.get("/{exam_id}")
async def get_exam(exam_id: str):
    """Get exam details by ID."""
    db = get_supabase()
    result = db.table("exams").select("*").eq("id", exam_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Exam not found")
    return result.data[0]


@router.get("/list/all")
async def list_exams():
    """List all exams."""
    db = get_supabase()
    result = (
        db.table("exams")
        .select("id, exam_name, subject, mode, created_at")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []
