"""
Bias Analyzer — NumPy/SciPy based statistical analysis for Mode B (Audit).
Compares AI marks vs teacher marks to detect systematic bias.
"""
import logging
from typing import Any
import numpy as np

logger = logging.getLogger(__name__)


def analyze_bias(
    students_data: list[dict],
    questions: list[dict],
) -> dict:
    """
    Analyze bias between AI and teacher marks.

    students_data: list of dicts, each with:
        - student_id: str
        - student_name: str
        - question_scores: list of dicts with q_no, ai_marks, teacher_marks, max_marks

    questions: list of dicts with q_no, max_marks

    Returns:
        {
            "per_question_bias": [...],
            "flagged_students": [...],
            "overall_stats": {...}
        }
    """
    per_question_bias = []
    flagged_students = []

    # ── Per-question analysis ──────────────────────────────────────────
    for q in questions:
        q_no = q["q_no"]
        max_marks = float(q["max_marks"])

        deltas = []
        for s in students_data:
            for qs in s.get("question_scores", []):
                if qs["q_no"] == q_no and qs.get("teacher_marks") is not None:
                    delta = float(qs["ai_marks"]) - float(qs["teacher_marks"])
                    deltas.append(delta)

        if not deltas:
            continue

        arr = np.array(deltas)
        avg_delta = float(np.mean(arr))
        variance = float(np.var(arr))
        std_dev = float(np.std(arr))
        cv = std_dev / max(abs(avg_delta), 0.001)  # coefficient of variation

        threshold = 0.15 * max_marks  # 15% of max marks

        bias_type = "NONE"
        bias_description = "No significant bias detected"

        if avg_delta > threshold:
            bias_type = "TEACHER_UNDER_MARKS"
            bias_description = (
                f"Teacher systematically UNDER-marks this question "
                f"(avg delta: +{avg_delta:.2f} out of {max_marks})"
            )
        elif avg_delta < -threshold:
            bias_type = "TEACHER_OVER_MARKS"
            bias_description = (
                f"Teacher systematically OVER-marks this question "
                f"(avg delta: {avg_delta:.2f} out of {max_marks})"
            )

        consistency = "CONSISTENT"
        if cv > 0.3 and len(deltas) > 2:
            consistency = "INCONSISTENT"
            bias_description += (
                f" | Teacher is INCONSISTENT on this question across students "
                f"(CV: {cv:.2f})"
            )

        per_question_bias.append({
            "q_no": q_no,
            "max_marks": max_marks,
            "avg_delta": round(avg_delta, 2),
            "variance": round(variance, 2),
            "std_dev": round(std_dev, 2),
            "cv": round(cv, 2),
            "num_students": len(deltas),
            "bias_type": bias_type,
            "consistency": consistency,
            "description": bias_description,
        })

    # ── Per-student flagging ───────────────────────────────────────────
    for s in students_data:
        total_ai = 0.0
        total_teacher = 0.0
        total_max = 0.0

        for qs in s.get("question_scores", []):
            if qs.get("teacher_marks") is not None:
                total_ai += float(qs["ai_marks"])
                total_teacher += float(qs["teacher_marks"])
                total_max += float(qs["max_marks"])

        if total_max == 0:
            continue

        total_delta = total_ai - total_teacher
        delta_pct = abs(total_delta) / total_max

        if delta_pct > 0.15:
            direction = "under-marked" if total_delta > 0 else "over-marked"
            flagged_students.append({
                "student_id": s.get("student_id", ""),
                "student_name": s.get("student_name", ""),
                "ai_total": round(total_ai, 2),
                "teacher_total": round(total_teacher, 2),
                "total_max": round(total_max, 2),
                "total_delta": round(total_delta, 2),
                "delta_pct": round(delta_pct * 100, 1),
                "direction": direction,
                "reason": (
                    f"Student appears {direction} by teacher — "
                    f"delta is {abs(total_delta):.1f}/{total_max:.0f} "
                    f"({delta_pct*100:.1f}%)"
                ),
            })

    # ── Overall statistics ─────────────────────────────────────────────
    all_ai_totals = []
    all_teacher_totals = []
    for s in students_data:
        ai_t = sum(float(qs["ai_marks"]) for qs in s.get("question_scores", []))
        teacher_t = sum(
            float(qs["teacher_marks"])
            for qs in s.get("question_scores", [])
            if qs.get("teacher_marks") is not None
        )
        all_ai_totals.append(ai_t)
        all_teacher_totals.append(teacher_t)

    overall: dict[str, Any] = {}
    if all_ai_totals and all_teacher_totals:
        ai_arr = np.array(all_ai_totals)
        teacher_arr = np.array(all_teacher_totals)
        overall = {
            "ai_mean": round(float(np.mean(ai_arr)), 2),
            "teacher_mean": round(float(np.mean(teacher_arr)), 2),
            "ai_std": round(float(np.std(ai_arr)), 2),
            "teacher_std": round(float(np.std(teacher_arr)), 2),
            "correlation": round(
                float(np.corrcoef(ai_arr, teacher_arr)[0, 1])
                if len(ai_arr) > 1 else 0.0,
                3,
            ),
            "total_students": len(students_data),
            "flagged_count": len(flagged_students),
        }

    return {
        "per_question_bias": per_question_bias,
        "flagged_students": flagged_students,
        "overall_stats": overall,
    }
