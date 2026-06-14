"""
Evaluate router — triggers the AI evaluation pipeline.
"""
import json
import logging
from fastapi import APIRouter, HTTPException
from app.db.supabase_client import get_supabase
from app.services.answer_extractor import extract_answers
from app.services.ai_examiner import score_answer
from app.services.bias_analyzer import analyze_bias
from app.services.report_generator import generate_audit_report, generate_summary_report

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/exam", tags=["evaluate"])


@router.post("/{exam_id}/run_evaluation")
async def run_evaluation(exam_id: str):
    """
    Run the full evaluation pipeline for an exam:
    1. For each student: extract answers (Gemini OCR)
    2. Score each answer (Groq AI Examiner)
    3. If AUDIT mode: compute deltas vs teacher marks
    4. Run bias analysis (AUDIT mode)
    5. Generate report
    """
    db = get_supabase()

    # Load exam
    exam_result = db.table("exams").select("*").eq("id", exam_id).execute()
    if not exam_result.data:
        raise HTTPException(status_code=404, detail="Exam not found")
    exam = exam_result.data[0]

    mode = exam["mode"]
    questions = exam.get("questions_json", [])
    subject = exam.get("subject", "")

    if not questions:
        raise HTTPException(status_code=400, detail="No questions found for this exam")

    # Load students
    students_result = (
        db.table("students")
        .select("*")
        .eq("exam_id", exam_id)
        .execute()
    )
    students = students_result.data or []

    if not students:
        raise HTTPException(status_code=400, detail="No students uploaded for this exam")

    # Load existing teacher marks (for AUDIT mode)
    teacher_marks_by_student = {}
    if mode == "AUDIT":
        for student in students:
            existing_scores = (
                db.table("question_scores")
                .select("q_no, teacher_marks")
                .eq("student_row_id", student["id"])
                .execute()
            )
            if existing_scores.data:
                teacher_marks_by_student[student["id"]] = {
                    row["q_no"]: row["teacher_marks"]
                    for row in existing_scores.data
                    if row.get("teacher_marks") is not None
                }

    all_students_data = []
    processed_count = 0

    for student in students:
        student_row_id = student["id"]
        file_path = student.get("answer_sheet_url", "")

        if not file_path:
            logger.warning("No answer sheet for student %s", student_row_id)
            continue

        # ── Step 1: Extract answers with Gemini OCR ────────────────────
        try:
            extraction = await extract_answers(file_path)
            answers = extraction.get("answers", [])
            extracted_student_id = extraction.get("student_id")

            # Update student_id if extracted
            update_data = {"extracted_text": json.dumps(answers)}
            if extracted_student_id and not student.get("student_id"):
                update_data["student_id"] = extracted_student_id

            db.table("students").update(update_data).eq("id", student_row_id).execute()

        except Exception as e:
            logger.error("OCR failed for student %s: %s", student_row_id, str(e))
            continue

        # Build answer lookup
        answer_map = {a["q_no"]: a["answer_text"] for a in answers}

        # Get teacher marks for this student (AUDIT mode)
        student_teacher_marks = teacher_marks_by_student.get(student_row_id, {})
        # Also check if teacher_total_marks is set
        if mode == "AUDIT" and student.get("teacher_total_marks") is not None:
            # Teacher marks might have been uploaded but not yet in question_scores
            pass

        # ── Step 2: Score each question ────────────────────────────────
        question_scores_data = []
        ai_total = 0.0

        for q in questions:
            q_no = q["q_no"]
            max_marks = float(q["max_marks"])
            answer_text = answer_map.get(q_no, "")

            if not answer_text:
                # Try flexible matching (Q1 vs 1, etc.)
                for key in answer_map:
                    normalized_key = key.replace("Q", "").replace("q", "").strip()
                    normalized_qno = q_no.replace("Q", "").replace("q", "").strip()
                    if normalized_key == normalized_qno:
                        answer_text = answer_map[key]
                        break

            # Score with AI
            try:
                score_result = await score_answer(
                    question_text=q["question_text"],
                    max_marks=max_marks,
                    answer_text=answer_text if answer_text else "(No answer provided)",
                    subject=subject,
                )
            except Exception as e:
                logger.error(
                    "Scoring failed for student %s, question %s: %s",
                    student_row_id, q_no, str(e),
                )
                score_result = {
                    "marks_awarded": 0,
                    "max_marks": max_marks,
                    "key_points_covered": [],
                    "key_points_missing": ["Scoring failed"],
                    "reasoning": f"Error during scoring: {str(e)}",
                }

            ai_marks = float(score_result["marks_awarded"])
            ai_total += ai_marks

            # Calculate delta for AUDIT mode
            teacher_marks = student_teacher_marks.get(q_no)
            delta = None
            if teacher_marks is not None:
                delta = round(ai_marks - float(teacher_marks), 2)

            score_row = {
                "student_row_id": student_row_id,
                "q_no": q_no,
                "max_marks": max_marks,
                "ai_marks": ai_marks,
                "teacher_marks": teacher_marks,
                "delta": delta,
                "key_points_covered": score_result.get("key_points_covered", []),
                "key_points_missing": score_result.get("key_points_missing", []),
                "reasoning": score_result.get("reasoning", ""),
            }

            # Upsert question score
            db.table("question_scores").insert(score_row).execute()
            question_scores_data.append(score_row)

        # ── Step 3: Update student totals ──────────────────────────────
        teacher_total = student.get("teacher_total_marks")
        total_delta = None
        flagged = False

        if mode == "AUDIT" and teacher_total is not None:
            total_delta = round(ai_total - teacher_total, 2)
            total_max = sum(float(q["max_marks"]) for q in questions)
            if total_max > 0 and abs(total_delta) / total_max > 0.15:
                flagged = True

        db.table("students").update({
            "ai_total_marks": round(ai_total, 2),
            "delta": total_delta,
            "flagged": flagged,
        }).eq("id", student_row_id).execute()

        all_students_data.append({
            "student_id": student.get("student_id", ""),
            "student_name": student.get("student_name", ""),
            "question_scores": question_scores_data,
        })

        processed_count += 1
        logger.info("Processed student %d/%d", processed_count, len(students))

    # ── Step 4: Bias analysis + Report generation ──────────────────────
    report_markdown = ""
    bias_summary = None

    if mode == "AUDIT" and all_students_data:
        bias_data = analyze_bias(all_students_data, questions)
        bias_summary = bias_data

        try:
            report_markdown = await generate_audit_report(bias_data)
        except Exception as e:
            logger.error("Report generation failed: %s", str(e))
            report_markdown = f"## Report Generation Error\n\n{str(e)}"

        # Save audit report
        db.table("audit_reports").insert({
            "exam_id": exam_id,
            "report_markdown": report_markdown,
            "bias_summary": bias_summary,
            "flagged_students": bias_data.get("flagged_students", []),
        }).execute()

    elif mode == "AI_ONLY" and all_students_data:
        try:
            # Simplify data for report
            summary_data = []
            for s in all_students_data:
                total_ai = sum(
                    float(qs["ai_marks"]) for qs in s["question_scores"]
                )
                summary_data.append({
                    "student_id": s["student_id"],
                    "student_name": s["student_name"],
                    "total_marks": round(total_ai, 2),
                    "per_question": [
                        {"q_no": qs["q_no"], "marks": qs["ai_marks"], "max": qs["max_marks"]}
                        for qs in s["question_scores"]
                    ],
                })

            report_markdown = await generate_summary_report(
                summary_data, questions, exam.get("exam_name", ""), subject
            )
        except Exception as e:
            logger.error("Summary report generation failed: %s", str(e))
            report_markdown = f"## Report Generation Error\n\n{str(e)}"

        db.table("audit_reports").insert({
            "exam_id": exam_id,
            "report_markdown": report_markdown,
            "bias_summary": None,
            "flagged_students": None,
        }).execute()

    return {
        "status": "completed",
        "exam_id": exam_id,
        "mode": mode,
        "processed_students": processed_count,
        "total_students": len(students),
        "report_generated": bool(report_markdown),
    }
