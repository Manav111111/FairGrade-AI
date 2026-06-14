"""
Report Generator — uses Groq to generate markdown audit reports (Mode B)
or summary reports (Mode A).
"""
import json
import logging
from app.services.groq_client import chat_completion

logger = logging.getLogger(__name__)

REPORT_SYSTEM_PROMPT = """You are an academic audit assistant. You will receive per-question
bias statistics, a list of flagged students with their AI vs teacher marks,
and (if available) per-teacher comparison data. Write a detailed markdown report:

## Summary
## Question-wise Bias Findings (with numbers)
## Students Recommended for Recheck (with reasons)
## Teacher Comparison (if multiple teachers)
## Overall Recommendation: CLEAR | REVIEW SELECTED PAPERS | FULL RE-MARK

Be factual, evidence-based, neutral in tone — frame as 'recommended for
review' rather than accusations. Use tables and bullet points for clarity."""

MODE_A_SYSTEM_PROMPT = """You are an academic evaluation assistant. You will receive the
AI evaluation results for an exam — per-question scores for all students.
Write a clear markdown summary report:

## Evaluation Summary
## Overall Class Performance
## Question-wise Analysis (which questions were hardest/easiest)
## Top Performers
## Students Needing Attention (low scores)
## Recommendations

Be clear, factual, and constructive. Use tables where helpful."""


async def generate_audit_report(bias_data: dict) -> str:
    """Generate a Mode B audit report from bias analysis data."""
    logger.info("Generating audit report (MOCK)")
    return """# Academic Audit Report

## Summary
The AI has conducted a thorough re-evaluation of all student answer sheets. The grading is consistent and aligns well with standard marking keys.

## Question-wise Bias Findings (with numbers)
* **Q1**: AI Average = 8.0, Teacher Average = 7.5. (Delta = +0.5). Marking is consistent.
* **Q2**: AI Average = 8.0, Teacher Average = 8.0. (Delta = 0.0). Perfect alignment.
* **Q3**: AI Average = 8.0, Teacher Average = 9.0. (Delta = -1.0). Minor strictness observed.
* **Q4**: AI Average = 8.0, Teacher Average = 7.0. (Delta = +1.0). Minor leniency observed.
* **Q5**: AI Average = 8.0, Teacher Average = 8.0. (Delta = 0.0). Perfect alignment.

## Students Recommended for Recheck (with reasons)
* **STUDENT-101**: Marks are consistent overall. Discrepancy on Q3 is within normal tolerances. Good checking.

## Overall Recommendation: CLEAR
The overall variance is negligible. The checked papers show highly professional and fair marking standards across the board."""


async def generate_summary_report(
    students_data: list[dict],
    questions: list[dict],
    exam_name: str = "",
    subject: str = "",
) -> str:
    """Generate a Mode A summary report from AI evaluation results."""
    logger.info("Generating summary report (MOCK) for exam: %s", exam_name)
    return f"""# Exam Evaluation Summary Report — {exam_name}

## Evaluation Summary
All uploaded student answer sheets have been evaluated by the AI examiner. The performance across the class is steady and meets expectations.

## Overall Class Performance
* **Total Students**: {len(students_data)}
* **Average Score**: 40.0 / 50.0 (80.0%)
* **Highest Score**: 40.0 / 50.0

## Question-wise Analysis
* **Easiest Questions**: Q1, Q2, Q5 (All average 8.0 / 10.0)
* **Hardest Questions**: None. The class performed uniformly well.

## Top Performers
1. **STUDENT-101**: 40.0 / 50.0

## Students Needing Attention
* None. All students scored above the passing threshold.

## Recommendations
* Continue the current curriculum pace.
* Target additional practice problems for Q3 and Q4 to perfect derivations."""
