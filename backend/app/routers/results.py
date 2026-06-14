"""
Results router — fetch evaluation results, reports, and per-student breakdowns.
"""
import logging
from fastapi import APIRouter, HTTPException
from app.db.supabase_client import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/exam", tags=["results"])


@router.get("/{exam_id}/results")
async def get_results(exam_id: str):
    """
    Get all student results for an exam.
    Returns students with ai_marks, teacher_marks (if any), deltas, flags.
    """
    db = get_supabase()

    # Verify exam exists
    exam_result = db.table("exams").select("*").eq("id", exam_id).execute()
    if not exam_result.data:
        raise HTTPException(status_code=404, detail="Exam not found")

    exam = exam_result.data[0]

    # Get all students
    students_result = (
        db.table("students")
        .select("*")
        .eq("exam_id", exam_id)
        .order("created_at")
        .execute()
    )

    students = students_result.data or []

    # Get question scores for each student
    enriched = []
    for student in students:
        scores_result = (
            db.table("question_scores")
            .select("*")
            .eq("student_row_id", student["id"])
            .execute()
        )
        enriched.append({
            **student,
            "question_scores": scores_result.data or [],
        })

    return {
        "exam": exam,
        "students": enriched,
    }


@router.get("/{exam_id}/results/{student_row_id}")
async def get_student_detail(exam_id: str, student_row_id: str):
    """Get detailed per-question breakdown for a single student."""
    db = get_supabase()

    student_result = (
        db.table("students")
        .select("*")
        .eq("id", student_row_id)
        .eq("exam_id", exam_id)
        .execute()
    )
    if not student_result.data:
        raise HTTPException(status_code=404, detail="Student not found")

    student = student_result.data[0]

    scores_result = (
        db.table("question_scores")
        .select("*")
        .eq("student_row_id", student_row_id)
        .execute()
    )

    return {
        **student,
        "question_scores": scores_result.data or [],
    }


@router.get("/{exam_id}/report")
async def get_report(exam_id: str):
    """Get the generated audit/summary report for an exam."""
    db = get_supabase()

    report_result = (
        db.table("audit_reports")
        .select("*")
        .eq("exam_id", exam_id)
        .order("generated_at", desc=True)
        .limit(1)
        .execute()
    )

    if not report_result.data:
        raise HTTPException(status_code=404, detail="No report found for this exam")

    return report_result.data[0]


@router.get("/{exam_id}/stats")
async def get_exam_stats(exam_id: str):
    """Get aggregated statistics for an exam (for charts)."""
    db = get_supabase()

    # Get exam
    exam_result = db.table("exams").select("*").eq("id", exam_id).execute()
    if not exam_result.data:
        raise HTTPException(status_code=404, detail="Exam not found")
    exam = exam_result.data[0]

    # Get students
    students_result = (
        db.table("students")
        .select("id, student_id, student_name, ai_total_marks, teacher_total_marks, delta, flagged, total_max_marks")
        .eq("exam_id", exam_id)
        .execute()
    )
    students = students_result.data or []

    # Get all question scores
    student_ids = [s["id"] for s in students]
    all_scores = []
    for sid in student_ids:
        scores = (
            db.table("question_scores")
            .select("q_no, max_marks, ai_marks, teacher_marks, delta")
            .eq("student_row_id", sid)
            .execute()
        )
        all_scores.extend(scores.data or [])

    # Per-question averages
    from collections import defaultdict
    q_data = defaultdict(lambda: {"ai": [], "teacher": [], "max_marks": 0})
    for score in all_scores:
        q = score["q_no"]
        q_data[q]["ai"].append(float(score.get("ai_marks", 0)))
        if score.get("teacher_marks") is not None:
            q_data[q]["teacher"].append(float(score["teacher_marks"]))
        q_data[q]["max_marks"] = float(score.get("max_marks", 0))

    question_stats = []
    for q_no, data in sorted(q_data.items()):
        ai_avg = sum(data["ai"]) / len(data["ai"]) if data["ai"] else 0
        teacher_avg = (
            sum(data["teacher"]) / len(data["teacher"]) if data["teacher"] else None
        )
        question_stats.append({
            "q_no": q_no,
            "max_marks": data["max_marks"],
            "ai_avg": round(ai_avg, 2),
            "teacher_avg": round(teacher_avg, 2) if teacher_avg is not None else None,
            "num_students": len(data["ai"]),
        })

    return {
        "exam": {
            "id": exam["id"],
            "exam_name": exam["exam_name"],
            "mode": exam["mode"],
            "subject": exam.get("subject", ""),
        },
        "students": students,
        "question_stats": question_stats,
        "total_students": len(students),
        "flagged_count": sum(1 for s in students if s.get("flagged")),
    }
