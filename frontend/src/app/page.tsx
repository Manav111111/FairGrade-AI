"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Brain,
  ShieldCheck,
  BarChart3,
  FileCheck2,
  Users,
  Zap,
  ArrowRight,
  Sparkles,
  GraduationCap,
  ChevronRight,
} from "lucide-react";

/* ── Floating particle background ────────────────────────────────── */
function ParticleField() {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; size: number; delay: number; duration: number }>
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 5,
        duration: Math.random() * 10 + 10,
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full opacity-20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `linear-gradient(135deg, #6c5ce7, #a855f7)`,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Feature card ────────────────────────────────────────────────── */
function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <div
      className="group relative p-6 rounded-2xl border border-[#1e1e2e] bg-[#12121a]/70 backdrop-blur-xl hover:border-[#6c5ce7]/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(108,92,231,0.15)] animate-slide-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#6c5ce7]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6c5ce7]/20 to-[#a855f7]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6 text-[#a855f7]" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-[#8888a0] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ── Mode selection card ─────────────────────────────────────────── */
function ModeCard({
  href,
  icon: Icon,
  title,
  subtitle,
  description,
  features,
  gradient,
  delay,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  gradient: string;
  delay: number;
}) {
  return (
    <Link href={href} className="block group animate-slide-up" style={{ animationDelay: `${delay}s` }}>
      <div className="relative h-full p-8 rounded-3xl border border-[#1e1e2e] bg-[#12121a]/80 backdrop-blur-xl overflow-hidden hover:border-[#6c5ce7]/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(108,92,231,0.2)]">
        {/* Glow effect */}
        <div
          className={`absolute -top-20 -right-20 w-60 h-60 rounded-full blur-[100px] opacity-10 group-hover:opacity-25 transition-opacity duration-700`}
          style={{ background: gradient }}
        />

        <div className="relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-[#6c5ce7]/10 text-[#a855f7] border border-[#6c5ce7]/20 mb-6">
            <Icon className="w-3.5 h-3.5" />
            {subtitle}
          </div>

          <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
          <p className="text-[#8888a0] mb-6 leading-relaxed">{description}</p>

          <ul className="space-y-3 mb-8">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-[#b0b0c0]">
                <ChevronRight className="w-4 h-4 text-[#6c5ce7] mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 text-[#a855f7] font-medium group-hover:gap-4 transition-all duration-300">
            Get Started
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Stat pill ───────────────────────────────────────────────────── */
function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-3">
      <span className="text-2xl font-bold gradient-text">{value}</span>
      <span className="text-xs text-[#8888a0] mt-1">{label}</span>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <main className="relative min-h-screen">
      <ParticleField />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-16 px-6">
        {/* Top gradient blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#6c5ce7]/10 via-[#a855f7]/5 to-transparent rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Logo + badge */}
          <div className="flex flex-col items-center text-center mb-12 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#a855f7] flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(108,92,231,0.3)] animate-pulse-glow">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-[#6c5ce7]/10 text-[#a855f7] border border-[#6c5ce7]/20 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Exam Intelligence
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              <span className="gradient-text">FairGrade</span>{" "}
              <span className="text-white">AI</span>
            </h1>
            <p className="text-xl md:text-2xl text-[#8888a0] max-w-2xl leading-relaxed">
              Intelligent exam evaluation and marking audit system.
              <br className="hidden md:block" />
              Two powerful modes — one unified AI engine.
            </p>
          </div>


          {/* ── Mode Selection Cards ─────────────────────────────── */}
          <div className="grid md:grid-cols-2 gap-6 mb-20">
            <ModeCard
              href="/create-exam?mode=AI_ONLY"
              icon={Brain}
              title="AI-Only Evaluation"
              subtitle="MODE A"
              description="Let AI be the sole examiner. No teacher input needed — upload question papers and answer sheets, get instant, comprehensive evaluation."
              features={[
                "No answer key required — AI uses subject expertise",
                "Per-question scoring with reasoning",
                "Class performance analytics & charts",
                "Summary report with recommendations",
              ]}
              gradient="linear-gradient(135deg, #6c5ce7, #3b82f6)"
              delay={0.3}
            />
            <ModeCard
              href="/create-exam?mode=AUDIT"
              icon={ShieldCheck}
              title="Audit Teacher's Marking"
              subtitle="MODE B"
              description="AI re-evaluates independently, then compares against teacher marks to detect bias, inconsistency, and unfair grading patterns."
              features={[
                "Question-level bias detection",
                "Per-student flagging for recheck",
                "Cross-teacher standard comparison",
                "Full audit report with evidence",
              ]}
              gradient="linear-gradient(135deg, #a855f7, #ec4899)"
              delay={0.4}
            />
          </div>

          {/* ── Features Grid ────────────────────────────────────── */}
          <div className="text-center mb-12 animate-fade-in stagger-3">
            <h2 className="text-3xl font-bold text-white mb-4">Why FairGrade AI?</h2>
            <p className="text-[#8888a0] max-w-xl mx-auto">
              Built for institutions that demand fairness, transparency, and efficiency in exam evaluation.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-20">
            <FeatureCard
              icon={Brain}
              title="No Answer Key Needed"
              description="AI uses deep subject knowledge to evaluate answers — reducing teacher setup burden dramatically."
              delay={0.2}
            />
            <FeatureCard
              icon={BarChart3}
              title="Question-Level Granularity"
              description="Pinpoints exactly which questions show bias, not just an overall verdict. See per-question delta heatmaps."
              delay={0.3}
            />
            <FeatureCard
              icon={Users}
              title="Cross-Teacher Comparison"
              description="Detect when different teachers grade the same question by different standards across sections."
              delay={0.4}
            />
            <FeatureCard
              icon={FileCheck2}
              title="Evidence-Based Reports"
              description="Every finding backed by numbers — deltas, variances, correlation coefficients. Not opinions."
              delay={0.5}
            />
            <FeatureCard
              icon={Zap}
              title="Blazing Fast Processing"
              description="Powered by Groq (fastest LLM inference) and Gemini Flash for instant OCR. Results in minutes."
              delay={0.6}
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Completely Free"
              description="No credit card required anywhere. Groq + Gemini + Supabase — zero cost to run or demo."
              delay={0.7}
            />
          </div>

          {/* ── CTA ──────────────────────────────────────────────── */}
          <div className="text-center animate-fade-in stagger-4">
            <div className="glass rounded-3xl p-10 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-4">
                Ready to ensure fair grading?
              </h2>
              <p className="text-[#8888a0] mb-8">
                Start by creating an exam. Upload a question paper and let FairGrade AI handle the rest.
              </p>
              <Link
                href="/create-exam"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#6c5ce7] to-[#a855f7] text-white font-semibold text-lg hover:shadow-[0_8px_30px_rgba(108,92,231,0.4)] hover:-translate-y-0.5 transition-all duration-300"
              >
                Create Your First Exam
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="relative mt-auto py-8 border-t border-[#1e1e2e]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-[#555570]">
            <GraduationCap className="w-4 h-4" />
            FairGrade AI — Exam Intelligence Engine
          </div>
          <div className="flex items-center gap-6 text-xs text-[#555570]">
            <span>Powered by Groq + Gemini + Supabase</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
