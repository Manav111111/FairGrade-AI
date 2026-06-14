"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Trash2,
  Play,
  Plus,
} from "lucide-react";
import { getExam, uploadStudent, runEvaluation } from "@/lib/api";

type Question = { q_no: string; question_text: string; max_marks: number };
type UploadedStudent = {
  student_row_id: string;
  student_name: string;
  student_id: string;
  file_name: string;
  teacher_marks?: Record<string, number>;
};

export default function UploadPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [exam, setExam] = useState<{
    exam_name: string;
    mode: string;
    subject: string;
    questions_json: Question[];
  } | null>(null);

  const [uploadedStudents, setUploadedStudents] = useState<UploadedStudent[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [teacherMarks, setTeacherMarks] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");
  const [loadingExam, setLoadingExam] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getExam(examId);
        setExam({
          exam_name: data.exam_name,
          mode: data.mode,
          subject: data.subject,
          questions_json: data.questions_json,
        });
        // Init teacher marks fields
        if (data.mode === "AUDIT") {
          const marks: Record<string, string> = {};
          data.questions_json.forEach((q: Question) => {
            marks[q.q_no] = "";
          });
          setTeacherMarks(marks);
        }
      } catch {
        setError("Failed to load exam");
      } finally {
        setLoadingExam(false);
      }
    })();
  }, [examId]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setCurrentFile(e.dataTransfer.files[0]);
  }, []);

  const handleUpload = async () => {
    if (!currentFile) return setError("Please select an answer sheet");

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("answer_sheet", currentFile);
      formData.append("student_name", studentName || currentFile.name.replace(/\.[^/.]+$/, ""));
      formData.append("student_id", studentId);

      if (exam?.mode === "AUDIT") {
        const marksArray = Object.entries(teacherMarks)
          .filter(([, v]) => v !== "")
          .map(([q_no, marks]) => ({ q_no, marks: parseFloat(marks) }));
        formData.append("teacher_marks_json", JSON.stringify(marksArray));
      }

      const res = await uploadStudent(examId, formData);
      setUploadedStudents((prev) => [
        ...prev,
        {
          student_row_id: res.student_row_id,
          student_name: res.student_name || studentName || currentFile.name,
          student_id: res.student_id || studentId,
          file_name: currentFile.name,
          teacher_marks: res.teacher_marks || undefined,
        },
      ]);

      // Reset form
      setCurrentFile(null);
      setStudentName("");
      setStudentId("");
      if (exam?.mode === "AUDIT" && exam.questions_json) {
        const marks: Record<string, string> = {};
        exam.questions_json.forEach((q) => { marks[q.q_no] = ""; });
        setTeacherMarks(marks);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRunEvaluation = async () => {
    if (uploadedStudents.length === 0) return setError("Upload at least one student");
    setEvaluating(true);
    setError("");
    try {
      await runEvaluation(examId);
      router.push(`/exam/${examId}/results`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed");
      setEvaluating(false);
    }
  };

  if (loadingExam) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6c5ce7]" />
      </main>
    );
  }

  return (
    <main className="min-h-screen relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-[#6c5ce7]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 pt-12 pb-20 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 animate-fade-in">
          <Link
            href="/"
            className="w-10 h-10 rounded-xl border border-[#1e1e2e] flex items-center justify-center text-[#8888a0] hover:border-[#6c5ce7]/40 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Upload Answer Sheets</h1>
            <p className="text-sm text-[#8888a0]">
              {exam?.exam_name} • {exam?.mode === "AUDIT" ? "Audit Mode" : "AI-Only Mode"}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* ── Left: Upload form ────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-6 animate-slide-up">
            {/* Student info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#b0b0c0] mb-2">
                  Student Name
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-4 py-3 rounded-xl bg-[#12121a] border border-[#1e1e2e] text-white placeholder-[#555570] focus:border-[#6c5ce7] focus:ring-1 focus:ring-[#6c5ce7]/50 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b0b0c0] mb-2">
                  Roll / Student ID
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-4 py-3 rounded-xl bg-[#12121a] border border-[#1e1e2e] text-white placeholder-[#555570] focus:border-[#6c5ce7] focus:ring-1 focus:ring-[#6c5ce7]/50 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* File drop zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("answer-file-input")?.click()}
              className={`p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all duration-300 ${
                dragActive
                  ? "border-[#6c5ce7] bg-[#6c5ce7]/5"
                  : currentFile
                  ? "border-[#10b981]/50 bg-[#10b981]/5"
                  : "border-[#1e1e2e] bg-[#12121a]/50 hover:border-[#2a2a3e]"
              }`}
            >
              <input
                id="answer-file-input"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && setCurrentFile(e.target.files[0])}
              />
              {currentFile ? (
                <>
                  <FileText className="w-10 h-10 text-[#10b981] mx-auto mb-3" />
                  <p className="text-sm font-medium text-white">{currentFile.name}</p>
                  <p className="text-xs text-[#8888a0] mt-1">
                    {(currentFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-[#555570] mx-auto mb-3" />
                  <p className="text-sm text-[#8888a0]">
                    Drop answer sheet or <span className="text-[#a855f7]">browse</span>
                  </p>
                  <p className="text-xs text-[#555570] mt-2">PDF, PNG, JPG</p>
                </>
              )}
            </div>

            {/* Teacher marks (AUDIT mode only) */}
            {exam?.mode === "AUDIT" && exam.questions_json && (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">
                  Teacher&apos;s Marks (per question)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {exam.questions_json.map((q) => (
                    <div key={q.q_no} className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#a855f7] w-10 shrink-0">
                        {q.q_no}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={q.max_marks}
                        step={0.5}
                        value={teacherMarks[q.q_no] || ""}
                        onChange={(e) =>
                          setTeacherMarks((prev) => ({
                            ...prev,
                            [q.q_no]: e.target.value,
                          }))
                        }
                        placeholder={`/ ${q.max_marks}`}
                        className="w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e] text-white text-sm placeholder-[#555570] focus:border-[#6c5ce7] outline-none transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 text-sm text-[#ef4444]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Upload button */}
            <button
              onClick={handleUpload}
              disabled={uploading || !currentFile}
              className="w-full py-3 rounded-xl bg-[#12121a] border border-[#6c5ce7]/50 text-[#a855f7] font-medium hover:bg-[#6c5ce7]/10 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Student
                </>
              )}
            </button>
          </div>

          {/* ── Right: Uploaded list + Run ────────────────────────── */}
          <div className="lg:col-span-2 animate-slide-up stagger-2">
            <div className="glass rounded-2xl p-6 sticky top-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-[#a855f7]" />
                Uploaded ({uploadedStudents.length})
              </h3>

              {uploadedStudents.length === 0 ? (
                <p className="text-sm text-[#555570] text-center py-8">
                  No students uploaded yet
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto mb-6">
                  {uploadedStudents.map((s, i) => (
                    <div
                      key={s.student_row_id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0a0f]/50 border border-[#1e1e2e] group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#6c5ce7]/10 flex items-center justify-center text-xs font-bold text-[#a855f7]">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {s.student_name || s.file_name}
                        </p>
                        <p className="text-xs text-[#555570]">{s.student_id || "No ID"}</p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {/* Run evaluation button */}
              <button
                id="run-evaluation-button"
                onClick={handleRunEvaluation}
                disabled={evaluating || uploadedStudents.length === 0}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#6c5ce7] to-[#a855f7] text-white font-semibold hover:shadow-[0_8px_30px_rgba(108,92,231,0.4)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {evaluating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Run AI Evaluation
                  </>
                )}
              </button>

              {evaluating && (
                <p className="text-xs text-[#8888a0] text-center mt-3">
                  This may take a few minutes...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
