/**
 * API client for communicating with the FastAPI backend.
 */

/**
 * Mock API client for running FairGrade AI client-side statically.
 */

// Helper function to safely read from localStorage
function getExamsDB(): Record<string, any> {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem("fairgrade_exams_db");
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("Failed to parse exams DB", e);
    return {};
  }
}

// Helper function to safely write to localStorage
function saveExamsDB(db: Record<string, any>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("fairgrade_exams_db", JSON.stringify(db));
  } catch (e) {
    console.error("Failed to save exams DB", e);
  }
}

// Helper to simulate delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_QUESTIONS = [
  { q_no: "Q1", question_text: "Describe the fundamental principles of the subject.", max_marks: 10 },
  { q_no: "Q2", question_text: "Solve the primary problem step-by-step.", max_marks: 10 },
  { q_no: "Q3", question_text: "Analyze the critical cases and edge cases.", max_marks: 10 },
  { q_no: "Q4", question_text: "Derive the core formula or mechanism.", max_marks: 10 },
  { q_no: "Q5", question_text: "Discuss practical applications and limitations.", max_marks: 10 },
];

export async function createExam(formData: FormData) {
  await delay(800); // simulate network request

  const exam_name = (formData.get("exam_name") as string) || "Mock Exam";
  const subject = (formData.get("subject") as string) || "General Subject";
  const mode = (formData.get("mode") as string) || "AI_ONLY";

  const exam_id = "exam_" + Math.random().toString(36).substring(2, 9);

  const db = getExamsDB();
  db[exam_id] = {
    id: exam_id,
    exam_name,
    subject,
    mode,
    created_at: new Date().toISOString(),
    questions: MOCK_QUESTIONS,
    students: [],
    report: null,
  };
  saveExamsDB(db);

  return {
    exam_id,
    exam_name,
    mode,
    questions: MOCK_QUESTIONS,
    total_max_marks: 50,
  };
}

export async function getExam(examId: string) {
  await delay(300);
  const db = getExamsDB();
  const exam = db[examId];
  if (!exam) {
    throw new Error(`Exam ${examId} not found`);
  }
  return {
    id: exam.id,
    exam_name: exam.exam_name,
    subject: exam.subject,
    mode: exam.mode,
    questions_json: exam.questions,
    created_at: exam.created_at,
  };
}

export async function listExams() {
  await delay(400);
  const db = getExamsDB();
  return Object.values(db).map((exam: any) => ({
    id: exam.id,
    exam_name: exam.exam_name,
    subject: exam.subject,
    mode: exam.mode,
    created_at: exam.created_at,
  }));
}

export async function uploadStudent(examId: string, formData: FormData) {
  await delay(600);
  const db = getExamsDB();
  const exam = db[examId];
  if (!exam) {
    throw new Error(`Exam ${examId} not found`);
  }

  const student_name = (formData.get("student_name") as string) || "Unknown Student";
  const student_id = (formData.get("student_id") as string) || "N/A";
  const teacher_marks_json = formData.get("teacher_marks_json") as string | null;

  let teacher_marks: Record<string, number> | null = null;
  if (teacher_marks_json) {
    try {
      const marksArray = JSON.parse(teacher_marks_json);
      teacher_marks = {};
      if (Array.isArray(marksArray)) {
        marksArray.forEach((item: any) => {
          teacher_marks![item.q_no] = parseFloat(item.marks || "0");
        });
      }
    } catch (e) {
      console.error("Failed to parse teacher marks JSON", e);
    }
  }

  const student_row_id = "student_" + Math.random().toString(36).substring(2, 9);

  const newStudent = {
    student_row_id,
    student_id,
    student_name,
    exam_id: examId,
    teacher_marks,
    ai_marks: null,
    question_scores: null,
    ai_total_marks: null,
    teacher_total_marks: null,
    flagged: false,
  };

  exam.students.push(newStudent);
  saveExamsDB(db);

  return {
    student_row_id,
    student_id,
    student_name,
    exam_id: examId,
    teacher_marks,
  };
}

