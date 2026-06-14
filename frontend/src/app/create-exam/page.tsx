"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useCallback, Suspense } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Brain,
  ShieldCheck,
} from "lucide-react";
import { createExam } from "@/lib/api";

function CreateExamContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedMode = searchParams.get("mode") || "";

  const [examName, setExamName] = useState("");
  const [subject, setSubject] = useState("");
  const [mode, setMode] = useState<"AI_ONLY" | "AUDIT">(
    preselectedMode === "AUDIT" ? "AUDIT" : "AI_ONLY"
  );
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    exam_id: string;
    questions: Array<{ q_no: string; question_text: string; max_marks: number }>;
    total_max_marks: number;
  } | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files?.[0]) setFile(files[0]);
  }, []);

  const handleSubmit = async () => {
    if (!examName.trim()) return setError("Exam name is required");
    if (!file) return setError("Please upload a question paper");

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("exam_name", examName);
      formData.append("subject", subject);
      formData.append("mode", mode);
      formData.append("question_paper", file);

      const res = await createExam(formData);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create exam");
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ─────────────────────────────────────────────────
  if (result) {
    return (
      <main className="min-h-screen relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-[#10b981]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-3xl mx-auto px-6 pt-20 relative z-10">
          <div className="text-center mb-10 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Exam Created Successfully!</h1>
            <p className="text-[#8888a0]">
              Extracted {result.questions.length} questions • Total: {result.total_max_marks} marks
            </p>
          </div>

          {/* Questions preview */}
          <div className="glass rounded-2xl p-6 mb-8 animate-slide-up">
            <h3 className="text-lg font-semibold text-white mb-4">Extracted Questions</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {result.questions.map((q, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-xl bg-[#0a0a0f]/50 border border-[#1e1e2e]"
                >
                  <span className="shrink-0 w-10 h-10 rounded-lg bg-[#6c5ce7]/10 flex items-center justify-center text-sm font-mono font-bold text-[#a855f7]">
                    {q.q_no}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#b0b0c0] line-clamp-2">{q.question_text}</p>
                  </div>
                  <span className="shrink-0 px-3 py-1 rounded-lg bg-[#6c5ce7]/10 text-xs font-semibold text-[#a855f7]">
                    {q.max_marks} marks
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 justify-center animate-slide-up stagger-2">
            <button
              onClick={() => router.push(`/exam/${result.exam_id}/upload`)}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#6c5ce7] to-[#a855f7] text-white font-semibold hover:shadow-[0_8px_30px_rgba(108,92,231,0.4)] hover:-translate-y-0.5 transition-all duration-300"
            >
              Upload Answer Sheets →
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Create form ───────────────────────────────────────────────────
  return (
    <main className="min-h-screen relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-[#6c5ce7]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-2xl mx-auto px-6 pt-12 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10 animate-fade-in">
          <Link
            href="/"
            className="w-10 h-10 rounded-xl border border-[#1e1e2e] flex items-center justify-center text-[#8888a0] hover:border-[#6c5ce7]/40 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Create New Exam</h1>
            <p className="text-sm text-[#8888a0]">Upload a question paper to get started</p>
          </div>
        </div>

        <div className="space-y-6 animate-slide-up">
          {/* Exam name */}
          <div>
            <label className="block text-sm font-medium text-[#b0b0c0] mb-2">
              Exam Name *
            </label>
            <input
              id="exam-name-input"
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="e.g. Physics Mid-Term 2026"
              className="w-full px-4 py-3 rounded-xl bg-[#12121a] border border-[#1e1e2e] text-white placeholder-[#555570] focus:border-[#6c5ce7] focus:ring-1 focus:ring-[#6c5ce7]/50 outline-none transition-all"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-[#b0b0c0] mb-2">
              Subject
            </label>
            <input
              id="subject-input"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Physics, Mathematics, History"
              className="w-full px-4 py-3 rounded-xl bg-[#12121a] border border-[#1e1e2e] text-white placeholder-[#555570] focus:border-[#6c5ce7] focus:ring-1 focus:ring-[#6c5ce7]/50 outline-none transition-all"
            />
          </div>

          {/* Mode selection */}
          <div>
            <label className="block text-sm font-medium text-[#b0b0c0] mb-3">
              Evaluation Mode *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                id="mode-ai-only"
                onClick={() => setMode("AI_ONLY")}
                className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                  mode === "AI_ONLY"
                    ? "border-[#6c5ce7] bg-[#6c5ce7]/10 shadow-[0_0_20px_rgba(108,92,231,0.15)]"
                    : "border-[#1e1e2e] bg-[#12121a] hover:border-[#2a2a3e]"
                }`}
              >
                <Brain className={`w-5 h-5 mb-2 ${mode === "AI_ONLY" ? "text-[#a855f7]" : "text-[#555570]"}`} />
                <div className="text-sm font-semibold text-white">AI-Only</div>
                <div className="text-xs text-[#8888a0] mt-1">Full AI evaluation</div>
              </button>
              <button
                id="mode-audit"
                onClick={() => setMode("AUDIT")}
                className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                  mode === "AUDIT"
                    ? "border-[#a855f7] bg-[#a855f7]/10 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                    : "border-[#1e1e2e] bg-[#12121a] hover:border-[#2a2a3e]"
                }`}
              >
                <ShieldCheck className={`w-5 h-5 mb-2 ${mode === "AUDIT" ? "text-[#a855f7]" : "text-[#555570]"}`} />
                <div className="text-sm font-semibold text-white">Audit Mode</div>
                <div className="text-xs text-[#8888a0] mt-1">Compare vs teacher</div>
              </button>
            </div>
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-[#b0b0c0] mb-2">
              Question Paper *
            </label>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all duration-300 ${
                dragActive
                  ? "border-[#6c5ce7] bg-[#6c5ce7]/5"
                  : file
                  ? "border-[#10b981]/50 bg-[#10b981]/5"
                  : "border-[#1e1e2e] bg-[#12121a]/50 hover:border-[#2a2a3e]"
              }`}
              onClick={() => document.getElementById("qp-file-input")?.click()}
            >
              <input
                id="qp-file-input"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
              />
              {file ? (
                <>
                  <FileText className="w-10 h-10 text-[#10b981] mx-auto mb-3" />
                  <p className="text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-[#8888a0] mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • Click to change
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-[#555570] mx-auto mb-3" />
                  <p className="text-sm text-[#8888a0]">
                    Drag & drop your question paper here, or{" "}
                    <span className="text-[#a855f7] font-medium">browse</span>
                  </p>
                  <p className="text-xs text-[#555570] mt-2">
                    Supports PDF, PNG, JPG
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 text-sm text-[#ef4444]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            id="create-exam-button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#6c5ce7] to-[#a855f7] text-white font-semibold text-lg hover:shadow-[0_8px_30px_rgba(108,92,231,0.4)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Parsing Question Paper...
              </>
            ) : (
              <>
                <GraduationCap className="w-5 h-5" />
                Create Exam
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function CreateExamPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6c5ce7]" />
      </main>
    }>
      <CreateExamContent />
    </Suspense>
  );
}
