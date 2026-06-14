/**
 * API client for communicating with the FastAPI backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://fairgrade-backend-585u.onrender.com";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API error ${res.status}: ${errorBody}`);
  }

  return res.json();
}

// ── Exam endpoints ────────────────────────────────────────────────
export async function createExam(formData: FormData) {
  return request<{
    exam_id: string;
    exam_name: string;
    mode: string;
    questions: Array<{ q_no: string; question_text: string; max_marks: number }>;
    total_max_marks: number;
  }>("/api/exam/create", { method: "POST", body: formData });
}

export async function getExam(examId: string) {
  return request<{
    id: string;
    exam_name: string;
    subject: string;
    mode: string;
    questions_json: Array<{ q_no: string; question_text: string; max_marks: number }>;
    created_at: string;
  }>(`/api/exam/${examId}`);
}

export async function listExams() {
  return request<
    Array<{
      id: string;
      exam_name: string;
      subject: string;
      mode: string;
      created_at: string;
    }>
  >("/api/exam/list/all");
}

// ── Upload endpoints ──────────────────────────────────────────────
export async function uploadStudent(examId: string, formData: FormData) {
  return request<{
    student_row_id: string;
    student_id: string;
    student_name: string;
    exam_id: string;
    teacher_marks: Record<string, number> | null;
  }>(`/api/exam/${examId}/upload_student`, { method: "POST", body: formData });
}

export async function uploadBulk(examId: string, formData: FormData) {
  return request<{
    uploaded_count: number;
    students: Array<{ student_row_id: string; student_name: string }>;
  }>(`/api/exam/${examId}/upload_bulk`, { method: "POST", body: formData });
}

// ── Evaluation endpoints ──────────────────────────────────────────
export async function runEvaluation(examId: string) {
  // Simulate 35 seconds checking delay as requested by the user
  await new Promise((resolve) => setTimeout(resolve, 35000));
  return request<{
    status: string;
    exam_id: string;
    mode: string;
    processed_students: number;
    total_students: number;
    report_generated: boolean;
  }>(`/api/exam/${examId}/run_evaluation`, { method: "POST" });
}

// ── Results endpoints ─────────────────────────────────────────────
export async function getResults(examId: string) {
  return request<{
    exam: Record<string, unknown>;
    students: Array<Record<string, unknown>>;
  }>(`/api/exam/${examId}/results`);
}

export async function getStudentDetail(examId: string, studentRowId: string) {
  return request<Record<string, unknown>>(
    `/api/exam/${examId}/results/${studentRowId}`
  );
}

export async function getReport(examId: string) {
  return request<{
    id: string;
    exam_id: string;
    report_markdown: string;
    bias_summary: Record<string, unknown> | null;
    flagged_students: Array<Record<string, unknown>> | null;
    generated_at: string;
  }>(`/api/exam/${examId}/report`);
}

export async function getExamStats(examId: string) {
  return request<{
    exam: Record<string, unknown>;
    students: Array<Record<string, unknown>>;
    question_stats: Array<{
      q_no: string;
      max_marks: number;
      ai_avg: number;
      teacher_avg: number | null;
      num_students: number;
    }>;
    total_students: number;
    flagged_count: number;
  }>(`/api/exam/${examId}/stats`);
}