export async function uploadBulk(examId: string, formData: FormData) {
  await delay(1000);
  const names = ["Alice Smith", "Bob Jones", "Charlie Brown"];
  const studentsAdded = [];

  const db = getExamsDB();
  const exam = db[examId];
  if (!exam) {
    throw new Error(`Exam ${examId} not found`);
  }

  for (let i = 0; i < names.length; i++) {
    const student_row_id = "student_" + Math.random().toString(36).substring(2, 9);
    const newStudent = {
      student_row_id,
      student_id: `CS-2026-${100 + i}`,
      student_name: names[i],
      exam_id: examId,
      teacher_marks: exam.mode === "AUDIT" ? { Q1: 8, Q2: 7, Q3: 9, Q4: 8, Q5: 7 } : null,
      ai_marks: null,
      question_scores: null,
      ai_total_marks: null,
      teacher_total_marks: null,
      flagged: false,
    };
    exam.students.push(newStudent);
    studentsAdded.push({ student_row_id, student_name: names[i] });
  }

  saveExamsDB(db);

  return {
    uploaded_count: names.length,
    students: studentsAdded,
  };
}

export async function runEvaluation(examId: string) {
  // Simulate 35 seconds checking delay as requested by the user
  await new Promise((resolve) => setTimeout(resolve, 35000));

  const db = getExamsDB();
  const exam = db[examId];
  if (!exam) {
    throw new Error(`Exam ${examId} not found`);
  }

  const isAudit = exam.mode === "AUDIT";

  // Process each student
  exam.students = exam.students.map((student: any) => {
    let ai_total = 0;
    let teacher_total = 0;
    const question_scores = exam.questions.map((q: any) => {
      let teacher_val = null;
      if (student.teacher_marks && student.teacher_marks[q.q_no] !== undefined) {
        teacher_val = student.teacher_marks[q.q_no];
        teacher_total += teacher_val;
      }

      // Generate a realistic AI mark
      let ai_val = 0;
      if (isAudit && teacher_val !== null) {
        // Audit mode: AI is mostly close to teacher, but we flag some discrepancies
        // Let's create a big gap for specific students to show "Flagged" status
        const isFlaggedStudent =
          student.student_name.toLowerCase().includes("doe") ||
          student.student_name.toLowerCase().includes("john") ||
          student.student_id === "CS2026-042";

        if (isFlaggedStudent && (q.q_no === "Q3" || q.q_no === "Q4")) {
          // Significant grading gap
          ai_val = Math.max(0, teacher_val - 4.5);
        } else {
          // Normal close marks
          const diffOptions = [-1, -0.5, 0, 0.5, 1];
          const diff = diffOptions[Math.floor(Math.random() * diffOptions.length)];
          ai_val = Math.max(0, Math.min(q.max_marks, teacher_val + diff));
        }
      } else {
        // AI-Only mode: random good scores
        ai_val = 6.0 + Math.random() * 3.5;
        // round to nearest 0.5
        ai_val = Math.round(ai_val * 2) / 2;
      }

      ai_total += ai_val;
      const delta = isAudit && teacher_val !== null ? ai_val - teacher_val : null;

      // Reasoning generation
      let reasoning = "";
      let key_points_covered: string[] = [];
      let key_points_missing: string[] = [];

      if (ai_val >= 8.5) {
        reasoning = `Excellent analysis. The student presents a complete solution displaying deep conceptual insight. Key derivations are clearly stated and justified with correct terminology.`;
        key_points_covered = ["Correct formulas and variables", "Full analytical derivation", "Logical conclusion"];
      } else if (ai_val >= 6.5) {
        reasoning = `Good response. The core concepts are correctly identified and applied. There is minor mathematical imprecision, and a few intermediate steps in the explanation were skipped.`;
        key_points_covered = ["Correct formulas and variables", "Clear final result"];
        key_points_missing = ["Step-by-step mathematical details"];
      } else {
        reasoning = `The answer is incomplete and contains several conceptual flaws. While the starting equations are correct, the algebraic derivation contains errors and the conclusion lacks basis.`;
        key_points_covered = ["Correct formulas and variables"];
        key_points_missing = ["Accurate mathematical derivation", "Clear final result", "Conceptual justification"];
      }

      return {
        q_no: q.q_no,
        max_marks: q.max_marks,
        ai_marks: ai_val,
        teacher_marks: teacher_val,
        delta,
        key_points_covered,
        key_points_missing,
        reasoning,
      };
    });

    const student_delta = isAudit ? ai_total - teacher_total : null;
    const flagged = isAudit ? Math.abs(student_delta || 0) >= 3.0 : false;

    return {
      ...student,
      ai_marks: question_scores.reduce((acc: any, curr: any) => {
        acc[curr.q_no] = curr.ai_marks;
        return acc;
      }, {}),
      question_scores,
      ai_total_marks: ai_total,
      teacher_total_marks: isAudit ? teacher_total : null,
      delta: student_delta,
      flagged,
    };
  });

  // Generate mock report
  const flagged_students = exam.students
    .filter((s: any) => s.flagged)
    .map((s: any) => ({
      student_name: s.student_name,
      student_id: s.student_id,
      reason: `Systematic grading difference of ${(s.delta || 0).toFixed(1)} marks. AI was more strict on step-by-step proofs.`,
    }));

  const generated_at = new Date().toISOString();
  let report_markdown = `# FairGrade AI - Grading Audit Report\n\n`;
  report_markdown += `Generated: **${new Date(generated_at).toLocaleString()}**\n`;
  report_markdown += `Subject: **${exam.subject || "N/A"}** | Mode: **${exam.mode === "AUDIT" ? "Audit vs Teacher" : "AI Only"}**\n\n`;

  report_markdown += `## Executive Summary\n`;
  if (isAudit) {
    report_markdown += `An independent evaluation was performed across **${exam.students.length}** answer sheets. \n\n`;
    report_markdown += `| Metric | Count / Value |\n`;
    report_markdown += `| :--- | :--- |\n`;
    report_markdown += `| Total Audited Students | ${exam.students.length} |\n`;
    report_markdown += `| Flagged for Manual Review | ${flagged_students.length} |\n`;
    report_markdown += `| Average Discrepancy (AI - Teacher) | ${(exam.students.reduce((acc: number, s: any) => acc + (s.delta || 0), 0) / exam.students.length).toFixed(2)} marks |\n\n`;

    report_markdown += `### Detected Anomalies\n`;
    if (flagged_students.length > 0) {
      report_markdown += `The following students exhibited grading disparities exceeding the 3.0 mark threshold:\n\n`;
      flagged_students.forEach((fs: any) => {
        report_markdown += `- **${fs.student_name}** (${fs.student_id}): ${fs.reason}\n`;
      });
    } else {
      report_markdown += `No critical grading standard anomalies were detected. Teacher grading and AI evaluation are well-aligned.\n`;
    }
  } else {
    const avg = exam.students.reduce((acc: number, s: any) => acc + (s.ai_total_marks || 0), 0) / exam.students.length;
    report_markdown += `All **${exam.students.length}** student answer sheets have been fully evaluated by the AI examiner.\n\n`;
    report_markdown += `| Metric | Value |\n`;
    report_markdown += `| :--- | :--- |\n`;
    report_markdown += `| Class Average | ${avg.toFixed(1)} / 50 |\n`;
    report_markdown += `| Highest Grade | ${Math.max(...exam.students.map((s: any) => s.ai_total_marks || 0)).toFixed(1)} |\n`;
    report_markdown += `| Lowest Grade | ${Math.min(...exam.students.map((s: any) => s.ai_total_marks || 0)).toFixed(1)} |\n`;
  }

  report_markdown += `\n## Question-Level Insights\n`;
  report_markdown += `Analyzing average performance per question to pinpoint key areas of strength and weakness:\n\n`;
  report_markdown += `| Question | Max Marks | AI Average | ${isAudit ? "Teacher Average | Delta |" : ""}\n`;
  report_markdown += `| :--- | :---: | :---: | ${isAudit ? ":---: | :---: |" : ""}\n`;

  exam.questions.forEach((q: any) => {
    const ai_avg = exam.students.reduce((acc: number, s: any) => acc + (s.ai_marks?.[q.q_no] || 0), 0) / exam.students.length;
    if (isAudit) {
      const teacher_avg = exam.students.reduce((acc: number, s: any) => acc + (s.teacher_marks?.[q.q_no] || 0), 0) / exam.students.length;
      const q_delta = ai_avg - teacher_avg;
      report_markdown += `| **${q.q_no}** | ${q.max_marks} | ${ai_avg.toFixed(1)} | ${teacher_avg.toFixed(1)} | ${q_delta > 0 ? "+" : ""}${q_delta.toFixed(1)} |\n`;
    } else {
      report_markdown += `| **${q.q_no}** | ${q.max_marks} | ${ai_avg.toFixed(1)} |\n`;
    }
  });

  report_markdown += `\n## Recommendations\n`;
  if (isAudit && flagged_students.length > 0) {
    report_markdown += `1. **Review Flagged Students**: Re-evaluate the specific pages for flagged students to ensure correct allocation of marks.\n`;
    report_markdown += `2. **Address Systematic Shifts**: Check if grading guidelines for Q3 and Q4 need correction or standardization.\n`;
  } else {
    report_markdown += `1. **Target Weak Areas**: Based on question-level averages, student understanding was lowest on Q4 and Q5. Consider conducting a review session on these topics.\n`;
    report_markdown += `2. **Encourage Detailed Steps**: Students who scored lower often missed intermediate derivation stages. Remind them to show complete workings.\n`;
  }

  exam.report = {
    report_markdown,
    bias_summary: isAudit ? { flagged_count: flagged_students.length } : null,
    flagged_students,
    generated_at,
  };

  saveExamsDB(db);

  return {
    status: "completed",
    exam_id: examId,
    mode: exam.mode,
    processed_students: exam.students.length,
    total_students: exam.students.length,
    report_generated: true,
  };
}

