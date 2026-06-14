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
  Plus,
  Trash2,
  User,
  Play,
} from "lucide-react";
import { createExam, uploadStudent, runEvaluation } from "@/lib/api";

type LocalStudent = {
  id: string;
  name: string;
  rollId: string;
  file: File;
  teacherMarks: Record<string, number>;
};

const MOCK_QUESTIONS = [
  { q_no: "Q1", max_marks: 10 },
  { q_no: "Q2", max_marks: 10 },
  { q_no: "Q3", max_marks: 10 },
  { q_no: "Q4", max_marks: 10 },
  { q_no: "Q5", max_marks: 10 },
];

function CreateExamContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedMode = searchParams.get("mode") || "";

  // Exam state (Left section)
  const [examName, setExamName] = useState("");
  const [subject, setSubject] = useState("");
  const [mode, setMode] = useState<"AI_ONLY" | "AUDIT">(
    preselectedMode === "AUDIT" ? "AUDIT" : "AI_ONLY"
  );
  const [qpFile, setQpFile] = useState<File | null>(null);
  const [qpDragActive, setQpDragActive] = useState(false);

  // Student form state (Right section)
  const [studentName, setStudentName] = useState("");
  const [studentRollId, setStudentRollId] = useState("");
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [studentDragActive, setStudentDragActive] = useState(false);
  const [teacherMarks, setTeacherMarks] = useState<Record<string, string>>(
    MOCK_QUESTIONS.reduce((acc, q) => ({ ...acc, [q.q_no]: "" }), {})
  );

  // Uploaded/Added students list
  const [addedStudents, setAddedStudents] = useState<LocalStudent[]>([]);

  // Pipeline execution state
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState("");

  // Drag-and-drop helpers
  const handleQpDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQpDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleQpDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQpDragActive(false);
    if (e.dataTransfer.files?.[0]) setQpFile(e.dataTransfer.files[0]);
  }, []);

  const handleStudentDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStudentDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleStudentDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStudentDragActive(false);
    if (e.dataTransfer.files?.[0]) setStudentFile(e.dataTransfer.files[0]);
  }, []);

  // Add student helper
  const handleAddStudent = () => {
    if (!studentFile) {
      setError("Please select/drop an answer sheet file for the student");
      return;
    }
    setError("");

    const parsedTeacherMarks: Record<string, number> = {};
    if (mode === "AUDIT") {
      for (const q of MOCK_QUESTIONS) {
        const value = parseFloat(teacherMarks[q.q_no] || "0");
        if (isNaN(value) || value < 0 || value > q.max_marks) {
          setError(`Invalid teacher mark for ${q.q_no} (must be 0 - ${q.max_marks})`);
          return;
        }
        parsedTeacherMarks[q.q_no] = value;
      }
    }

    const newStudent: LocalStudent = {
      id: Math.random().toString(36).substring(2, 9),
      name: studentName.trim() || studentFile.name.replace(/\.[^/.]+$/, ""),
      rollId: studentRollId.trim() || "N/A",
      file: studentFile,
      teacherMarks: parsedTeacherMarks,
    };

    setAddedStudents((prev) => [...prev, newStudent]);

    // Reset student form
    setStudentName("");
    setStudentRollId("");
    setStudentFile(null);
    setTeacherMarks(MOCK_QUESTIONS.reduce((acc, q) => ({ ...acc, [q.q_no]: "" }), {}));
  };

  // Remove student helper
  const handleRemoveStudent = (id: string) => {
    setAddedStudents((prev) => prev.filter((s) => s.id !== id));
  };

  // Run the full pipeline sequentially
  const handleRunEvaluation = async () => {
    if (!examName.trim()) return setError("Exam name is required");
    if (!qpFile) return setError("Please upload a question paper");
    if (addedStudents.length === 0) return setError("Please add at least one student answer sheet");

    setLoading(true);
    setError("");

    try {
      // 1. Create Exam
      setLoadingStep("Creating Exam & Parsing Question Paper...");
      const examFormData = new FormData();
      examFormData.append("exam_name", examName);
      examFormData.append("subject", subject);
      examFormData.append("mode", mode);
      examFormData.append("question_paper", qpFile);

      const examResult = await createExam(examFormData);
      const examId = examResult.exam_id;

      // 2. Upload Students one by one
      for (let i = 0; i < addedStudents.length; i++) {
        const s = addedStudents[i];
        setLoadingStep(`Uploading Student Answer Sheets (${i + 1}/${addedStudents.length}): ${s.name}...`);

        const studentFormData = new FormData();
        studentFormData.append("answer_sheet", s.file);
        studentFormData.append("student_name", s.name);
        studentFormData.append("student_id", s.rollId);

        if (mode === "AUDIT") {
          const marksArray = Object.entries(s.teacherMarks).map(([q_no, marks]) => ({
            q_no,
            marks,
          }));
          studentFormData.append("teacher_marks_json", JSON.stringify(marksArray));
        }

        await uploadStudent(examId, studentFormData);
      }

      // 3. Run AI Evaluation
      setLoadingStep("Running AI Evaluation & Generating Reports...");
      await runEvaluation(examId);

      // 4. Redirect to results page
      router.push(`/exam/${examId}/results`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run evaluation pipeline");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative pb-20">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#6c5ce7]/10 via-[#a855f7]/5 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 pt-12 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 animate-fade-in">
          <Link
            href="/"
            className="w-10 h-10 rounded-xl border border-[#1e1e2e] flex items-center justify-center text-[#8888a0] hover:border-[#6c5ce7]/40 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-white">Setup Exam Checking</h1>
            <p className="text-sm text-[#8888a0]">
              Configure your exam paper and upload student sheets side-by-side
            </p>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 text-sm text-[#ef4444] animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Two-Column Side-by-Side Unified Form */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          
          {/* ── Left Column: Section 1 (Question Paper & Config) ── */}
          <div className="glass rounded-3xl p-6 border border-[#1e1e2e] bg-[#12121a]/80 backdrop-blur-xl space-y-6">
            <div className="border-b border-[#1e1e2e] pb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#6c5ce7]/20 flex items-center justify-center text-xs font-bold text-[#a855f7]">1</span>
              <h2 className="text-lg font-bold text-white">Section 1: Question Paper & Exam Details</h2>
            </div>

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
                className="w-full px-4 py-3 rounded-xl bg-[#0a0a0f]/80 border border-[#1e1e2e] text-white placeholder-[#555570] focus:border-[#6c5ce7] focus:ring-1 focus:ring-[#6c5ce7]/50 outline-none transition-all text-sm"
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
                className="w-full px-4 py-3 rounded-xl bg-[#0a0a0f]/80 border border-[#1e1e2e] text-white placeholder-[#555570] focus:border-[#6c5ce7] focus:ring-1 focus:ring-[#6c5ce7]/50 outline-none transition-all text-sm"
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
                      : "border-[#1e1e2e] bg-[#0a0a0f] hover:border-[#2a2a3e]"
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
                      : "border-[#1e1e2e] bg-[#0a0a0f] hover:border-[#2a2a3e]"
                  }`}
                >
                  <ShieldCheck className={`w-5 h-5 mb-2 ${mode === "AUDIT" ? "text-[#a855f7]" : "text-[#555570]"}`} />
                  <div className="text-sm font-semibold text-white">Audit Mode</div>
                  <div className="text-xs text-[#8888a0] mt-1">Compare vs teacher</div>
                </button>
              </div>
            </div>

            {/* Question Paper File upload */}
            <div>
              <label className="block text-sm font-medium text-[#b0b0c0] mb-2">
                Question Paper *
              </label>
              <div
                onDragEnter={handleQpDrag}
                onDragOver={handleQpDrag}
                onDragLeave={handleQpDrag}
                onDrop={handleQpDrop}
                className={`relative p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all duration-300 ${
                  qpDragActive
                    ? "border-[#6c5ce7] bg-[#6c5ce7]/5"
                    : qpFile
                    ? "border-[#10b981]/50 bg-[#10b981]/5"
                    : "border-[#1e1e2e] bg-[#0a0a0f]/50 hover:border-[#2a2a3e]"
                }`}
                onClick={() => document.getElementById("qp-file-input")?.click()}
              >
                <input
                  id="qp-file-input"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setQpFile(e.target.files[0])}
                />
                {qpFile ? (
                  <>
                    <FileText className="w-10 h-10 text-[#10b981] mx-auto mb-3" />
                    <p className="text-sm font-medium text-white">{qpFile.name}</p>
                    <p className="text-xs text-[#8888a0] mt-1">
                      {(qpFile.size / 1024 / 1024).toFixed(2)} MB • Click to change
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
          </div>

          {/* ── Right Column: Section 2 (Student Sheets) ── */}
          <div className="space-y-6">
            
            {/* Student Upload Form */}
            <div className="glass rounded-3xl p-6 border border-[#1e1e2e] bg-[#12121a]/80 backdrop-blur-xl space-y-6">
              <div className="border-b border-[#1e1e2e] pb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#6c5ce7]/20 flex items-center justify-center text-xs font-bold text-[#a855f7]">2</span>
                <h2 className="text-lg font-bold text-white">Section 2: Student Answer Sheet</h2>
              </div>

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
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-3 rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] text-white placeholder-[#555570] focus:border-[#6c5ce7] focus:ring-1 focus:ring-[#6c5ce7]/50 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b0b0c0] mb-2">
                    Roll / Student ID
                  </label>
                  <input
                    type="text"
                    value={studentRollId}
                    onChange={(e) => setStudentRollId(e.target.value)}
                    placeholder="e.g. CS2026-042"
                    className="w-full px-4 py-3 rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] text-white placeholder-[#555570] focus:border-[#6c5ce7] focus:ring-1 focus:ring-[#6c5ce7]/50 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Student Answer Sheet File upload */}
              <div>
                <label className="block text-sm font-medium text-[#b0b0c0] mb-2">
                  Answer Sheet File *
                </label>
                <div
                  onDragEnter={handleStudentDrag}
                  onDragOver={handleStudentDrag}
                  onDragLeave={handleStudentDrag}
                  onDrop={handleStudentDrop}
                  onClick={() => document.getElementById("student-file-input")?.click()}
                  className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all duration-300 ${
                    studentDragActive
                      ? "border-[#6c5ce7] bg-[#6c5ce7]/5"
                      : studentFile
                      ? "border-[#10b981]/50 bg-[#10b981]/5"
                      : "border-[#1e1e2e] bg-[#0a0a0f]/50 hover:border-[#2a2a3e]"
                  }`}
                >
                  <input
                    id="student-file-input"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && setStudentFile(e.target.files[0])}
                  />
                  {studentFile ? (
                    <>
                      <FileText className="w-8 h-8 text-[#10b981] mx-auto mb-2" />
                      <p className="text-xs font-medium text-white truncate max-w-xs mx-auto">{studentFile.name}</p>
                      <p className="text-[10px] text-[#8888a0] mt-0.5">
                        {(studentFile.size / 1024 / 1024).toFixed(2)} MB • Click to change
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-[#555570] mx-auto mb-2" />
                      <p className="text-xs text-[#8888a0]">
                        Drop answer sheet or <span className="text-[#a855f7] font-semibold">browse</span>
                      </p>
                      <p className="text-[10px] text-[#555570] mt-1">PDF, PNG, JPG</p>
                    </>
                  )}
                </div>
              </div>

              {/* Teacher marks (AUDIT mode only) */}
              {mode === "AUDIT" && (
                <div className="glass rounded-2xl p-4 border border-[#1e1e2e] bg-[#0a0a0f]/40">
                  <h3 className="text-xs font-semibold text-white mb-3">
                    Teacher&apos;s Marks (per question - out of 10)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {MOCK_QUESTIONS.map((q) => (
                      <div key={q.q_no} className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#a855f7] w-6 shrink-0 text-center font-bold">
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
                          placeholder={`/ 10`}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e] text-white text-xs placeholder-[#555570] focus:border-[#6c5ce7] outline-none transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Student Button */}
              <button
                type="button"
                onClick={handleAddStudent}
                disabled={!studentFile}
                className="w-full py-3 rounded-xl bg-[#0a0a0f] border border-[#6c5ce7]/40 text-[#a855f7] hover:bg-[#6c5ce7]/10 hover:border-[#6c5ce7]/80 text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add Student Sheet to Batch
              </button>
            </div>

            {/* Added Students List & Run Trigger */}
            <div className="glass rounded-3xl p-6 border border-[#1e1e2e] bg-[#12121a]/80 backdrop-blur-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-[#a855f7]" />
                Students in Current Batch ({addedStudents.length})
              </h3>

              {addedStudents.length === 0 ? (
                <div className="text-xs text-[#555570] text-center py-10 border border-dashed border-[#1e1e2e] rounded-2xl bg-[#0a0a0f]/30">
                  No student answer sheets added to this batch yet.
                  <br />
                  Configure and click &ldquo;Add Student Sheet&rdquo; above.
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {addedStudents.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0a0f]/50 border border-[#1e1e2e] group hover:border-[#6c5ce7]/30 transition-all"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#6c5ce7]/10 flex items-center justify-center text-xs font-bold text-[#a855f7]">
                          {addedStudents.indexOf(s) + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {s.name}
                          </p>
                          <p className="text-[10px] text-[#555570]">Roll: {s.rollId} • {s.file.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStudent(s.id)}
                          className="text-[#555570] hover:text-[#ef4444] transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Main Action Trigger */}
                  <button
                    onClick={handleRunEvaluation}
                    disabled={loading || addedStudents.length === 0 || !examName.trim() || !qpFile}
                    className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-[#6c5ce7] to-[#a855f7] text-white font-bold text-base hover:shadow-[0_8px_30px_rgba(108,92,231,0.4)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium">{loadingStep}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Run AI Evaluation
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
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
