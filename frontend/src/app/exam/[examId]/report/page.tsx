"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  FileText,
  Download,
  Calendar,
  BarChart3,
} from "lucide-react";
import { getReport } from "@/lib/api";

export default function ReportPage() {
  const params = useParams();
  const examId = params.examId as string;

  const [report, setReport] = useState<{
    report_markdown: string;
    bias_summary: Record<string, unknown> | null;
    flagged_students: Array<Record<string, unknown>> | null;
    generated_at: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getReport(examId);
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    })();
  }, [examId]);

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report.report_markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fairgrade_report_${examId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#6c5ce7] mx-auto mb-4" />
          <p className="text-sm text-[#8888a0]">Loading report...</p>
        </div>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-[#f59e0b] mx-auto mb-4" />
          <p className="text-sm text-[#ef4444]">{error || "No report available"}</p>
          <Link
            href={`/exam/${examId}/results`}
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm text-[#a855f7] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Results
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-[#6c5ce7]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 pt-12 pb-20 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <Link
              href={`/exam/${examId}/results`}
              className="w-10 h-10 rounded-xl border border-[#1e1e2e] flex items-center justify-center text-[#8888a0] hover:border-[#6c5ce7]/40 hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-[#a855f7]" />
                Audit Report
              </h1>
              <p className="text-sm text-[#8888a0] flex items-center gap-2 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                Generated {new Date(report.generated_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/exam/${examId}/results`}
              className="px-4 py-2.5 rounded-xl border border-[#1e1e2e] text-sm text-[#8888a0] hover:border-[#6c5ce7]/40 hover:text-white transition-all flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Results
            </Link>
            <button
              onClick={handleDownload}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6c5ce7] to-[#a855f7] text-white text-sm font-medium hover:shadow-[0_4px_20px_rgba(108,92,231,0.3)] transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>

        {/* Bias Summary Cards */}
        {report.flagged_students && report.flagged_students.length > 0 && (
          <div className="glass rounded-2xl p-6 mb-8 animate-slide-up border-[#f59e0b]/20">
            <h3 className="text-sm font-semibold text-[#f59e0b] mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {report.flagged_students.length} Student(s) Flagged for Review
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {report.flagged_students.map((s, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#f59e0b]/5 border border-[#f59e0b]/10 text-sm"
                >
                  <p className="font-medium text-white">
                    {(s.student_name as string) || (s.student_id as string) || `Student ${i + 1}`}
                  </p>
                  <p className="text-xs text-[#8888a0] mt-1">{s.reason as string}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report content */}
        <div className="glass rounded-2xl p-8 animate-slide-up stagger-2">
          <article className="prose prose-invert max-w-none prose-headings:text-white prose-h2:text-xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-[#1e1e2e] prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-p:text-[#b0b0c0] prose-p:leading-relaxed prose-li:text-[#b0b0c0] prose-strong:text-white prose-table:text-sm prose-th:text-left prose-th:text-[#8888a0] prose-th:pb-2 prose-th:border-b prose-th:border-[#1e1e2e] prose-td:py-2 prose-td:border-b prose-td:border-[#1e1e2e]/50 prose-code:text-[#a855f7] prose-code:bg-[#6c5ce7]/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown>{report.report_markdown}</ReactMarkdown>
          </article>
        </div>
      </div>
    </main>
  );
}