export async function getResults(examId: string) {
  await delay(500);
  const db = getExamsDB();
  const exam = db[examId];
  if (!exam) {
    throw new Error(`Exam ${examId} not found`);
  }

  return {
    exam: {
      id: exam.id,
      exam_name: exam.exam_name,
      subject: exam.subject,
      mode: exam.mode,
      created_at: exam.created_at,
    },
    students: exam.students.map((s: any) => ({
      id: s.student_row_id,
      student_id: s.student_id,
      student_name: s.student_name,
      ai_total_marks: s.ai_total_marks,
      teacher_total_marks: s.teacher_total_marks,
      total_max_marks: 50,
      delta: s.delta,
      flagged: s.flagged,
      question_scores: s.question_scores,
    })),
  };
}

export async function getStudentDetail(examId: string, studentRowId: string) {
  await delay(300);
  const db = getExamsDB();
  const exam = db[examId];
  if (!exam) {
    throw new Error(`Exam ${examId} not found`);
  }

  const student = exam.students.find((s: any) => s.student_row_id === studentRowId);
  if (!student) {
    throw new Error(`Student ${studentRowId} not found`);
  }

  return {
    id: student.student_row_id,
    student_id: student.student_id,
    student_name: student.student_name,
    ai_total_marks: student.ai_total_marks,
    teacher_total_marks: student.teacher_total_marks,
    total_max_marks: 50,
    delta: student.delta,
    flagged: student.flagged,
    question_scores: student.question_scores,
  };
}

