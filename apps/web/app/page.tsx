"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Bot,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  Sliders,
  Database,
  Lock,
} from "lucide-react";
import { SpringCounter } from "@/components/SpringCounter";
import { SourceMarquee } from "@/components/SourceMarquee";
import { FolderCard } from "@/components/FolderCard";
import {
  BrowserApprovalSVG,
  NeuralEngineSVG,
  GroundedDocSVG,
  RadarScoreSVG,
} from "@/components/FeatureIcons";

export default function HomePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  };

  const bentoFeatures = [
    {
      icon: BrowserApprovalSVG,
      badge: "Human-in-the-Loop",
      title: "Zero Blind Submissions",
      description:
        "Playwright navigates the ATS and populates complex forms, but halts at a dedicated review screen for your explicit approval.",
      glow: "from-emerald-500/20 to-teal-500/5",
      accentColor: "emerald",
      previewSnippet: {
        label: "Review Gate",
        value: "Explicit User Approval Required",
      },
    },
    {
      icon: NeuralEngineSVG,
      badge: "Model Agnostic",
      title: "Local Ollama or Cloud LLMs",
      description:
        "Switch between 100% free offline local models (Llama 3, DeepSeek) or OpenRouter cloud models via clean provider abstractions.",
      glow: "from-indigo-500/20 to-purple-500/5",
      accentColor: "indigo",
      previewSnippet: {
        label: "AI Engine",
        value: "Ollama (Offline $0) ⇄ OpenRouter Cloud",
      },
    },
    {
      icon: GroundedDocSVG,
      badge: "Truthful QA",
      title: "Grounded Screening Answers",
      description:
        "Screening responses are derived strictly from your verified profile and resume. Zero hallucinated employers, titles, or certifications.",
      glow: "from-purple-500/20 to-pink-500/5",
      accentColor: "purple",
      previewSnippet: {
        label: "Hallucination Defense",
        value: "100% Grounded in Verified Profile",
      },
    },
    {
      icon: RadarScoreSVG,
      badge: "Explainable Match",
      title: "Transparent Compat Score",
      description:
        "Inspect exact skill matches, partial overlaps, critical qualification gaps, and reasoned justification before applying.",
      glow: "from-cyan-500/20 to-blue-500/5",
      accentColor: "cyan",
      previewSnippet: {
        label: "Scoring Model",
        value: "Deterministic Skills + Seniority Fit",
      },
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-32 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md mb-8"
        >
          <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-xs font-medium text-indigo-300">
            Open-Source Autonomous Career Assistant
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-indigo-400/80" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.12]"
        >
          Supercharge your search with{" "}
          <span className="gradient-accent">transparent AI</span> & browser automation.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed"
        >
          JobPilot digests your resume, matches legitimate job openings with explainable criteria, automates repetitive forms via Playwright, and keeps you firmly in the loop.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link
            href="/register"
            className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-2.5 px-8 py-3.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:from-indigo-400 hover:to-purple-500 transition-all duration-300 cursor-pointer"
          >
            <span>Launch Your Copilot</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <Link
            href="/jobs"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-medium rounded-xl border border-white/10 bg-slate-900/60 hover:bg-slate-800/80 text-slate-200 transition-all duration-200 backdrop-blur-md cursor-pointer"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span>Explore Jobs & Matching</span>
          </Link>
        </motion.div>

        {/* Live Interactive Copilot Preview Box (21st.dev Style Bento Mockup) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="w-full max-w-5xl mt-16 rounded-2xl glass-panel p-2 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent pointer-events-none" />

          {/* Fake Browser Top Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#0c1220]/70 rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <div className="ml-3 px-3 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-[11px] font-mono text-slate-400 flex items-center gap-2">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>jobpilot.internal/agent/session-playwright-ats</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono text-emerald-400">AUTOMATION RUNNER ACTIVE</span>
            </div>
          </div>

          {/* Interactive Simulation Dashboard inside the mockup */}
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Step 1: Matching Card */}
            <div className="glass-panel rounded-xl p-5 border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-indigo-400 tracking-wider">1. Semantic Match</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  92% Match
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white">Staff Backend Engineer</h4>
              <p className="text-xs text-slate-400">Stripe • Remote • Full-time</p>
              
              <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Strong: Python, FastAPI, PostgreSQL</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Partial: Distributed Systems (3+ yrs)</span>
                </div>
              </div>
            </div>

            {/* Step 2: Form Autofill Card */}
            <div className="glass-panel rounded-xl p-5 border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-purple-400 tracking-wider">2. Playwright Agent</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  8/8 Mapped
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-slate-500">Legal Name</span>
                  <span className="font-mono text-slate-300">Aditya Sharma</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-slate-500">Resume Attached</span>
                  <span className="font-mono text-slate-300">resume_swe_2026.pdf</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-slate-500">Work Authorization</span>
                  <span className="font-mono text-emerald-400">Yes (Authorized)</span>
                </div>
              </div>
            </div>

            {/* Step 3: Human Review Gate */}
            <div className="glass-panel rounded-xl p-5 border border-emerald-500/30 bg-emerald-500/[0.02] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-emerald-400 tracking-wider">3. Human Review Gate</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ready for Review
                </span>
              </div>
              <p className="text-xs text-slate-300 italic">
                &ldquo;Why this role? Grounded in 3 years building high-throughput FastAPI services and database migration pipelines...&rdquo;
              </p>
              <div className="pt-2">
                <Link
                  href="/applications"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20"
                >
                  <span>Approve & Submit</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Live Source & ATS Marquee Ticker */}
        <div className="w-full mt-14">
          <SourceMarquee />
        </div>

        {/* Proof by the Numbers (Spring Counter Grid) */}
        <div className="w-full max-w-5xl mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.06] space-y-1">
            <div className="text-3xl font-extrabold text-white flex items-center">
              <SpringCounter value={6} suffix="+" />
            </div>
            <p className="text-xs text-slate-400 font-medium">Job Sources Integrated</p>
            <span className="text-[10px] text-slate-500 font-mono block">LinkedIn, YC, Wellfound, Naukri</span>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/[0.06] space-y-1">
            <div className="text-3xl font-extrabold text-indigo-400 flex items-center">
              <SpringCounter value={95} suffix="%" />
            </div>
            <p className="text-xs text-slate-400 font-medium">Application Data Filled</p>
            <span className="text-[10px] text-slate-500 font-mono block">Playwright Persistent Flow</span>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/[0.06] space-y-1">
            <div className="text-3xl font-extrabold text-emerald-400 flex items-center">
              <SpringCounter value={0} suffix="" />
            </div>
            <p className="text-xs text-slate-400 font-medium">Hallucinated Claims</p>
            <span className="text-[10px] text-emerald-400/80 font-mono block">100% Grounded in Profile</span>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/[0.06] space-y-1">
            <div className="text-3xl font-extrabold text-purple-400 flex items-center">
              <SpringCounter value={100} suffix="%" />
            </div>
            <p className="text-xs text-slate-400 font-medium">Human Control</p>
            <span className="text-[10px] text-slate-500 font-mono block">Review Before Submission</span>
          </div>
        </div>
      </section>

      {/* Bento Grid Feature Matrix */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/[0.06]">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Engineered for reliability, not reckless automation.
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Commercial bots spam hundreds of unqualified applications. JobPilot treats your professional reputation as first priority.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {bentoFeatures.map((feat, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <FolderCard
                index={idx + 1}
                badge={feat.badge}
                title={feat.title}
                description={feat.description}
                icon={feat.icon}
                accentColor={feat.accentColor}
                glowGradient={feat.glow}
                previewSnippet={feat.previewSnippet}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA Footer Section */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="glass-panel rounded-3xl p-10 md:p-14 border border-indigo-500/20 relative overflow-hidden space-y-6">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to take flight in your job search?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Get started in under 2 minutes. Upload your resume, configure your preferred LLM provider, and let JobPilot discover relevant roles.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-xl shadow-indigo-500/25 transition-all cursor-pointer"
            >
              Create Free Account
            </Link>
            <Link
              href="/settings/ai"
              className="w-full sm:w-auto px-7 py-3.5 text-sm font-medium rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-slate-200 transition-all cursor-pointer"
            >
              Configure AI Engine
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
