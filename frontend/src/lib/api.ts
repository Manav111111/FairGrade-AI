/**
 * Mock API client that runs entirely in the browser using localStorage.
 * This removes the backend dependency completely and runs 100% statically.
 */

// Helper keys for localStorage
const EXAMS_KEY = "fairgrade_exams";
const STUDENTS_KEY = "fairgrade_students";
const SCORES_KEY = "fairgrade_scores";
const REPORTS_KEY = "fairgrade_reports";

// Local helper to wait
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Retrieve data from localStorage
function getExams(): any[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(EXAMS_KEY) || "[]");
}

function setExams(exams: any[]) {
  localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
}

function getStudents(): any[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(STUDENTS_KEY) || "[]");
}

function setStudents(students: any[]) {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

function getScores(): any[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(SCORES_KEY) || "[]");
}

function setScores(scores: any[]) {
  localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
}

function getReports(): any[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(REPORTS_KEY) || "[]");
}

function setReports(reports: any[]) {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

const MOCK_QUESTIONS = [
  { q_no: "Q1", question_text: "Describe the main principles of thermodynamics.", max_marks: 10.0 },
  { q_no: "Q2", question_text: "Solve the wave equation under given boundary conditions.", max_marks: 10.0 },
  { q_no: "Q3", question_text: "Explain the concept of quantum superposition.", max_marks: 10.0 },
  { q_no: "Q4", question_text: "What is the difference between nuclear fission and fusion?", max_marks: 10.0 },
  { q_no: "Q5", question_text: "Derive the speed of sound in an ideal gas.", max_marks: 10.0 }
];

// ── Exam endpoints ────────────────────────────────────────────────
export async function createExam(formData: FormData) {
  await delay(800); // Small delay to feel realistic
  const examName = formData.get("exam_name") as string;
  const subject = (formData.get("subject") as string) || "";
  const mode = formData.get("mode") as string;

  const examId = "exam_" + Math.random().toString(36).substring(2, 9);
  
  const newExam = {
    id: examId,
    exam_name: examName,
    subject: subject,
    mode: mode,
    questions_json: MOCK_QUESTIONS,
    created_at: new Date().toISOString(),
  };

  const currentExams = getExams();
  currentExams.unshift(newExam);
  setExams(currentExams);

  return {
    exam_id: examId,
    exam_name: examName,
    mode: mode,
    questions: MOCK_QUESTIONS,
    total_max_marks: 50.0,
  };
}

export async function getExam(examId: string) {
  await delay(300);
  const exam = getExams().find((e) => e.id === examId);
  if (!exam) throw new Error("Exam not found");
  return exam;
}

export async function listExams() {
  await delay(400);
  return getExams();
}

// ── Upload endpoints ──────────────────────────────────────────────
export async function uploadStudent(examId: string, formData: FormData) {
  await delay(600);
  const studentName = formData.get("student_name") as string;
  const studentId = (formData.get("student_id") as string) || "N/A";
  const teacherMarksJson = formData.get("teacher_marks_json") as string;

  const studentRowId = "student_" + Math.random().toString(36).substring(2, 9);

  let teacherMarksMap: Record<string, number> = {};
  if (teacherMarksJson) {
    const arr = JSON.parse(teacherMarksJson);
    arr.forEach((item: { q_no: string; marks: number }) => {
      teacherMarksMap[item.q_no] = item.marks;
    });
  }

  // Pre-save teacher marks in Scores db
  const currentScores = getScores();
  MOCK_QUESTIONS.forEach((q) => {
    currentScores.push({
      id: "score_" + Math.random().toString(36).substring(2, 9),
      student_row_id: studentRowId,
      q_no: q.q_no,
      max_marks: q.max_marks,
      ai_marks: 0.0, // populated on run_evaluation
      teacher_marks: teacherMarksJson ? (teacherMarksMap[q.q_no] ?? 0.0) : null,
      delta: null,
      key_points_covered: [],
      key_points_missing: [],
      reasoning: "",
    });
  });
  setScores(currentScores);

  const newStudent = {
    id: studentRowId,
    exam_id: examId,
    student_id: studentId,
    student_name: studentName,
    answer_sheet_url: "mock_file.pdf",
    extracted_text: "",
    total_max_marks: 50.0,
    ai_total_marks: 0.0,
    teacher_total_marks: teacherMarksJson ? Object.values(teacherMarksMap).reduce((a, b) => a + b, 0) : null,
    delta: null,
    flagged: false,
    created_at: new Date().toISOString(),
  };

  const currentStudents = getStudents();
  currentStudents.push(newStudent);
  setStudents(currentStudents);

  return {
    student_row_id: studentRowId,
    student_id: studentId,
    student_name: studentName,
    exam_id: examId,
    teacher_marks: teacherMarksJson ? teacherMarksMap : null,
  };
}

export async function uploadBulk(examId: string, formData: FormData) {
  // Not used in unified layout, but implemented for compatibility
  await delay(1000);
  return {
    uploaded_count: 0,
    students: [],
  };
}

// ── Evaluation endpoints ──────────────────────────────────────────
export async function runEvaluation(examId: string) {
  // Simulate checking delay of 35 seconds minimum as requested by the user
  await delay(35000);

  const exam = getExams().find((e) => e.id === examId);
  if (!exam) throw new Error("Exam not found");

  const studentsList = getStudents().filter((s) => s.exam_id === examId);
  const currentScores = getScores();
  const allUpdatedStudents: any[] = [];

  studentsList.forEach((s) => {
    let aiTotal = 0.0;
    
    // Update question scores for this student
    const studentScores = currentScores.filter((sc) => sc.student_row_id === s.id);
    studentScores.forEach((sc) => {
      // 8/10 score on each question (80%)
      const score = 8.0; 
      sc.ai_marks = score;
      aiTotal += score;

      if (sc.teacher_marks !== null) {
        sc.delta = parseFloat((score - sc.teacher_marks).toFixed(1));
      }

      sc.key_points_covered = [
        "Core concepts explained clearly.",
        "Main formulas and derivations included.",
        "Accurate explanations with appropriate terminology."
      ];
      sc.key_points_missing = [
        "Minor detail in explanation could be more elaborate."
      ];
      sc.reasoning = "Good checking. The answer covers the core concepts and calculations properly, showing solid subject knowledge.";
    });

    // Update student totals
    s.ai_total_marks = aiTotal;
    if (s.teacher_total_marks !== null) {
      s.delta = parseFloat((aiTotal - s.teacher_total_marks).toFixed(1));
      // Flag if delta exceeds 15% of max marks (7.5 marks)
      s.flagged = Math.abs(s.delta) > 7.5;
    }

    allUpdatedStudents.push(s);
  });

  // Save updated scores and students back to local storage
  const otherScores = getScores().filter((sc) => !studentsList.map(s => s.id).includes(sc.student_row_id));
  setScores([...otherScores, ...currentScores.filter((sc) => studentsList.map(s => s.id).includes(sc.student_row_id))]);

  const otherStudents = getStudents().filter((s) => s.exam_id !== examId);
  setStudents([...otherStudents, ...allUpdatedStudents]);

  // Generate Report Markdown
  const reportId = "report_" + Math.random().toString(36).substring(2, 9);
  let reportMarkdown = "";

  if (exam.mode === "AUDIT") {
    reportMarkdown = `# Academic Audit Report — ${exam.exam_name}

## Summary
The AI has completed the rechecking process. The student scores were evaluated and compared against the teacher's grading. The average AI score is **40.0 / 50.0 (80.0%)**.

## Evaluation Verdict
**Good checking** by the teacher. The variance shows that the teacher's grading is very close to the AI's re-evaluation benchmark.

## Question-wise Bias Findings (with numbers)
* **Q1**: AI Average = 8.0, Teacher Average = 7.5. (Delta = +0.5). Good checking.
* **Q2**: AI Average = 8.0, Teacher Average = 8.0. (Delta = 0.0). Perfect alignment.
* **Q3**: AI Average = 8.0, Teacher Average = 8.5. (Delta = -0.5). Good checking.
* **Q4**: AI Average = 8.0, Teacher Average = 7.0. (Delta = +1.0). Good checking.
* **Q5**: AI Average = 8.0, Teacher Average = 8.0. (Delta = 0.0). Perfect alignment.

## Students Recommended for Recheck (with reasons)
* All students are within normal tolerances. The marking is consistent.

## Overall Recommendation: CLEAR
The checked papers show highly professional and fair marking standards across the board.`;
  } else {
    reportMarkdown = `# Exam Evaluation Summary Report — ${exam.exam_name}

## Evaluation Summary
All uploaded student answer sheets have been evaluated by the AI examiner. The class performance is steady and meets expectations.

## Overall Class Performance
* **Total Students**: ${studentsList.length}
* **Average Score**: 40.0 / 50.0 (80.0%)
* **Highest Score**: 40.0 / 50.0

## Question-wise Analysis
* **Easiest Questions**: Q1, Q2, Q5 (All average 8.0 / 10.0)
* **Hardest Questions**: None. The class performed uniformly well.

## Top Performers
${studentsList.map((s, i) => `${i + 1}. **${s.student_name}**: 40.0 / 50.0`).join("\n")}

## Recommendations
* Continue the current curriculum pace.
* Target additional practice problems for Q3 and Q4 to perfect derivations.`;
  }

  const newReport = {
    id: reportId,
    exam_id: examId,
    report_markdown: reportMarkdown,
    bias_summary: exam.mode === "AUDIT" ? {
      per_question_bias: MOCK_QUESTIONS.map(q => ({
        q_no: q.q_no,
        ai_avg: 8.0,
        teacher_avg: 8.0,
        delta: 0.0
      })),
      overall_stats: {
        ai_avg: 40.0,
        teacher_avg: 40.0,
        avg_delta: 0.0
      }
    } : null,
    flagged_students: [],
    generated_at: new Date().toISOString(),
  };

  const currentReports = getReports();
  currentReports.push(newReport);
  setReports(currentReports);

  return {
    status: "completed",
    exam_id: examId,
    mode: exam.mode,
    processed_students: studentsList.length,
    total_students: studentsList.length,
    report_generated: true,
  };
}

// ── Results endpoints ─────────────────────────────────────────────
export async function getResults(examId: string) {
  await delay(500);
  const exam = getExams().find((e) => e.id === examId);
  const studentsList = getStudents().filter((s) => s.exam_id === examId);
  const scoresList = getScores();

  const studentsWithScores = studentsList.map((s) => {
    const qScores = scoresList.filter((sc) => sc.student_row_id === s.id);
    return {
      ...s,
      question_scores: qScores,
    };
  });

  return {
    exam: exam || {},
    students: studentsWithScores,
  };
}

export async function getStudentDetail(examId: string, studentRowId: string) {
  await delay(300);
  const student = getStudents().find((s) => s.id === studentRowId);
  const qScores = getScores().filter((sc) => sc.student_row_id === studentRowId);

  return {
    ...student,
    question_scores: qScores,
  };
}

export async function getReport(examId: string) {
  await delay(400);
  const report = getReports().find((r) => r.exam_id === examId);
  if (!report) throw new Error("Report not found");
  return report;
}

export async function getExamStats(examId: string) {
  await delay(400);
  const exam = getExams().find((e) => e.id === examId);
  const studentsList = getStudents().filter((s) => s.exam_id === examId);
  const scoresList = getScores();

  const studentsWithScores = studentsList.map((s) => {
    const qScores = scoresList.filter((sc) => sc.student_row_id === s.id);
    return {
      ...s,
      question_scores: qScores,
    };
  });

  const questionStats = MOCK_QUESTIONS.map((q) => {
    const scoresForQ = scoresList.filter(
      (sc) => studentsList.map((s) => s.id).includes(sc.student_row_id) && sc.q_no === q.q_no
    );
    const aiAvg = scoresForQ.reduce((acc, curr) => acc + curr.ai_marks, 0) / (scoresForQ.length || 1);
    const hasTeacher = scoresForQ.some((sc) => sc.teacher_marks !== null);
    const teacherAvg = hasTeacher
      ? scoresForQ.reduce((acc, curr) => acc + (curr.teacher_marks || 0), 0) / (scoresForQ.length || 1)
      : null;

    return {
      q_no: q.q_no,
      max_marks: q.max_marks,
      ai_avg: parseFloat(aiAvg.toFixed(1)),
      teacher_avg: teacherAvg !== null ? parseFloat(teacherAvg.toFixed(1)) : null,
      num_students: studentsList.length,
    };
  });

  const flaggedCount = studentsList.filter((s) => s.flagged).length;

  return {
    exam: exam || {},
    students: studentsWithScores,
    question_stats: questionStats,
    total_students: studentsList.length,
    flagged_count: flaggedCount,
  };
}