export async function getReport(examId: string) {
  await delay(400);
  const db = getExamsDB();
  const exam = db[examId];
  if (!exam) {
    throw new Error(`Exam ${examId} not found`);
  }
  if (!exam.report) {
    throw new Error(`Report not generated for exam ${examId}`);
  }

  return {
    id: "report_" + examId,
    exam_id: examId,
    report_markdown: exam.report.report_markdown,
    bias_summary: exam.report.bias_summary,
    flagged_students: exam.report.flagged_students,
    generated_at: exam.report.generated_at,
  };
}

export async function getExamStats(examId: string) {
  await delay(400);
  const db = getExamsDB();
  const exam = db[examId];
  if (!exam) {
    throw new Error(`Exam ${examId} not found`);
  }

  const num_students = exam.students.length;
  const question_stats = exam.questions.map((q: any) => {
    let ai_sum = 0;
    let teacher_sum = 0;
    let has_teacher = false;

    exam.students.forEach((s: any) => {
      ai_sum += s.ai_marks?.[q.q_no] || 0;
      if (s.teacher_marks && s.teacher_marks[q.q_no] !== undefined) {
        teacher_sum += s.teacher_marks[q.q_no];
        has_teacher = true;
      }
    });

    return {
      q_no: q.q_no,
      max_marks: q.max_marks,
      ai_avg: num_students > 0 ? +(ai_sum / num_students).toFixed(2) : 0,
      teacher_avg: num_students > 0 && has_teacher ? +(teacher_sum / num_students).toFixed(2) : null,
      num_students,
    };
  });

  const flagged_count = exam.students.filter((s: any) => s.flagged).length;

  return {
    exam: {
      id: exam.id,
      exam_name: exam.exam_name,
      subject: exam.subject,
      mode: exam.mode,
    },
    question_stats,
    total_students: num_students,
    flagged_count,
  };
}

