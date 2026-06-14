"""
Upload router — upload student answer sheets (and teacher marks for AUDIT mode).
"""
import os
import uuid
import json
import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.db.supabase_client import get_supabase
from app.config import UPLOAD_DIR

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/exam", tags=["upload"])


@router.post("/{exam_id}/upload_student")
async def upload_student(
    exam_id: str,
    student_id: str = Form(""),
    student_name: str = Form(""),
    answer_sheet: UploadFile = File(...),
    teacher_marks_json: str = Form(""),  # JSON string, only for AUDIT mode
):
    """
    Upload a single student's answer sheet.
    For AUDIT mode, also accepts teacher_marks_json:
        [{"q_no": "Q1", "marks": 4}, {"q_no": "Q2", "marks": 8}]
    """
    # Verify exam exists
    db = get_supabase()
    exam_result = db.table("exams").select("*").eq("id", exam_id).execute()
    if not exam_result.data:
        raise HTTPException(status_code=404, detail="Exam not found")

    exam = exam_result.data[0]

    # Save uploaded file
    file_ext = os.path.splitext(answer_sheet.filename or "file.pdf")[1]
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"ans_{file_id}{file_ext}")

    content = await answer_sheet.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Calculate total max marks from questions
    questions = exam.get("questions_json", [])
    total_max_marks = sum(float(q.get("max_marks", 0)) for q in questions)

    # Parse teacher marks if provided (AUDIT mode)
    teacher_total = None
    teacher_marks_map = {}
    if teacher_marks_json and exam["mode"] == "AUDIT":
        try:
            teacher_marks = json.loads(teacher_marks_json)
            teacher_marks_map = {
                str(tm["q_no"]): float(tm["marks"]) for tm in teacher_marks
            }
            teacher_total = sum(teacher_marks_map.values())
        except (json.JSONDecodeError, KeyError) as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid teacher_marks_json format: {str(e)}",
            )

    # Store student row
    student_data = {
        "exam_id": exam_id,
        "student_id": student_id or None,
        "student_name": student_name or None,
        "answer_sheet_url": file_path,
        "total_max_marks": total_max_marks,
        "teacher_total_marks": teacher_total,
    }

    result = db.table("students").insert(student_data).execute()
    student = result.data[0] if result.data else None

    if not student:
        raise HTTPException(status_code=500, detail="Failed to store student")

    # For AUDIT mode: persist per-question teacher marks into question_scores now,
    # so the evaluation pipeline can read them during delta calculation.
    if teacher_marks_map and exam["mode"] == "AUDIT":
        questions = exam.get("questions_json", [])
        score_rows = []
        for q in questions:
            q_no = str(q.get("q_no", ""))
            if q_no in teacher_marks_map:
                score_rows.append({
                    "student_row_id": student["id"],
                    "q_no": q_no,
                    "max_marks": float(q.get("max_marks", 0)),
                    "teacher_marks": teacher_marks_map[q_no],
                })
        if score_rows:
            db.table("question_scores").insert(score_rows).execute()

    return {
        "student_row_id": student["id"],
        "student_id": student_id,
        "student_name": student_name,
        "exam_id": exam_id,
        "teacher_marks": teacher_marks_map if teacher_marks_map else None,
    }


@router.post("/{exam_id}/upload_bulk")
async def upload_bulk(
    exam_id: str,
    answer_sheets: list[UploadFile] = File(...),
):
    """
    Upload multiple student answer sheets at once (Mode A convenience).
    Student IDs/names will be extracted from sheets during evaluation.
    """
    db = get_supabase()
    exam_result = db.table("exams").select("*").eq("id", exam_id).execute()
    if not exam_result.data:
        raise HTTPException(status_code=404, detail="Exam not found")

    exam = exam_result.data[0]
    questions = exam.get("questions_json", [])
    total_max_marks = sum(float(q.get("max_marks", 0)) for q in questions)

    uploaded = []
    for sheet in answer_sheets:
        file_ext = os.path.splitext(sheet.filename or "file.pdf")[1]
        file_id = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_DIR, f"ans_{file_id}{file_ext}")

        content = await sheet.read()
        with open(file_path, "wb") as f:
            f.write(content)

        student_data = {
            "exam_id": exam_id,
            "student_name": os.path.splitext(sheet.filename or "Unknown")[0],
            "answer_sheet_url": file_path,
            "total_max_marks": total_max_marks,
        }

        result = db.table("students").insert(student_data).execute()
        if result.data:
            uploaded.append(result.data[0])

    return {
        "uploaded_count": len(uploaded),
        "students": [
            {"student_row_id": s["id"], "student_name": s.get("student_name")}
            for s in uploaded
        ],
    }
