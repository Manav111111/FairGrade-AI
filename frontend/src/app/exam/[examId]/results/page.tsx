"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  FileText,
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import { getResults, getExamStats } from "@/lib/api";

/* ── Types ───────────────────────────────────────────────────────── */
type QuestionScore = {
  q_no: string;
  max_marks: number;
  ai_marks: number;
  teacher_marks: number | null;
  delta: number | null;
  key_points_covered: string[];
  key_points_missing: string[];
  reasoning: string;
};

type Student = {
  id: string;
  student_id: string;
  student_name: string;
  ai_total_marks: number;
  teacher_total_marks: number | null;
  total_max_marks: number;
  delta: number | null;
  flagged: boolean;
  question_scores: QuestionScore[];
};

type QuestionStat = {
  q_no: string;
  max_marks: number;
  ai_avg: number;
  teacher_avg: number | null;
  num_students: number;
};

/* ── Student Detail Modal ────────────────────────────────────────── */
function StudentDetailModal({
  student,
  onClose,
  isAudit,
}: {
  student: Student;
  onClose: () => void;
  isAudit: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-3xl glass border border-[#1e1e2e] animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-[#1e1e2e] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {student.student_name || student.student_id || "Student"}
            </h2>
            <p className="text-sm text-[#8888a0] mt-1">
              AI Total: {student.ai_total_marks?.toFixed(1)} / {student.total_max_marks}
              {isAudit && student.teacher_total_marks != null && (
                <> • Teacher: {student.teacher_total_marks?.toFixed(1)} • Delta: {student.delta?.toFixed(1)}</>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-[#1e1e2e] flex items-center justify-center text-[#8888a0] hover:text-white hover:border-[#6c5ce7]/40 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Questions */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)] space-y-4">
          {student.question_scores.map((qs) => (
            <div
              key={qs.q_no}
              className={`p-5 rounded-2xl border ${
                qs.delta != null && Math.abs(qs.delta) > qs.max_marks * 0.15
                  ? "border-[#f59e0b]/30 bg-[#f59e0b]/5"
                  : "border-[#1e1e2e] bg-[#0a0a0f]/50"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-lg bg-[#6c5ce7]/10 text-xs font-mono font-bold text-[#a855f7]">
                    {qs.q_no}
                  </span>
                  <span className="text-sm text-[#8888a0]">/ {qs.max_marks} marks</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">AI: {qs.ai_marks}</div>
                    {isAudit && qs.teacher_marks != null && (
                      <div className="text-xs text-[#8888a0]">Teacher: {qs.teacher_marks}</div>
                    )}
                  </div>
                  {isAudit && qs.delta != null && (
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        qs.delta > 0
                          ? "bg-[#10b981]/10 text-[#10b981]"
                          : qs.delta < 0
                          ? "bg-[#ef4444]/10 text-[#ef4444]"
                          : "bg-[#555570]/10 text-[#555570]"
                      }`}
                    >
                      {qs.delta > 0 ? "+" : ""}{qs.delta?.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>

              {/* Reasoning */}
              <p className="text-sm text-[#b0b0c0] mb-3">{qs.reasoning}</p>

              {/* Points */}
              <div className="grid sm:grid-cols-2 gap-3">
                {qs.key_points_covered?.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-[#10b981] mb-1.5">✓ Covered</div>
                    <ul className="space-y-1">
                      {qs.key_points_covered.map((p, i) => (
                        <li key={i} className="text-xs text-[#8888a0] flex items-start gap-1.5">
                          <span className="text-[#10b981] mt-0.5">•</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {qs.key_points_missing?.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-[#ef4444] mb-1.5">✗ Missing</div>
                    <ul className="space-y-1">
                      {qs.key_points_missing.map((p, i) => (
                        <li key={i} className="text-xs text-[#8888a0] flex items-start gap-1.5">
                          <span className="text-[#ef4444] mt-0.5">•</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Results Table ───────────────────────────────────────────────── */
function ResultsTable({
  students,
  isAudit,
  onSelectStudent,
}: {
  students: Student[];
  isAudit: boolean;
  onSelectStudent: (s: Student) => void;
}) {
  const [sortField, setSortField] = useState<string>("ai_total_marks");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = [...students].sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[sortField] as number ?? 0;
    const bVal = (b as Record<string, unknown>)[sortField] as number ?? 0;
    return sortDir === "asc" ? aVal - bVal : bVal - aVal;
  });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: string }) =>
    sortField === field ? (
      sortDir === "asc" ? (
        <ChevronUp className="w-3 h-3" />
      ) : (
        <ChevronDown className="w-3 h-3" />
      )
    ) : null;

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1e1e2e]">
              <th className="text-left text-xs font-medium text-[#8888a0] px-5 py-4">Student</th>
              <th
                className="text-right text-xs font-medium text-[#8888a0] px-5 py-4 cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort("ai_total_marks")}
              >
                <span className="inline-flex items-center gap-1">
                  AI Marks <SortIcon field="ai_total_marks" />
                </span>
              </th>
              {isAudit && (
                <>
                  <th
                    className="text-right text-xs font-medium text-[#8888a0] px-5 py-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSort("teacher_total_marks")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Teacher <SortIcon field="teacher_total_marks" />
                    </span>
                  </th>
                  <th
                    className="text-right text-xs font-medium text-[#8888a0] px-5 py-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSort("delta")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Delta <SortIcon field="delta" />
                    </span>
                  </th>
                </>
              )}
              <th className="text-center text-xs font-medium text-[#8888a0] px-5 py-4">Status</th>
              <th className="text-center text-xs font-medium text-[#8888a0] px-5 py-4">Detail</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => (
              <tr
                key={s.id}
                className={`border-b border-[#1e1e2e]/50 hover:bg-[#1a1a25] transition-colors ${
                  s.flagged ? "bg-[#f59e0b]/5" : ""
                }`}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6c5ce7]/20 to-[#a855f7]/20 flex items-center justify-center text-xs font-bold text-[#a855f7]">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {s.student_name || "Unknown"}
                      </p>
                      <p className="text-xs text-[#555570]">{s.student_id || "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="text-right px-5 py-4">
                  <span className="text-sm font-semibold text-white">
                    {s.ai_total_marks?.toFixed(1)}
                  </span>
                  <span className="text-xs text-[#555570]"> / {s.total_max_marks}</span>
                </td>
                {isAudit && (
                  <>
                    <td className="text-right px-5 py-4">
                      <span className="text-sm text-[#b0b0c0]">
                        {s.teacher_total_marks?.toFixed(1) ?? "—"}
                      </span>
                    </td>
                    <td className="text-right px-5 py-4">
                      {s.delta != null ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${
                            s.delta > 0
                              ? "bg-[#10b981]/10 text-[#10b981]"
                              : s.delta < 0
                              ? "bg-[#ef4444]/10 text-[#ef4444]"
                              : "bg-[#555570]/10 text-[#555570]"
                          }`}
                        >
                          {s.delta > 0 ? <TrendingUp className="w-3 h-3" /> : s.delta < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          {s.delta > 0 ? "+" : ""}{s.delta?.toFixed(1)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </>
                )}
                <td className="text-center px-5 py-4">
                  {s.flagged ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-[#f59e0b]/10 text-[#f59e0b]">
                      <AlertTriangle className="w-3 h-3" /> Flagged
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-[#10b981]/10 text-[#10b981]">
                      <CheckCircle2 className="w-3 h-3" /> OK
                    </span>
                  )}
                </td>
                <td className="text-center px-5 py-4">
                  <button
                    onClick={() => onSelectStudent(s)}
                    className="w-8 h-8 rounded-lg border border-[#1e1e2e] flex items-center justify-center text-[#8888a0] hover:text-[#a855f7] hover:border-[#6c5ce7]/40 transition-all mx-auto"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Mark Distribution Chart ─────────────────────────────────────── */
function MarkDistributionChart({
  students,
  isAudit,
}: {
  students: Student[];
  isAudit: boolean;
}) {
  const data = students.map((s, i) => ({
    name: s.student_name || s.student_id || `S${i + 1}`,
    ai: s.ai_total_marks || 0,
    teacher: s.teacher_total_marks || 0,
    max: s.total_max_marks || 0,
  }));

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-[#a855f7]" />
        Mark Distribution
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#8888a0", fontSize: 11 }}
            axisLine={{ stroke: "#1e1e2e" }}
          />
          <YAxis tick={{ fill: "#8888a0", fontSize: 11 }} axisLine={{ stroke: "#1e1e2e" }} />
          <Tooltip
            contentStyle={{
              background: "#12121a",
              border: "1px solid #1e1e2e",
              borderRadius: "12px",
              color: "#f0f0f5",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#8888a0" }} />
          <Bar dataKey="ai" name="AI Marks" fill="#6c5ce7" radius={[4, 4, 0, 0]} />
          {isAudit && (
            <Bar dataKey="teacher" name="Teacher Marks" fill="#a855f7" radius={[4, 4, 0, 0]} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Question Heatmap ────────────────────────────────────────────── */
function QuestionHeatmap({
  questionStats,
  isAudit,
}: {
  questionStats: QuestionStat[];
  isAudit: boolean;
}) {
  const data = questionStats.map((q) => ({
    q_no: q.q_no,
    max: q.max_marks,
    ai_avg: q.ai_avg,
    teacher_avg: q.teacher_avg ?? 0,
    delta: q.teacher_avg != null ? +(q.ai_avg - q.teacher_avg).toFixed(2) : 0,
  }));

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-[#a855f7]" />
        Per-Question Average
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
          <XAxis
            dataKey="q_no"
            tick={{ fill: "#8888a0", fontSize: 11 }}
            axisLine={{ stroke: "#1e1e2e" }}
          />
          <YAxis tick={{ fill: "#8888a0", fontSize: 11 }} axisLine={{ stroke: "#1e1e2e" }} />
          <Tooltip
            contentStyle={{
              background: "#12121a",
              border: "1px solid #1e1e2e",
              borderRadius: "12px",
              color: "#f0f0f5",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#8888a0" }} />
          <Bar dataKey="max" name="Max Marks" fill="#1e1e2e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="ai_avg" name="AI Average" fill="#6c5ce7" radius={[4, 4, 0, 0]} />
          {isAudit && (
            <Bar
              dataKey="teacher_avg"
              name="Teacher Average"
              fill="#a855f7"
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function ResultsPage() {
  const params = useParams();
  const examId = params.examId as string;

  const [students, setStudents] = useState<Student[]>([]);
  const [examData, setExamData] = useState<Record<string, unknown> | null>(null);
  const [questionStats, setQuestionStats] = useState<QuestionStat[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [resultsData, statsData] = await Promise.all([
          getResults(examId),
          getExamStats(examId),
        ]);
        setStudents(resultsData.students as Student[]);
        setExamData(resultsData.exam);
        setQuestionStats(statsData.question_stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load results");
      } finally {
        setLoading(false);
      }
    })();
  }, [examId]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#6c5ce7] mx-auto mb-4" />
          <p className="text-sm text-[#8888a0]">Loading results...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-[#f59e0b] mx-auto mb-4" />
          <p className="text-sm text-[#ef4444]">{error}</p>
        </div>
      </main>
    );
  }

  const isAudit = (examData as Record<string, unknown>)?.mode === "AUDIT";
  const examName = ((examData as Record<string, unknown>)?.exam_name as string) || "Exam";
  const flaggedCount = students.filter((s) => s.flagged).length;

  return (
    <main className="min-h-screen relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-[#6c5ce7]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 pt-12 pb-20 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="w-10 h-10 rounded-xl border border-[#1e1e2e] flex items-center justify-center text-[#8888a0] hover:border-[#6c5ce7]/40 hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">{examName} — Results</h1>
              <p className="text-sm text-[#8888a0]">
                {students.length} students • {isAudit ? "Audit Mode" : "AI-Only Mode"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAudit && (
              <Link
                href={`/exam/${examId}/report`}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6c5ce7] to-[#a855f7] text-white text-sm font-medium hover:shadow-[0_4px_20px_rgba(108,92,231,0.3)] transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                View Report
              </Link>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-slide-up">
          <div className="glass rounded-2xl p-5">
            <div className="text-xs text-[#8888a0] mb-1">Total Students</div>
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#6c5ce7]" />
              {students.length}
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="text-xs text-[#8888a0] mb-1">Average AI Score</div>
            <div className="text-2xl font-bold text-white">
              {students.length > 0
                ? (
                    students.reduce((acc, s) => acc + (s.ai_total_marks || 0), 0) / students.length
                  ).toFixed(1)
                : "—"}
            </div>
          </div>
          {isAudit && (
            <>
              <div className="glass rounded-2xl p-5">
                <div className="text-xs text-[#8888a0] mb-1">Flagged Students</div>
                <div className={`text-2xl font-bold flex items-center gap-2 ${flaggedCount > 0 ? "text-[#f59e0b]" : "text-[#10b981]"}`}>
                  <AlertTriangle className="w-5 h-5" />
                  {flaggedCount}
                </div>
              </div>
              <div className="glass rounded-2xl p-5">
                <div className="text-xs text-[#8888a0] mb-1">Avg Teacher Score</div>
                <div className="text-2xl font-bold text-white">
                  {students.length > 0 && students[0].teacher_total_marks != null
                    ? (
                        students.reduce((acc, s) => acc + (s.teacher_total_marks || 0), 0) /
                        students.length
                      ).toFixed(1)
                    : "—"}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8 animate-slide-up stagger-2">
          <MarkDistributionChart students={students} isAudit={isAudit} />
          {questionStats.length > 0 && (
            <QuestionHeatmap questionStats={questionStats} isAudit={isAudit} />
          )}
        </div>

        {/* Results Table */}
        <div className="animate-slide-up stagger-3">
          <ResultsTable
            students={students}
            isAudit={isAudit}
            onSelectStudent={setSelectedStudent}
          />
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          isAudit={isAudit}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </main>
  );
}
