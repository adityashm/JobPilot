"use client";

import Link from "next/link";
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Search,
  CheckCircle2,
  FileCheck,
  Bot,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const steps = [
    { title: "Discover", desc: "Aggregates legitimate listings without fragile bypasses" },
    { title: "Filter", desc: "Deterministic filtering by location, role, and salary" },
    { title: "Understand", desc: "Deep resume semantic analysis & structured career profile" },
    { title: "Match", desc: "Explainable criteria: matches, partials, gaps, and grounded reasoning" },
    { title: "Review", desc: "Inspect every prepared answer before any application is sent" },
    { title: "Track", desc: "Real-time timeline and analytics across your entire pipeline" },
  ];

  const highlights = [
    {
      icon: ShieldCheck,
      title: "Human-in-the-Loop Always",
      desc: "JobPilot automates tedious form filling with Playwright, but requires your explicit approval before any application is submitted.",
    },
    {
      icon: Cpu,
      title: "Model-Agnostic AI",
      desc: "Built with provider abstraction. Run with zero API cost locally via Ollama, or scale with OpenRouter & cloud models.",
    },
    {
      icon: Sparkles,
      title: "Grounded & Truthful",
      desc: "Screening answers are generated strictly from your real profile and resume. Zero hallucinated jobs, degrees, or certifications.",
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 text-xs font-semibold">
          <Compass className="w-3.5 h-3.5" />
          <span>Production-Quality Open-Source Career Assistant</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
          Supercharge your job search with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400">
            transparent AI
          </span>{" "}
          & automated form filling.
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          JobPilot parses your resume, matches jobs with explainable criteria, automates repetitive application fields via browser agents, and keeps you in full control.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-sky-600/20 transition-all hover:shadow-sky-600/30 cursor-pointer"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-7 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-base hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            Sign In to Workspace
          </Link>
        </div>
      </section>

      {/* Core Principle Pipeline */}
      <section className="py-16 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              The JobPilot Workflow
            </h2>
            <p className="text-sm text-slate-500">
              Deterministic precision where possible, semantic AI where valuable.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {steps.map((st, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2"
              >
                <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                  {st.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Highlights */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {highlights.map((h, i) => {
            const Icon = h.icon;
            return (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {h.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {h.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
