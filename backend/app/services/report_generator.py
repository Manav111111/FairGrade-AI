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
    user_prompt = f"""Here is the bias analysis data for this exam:

Per-Question Bias:
{json.dumps(bias_data.get('per_question_bias', []), indent=2)}

Flagged Students:
{json.dumps(bias_data.get('flagged_students', []), indent=2)}

Overall Statistics:
{json.dumps(bias_data.get('overall_stats', {}), indent=2)}

Please generate a comprehensive audit report based on this data."""

    logger.info("Generating audit report")
    report = await chat_completion(
        system_prompt=REPORT_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        temperature=0.3,
        max_tokens=4096,
        expect_json=False,
    )
    return str(report)


async def generate_summary_report(
    students_data: list[dict],
    questions: list[dict],
    exam_name: str = "",
    subject: str = "",
) -> str:
    """Generate a Mode A summary report from AI evaluation results."""
    user_prompt = f"""Exam: {exam_name}
Subject: {subject}

Questions:
{json.dumps(questions, indent=2)}

Student Results:
{json.dumps(students_data, indent=2)}

Please generate a comprehensive evaluation summary report."""

    logger.info("Generating summary report for exam: %s", exam_name)
    report = await chat_completion(
        system_prompt=MODE_A_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        temperature=0.3,
        max_tokens=4096,
        expect_json=False,
    )
    return str(report)
