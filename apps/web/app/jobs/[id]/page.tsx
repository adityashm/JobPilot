"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Job, MatchExplanation } from "@/lib/types";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Sparkles,
  Bookmark,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  Loader2,
  Check,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;

  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (token && jobId) {
      loadJob();
    }
  }, [user, authLoading, token, jobId, router]);

  async function loadJob() {
    if (!token) return;
    try {
      setLoading(true);
      const data = await api.getJob(token, jobId);
      setJob(data);
    } catch (err: any) {
      setError(err.message || "Failed to load job details.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEvaluateMatch() {
    if (!token || !job) return;
    setEvaluating(true);
    setError(null);
    try {
      const match = await api.matchJob(token, job.id);
      setJob({ ...job, match });
      setSuccessMessage("Match evaluated successfully against your verified profile!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to evaluate job match.");
    } finally {
      setEvaluating(false);
    }
  }

  async function handleSaveApplication() {
    if (!token || !job) return;
    setSaving(true);
    setError(null);
    try {
      const app = await api.createApplication(token, { job_id: job.id });
      setJob({
        ...job,
        is_saved: true,
        application_id: app.id,
        application_status: app.status,
      });
      setSuccessMessage("Job saved to your application tracker!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save application.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-xs text-slate-400">
        <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3 text-indigo-500" />
        <span className="font-mono tracking-wider">LOADING JOB SPECIFICATION...</span>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-xs text-slate-400">
        <p className="text-base font-semibold text-white">Job not found.</p>
        <Link href="/jobs" className="text-indigo-400 underline text-xs mt-2 inline-block">
          Return to Job Discovery
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Discovery
        </Link>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </motion.div>
        )}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.08] shadow-xl space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {job.title}
              </h1>
              {job.remote && (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Remote
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
              <span className="font-semibold text-slate-200">
                {job.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {job.location}
              </span>
              {job.salary_min && job.salary_max && (
                <span className="flex items-center gap-1 font-mono text-emerald-400 font-medium">
                  ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {job.is_saved ? (
              <Link
                href={`/applications/${job.application_id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold text-xs hover:bg-emerald-500/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>In Pipeline ({job.application_status})</span>
              </Link>
            ) : (
              <button
                onClick={handleSaveApplication}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-60 cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
                <span>Save & Start Application</span>
              </button>
            )}

            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors"
              title="Open Original Job Posting"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.06]">
          {job.tags.map((t) => (
            <span
              key={t}
              className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-white/[0.03] text-slate-300 border border-white/[0.06]"
            >
              {t}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Explainable Match Evaluation Card (Section 12) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-panel p-6 sm:p-8 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.02] shadow-xl space-y-6"
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-sm sm:text-base">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>Explainable Candidate Fit Evaluation</span>
          </div>

          <button
            onClick={handleEvaluateMatch}
            disabled={evaluating}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 transition-all cursor-pointer"
          >
            {evaluating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>{job.match ? "Re-evaluate Fit" : "Analyze Fit with AI"}</span>
          </button>
        </div>

        {job.match ? (
          <div className="space-y-6">
            {/* Score breakdown metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-4 rounded-xl glass-panel border border-white/[0.06]">
                <span className="text-3xl font-extrabold text-indigo-400 font-mono">
                  {job.match.overall_score}%
                </span>
                <span className="text-[10px] block font-mono text-slate-400 uppercase mt-1">
                  Overall Score
                </span>
              </div>
              <div className="p-4 rounded-xl glass-panel border border-white/[0.06]">
                <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                  {job.match.skill_match}%
                </span>
                <span className="text-[10px] block font-mono text-slate-400 uppercase mt-1">
                  Skills Match
                </span>
              </div>
              <div className="p-4 rounded-xl glass-panel border border-white/[0.06]">
                <span className="text-3xl font-extrabold text-blue-400 font-mono">
                  {job.match.experience_match}%
                </span>
                <span className="text-[10px] block font-mono text-slate-400 uppercase mt-1">
                  Experience Fit
                </span>
              </div>
              <div className="p-4 rounded-xl glass-panel border border-white/[0.06]">
                <span className="text-3xl font-extrabold text-purple-400 font-mono">
                  {job.match.location_match}%
                </span>
                <span className="text-[10px] block font-mono text-slate-400 uppercase mt-1">
                  Location Fit
                </span>
              </div>
            </div>

            {/* Matched skills vs Gaps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl glass-panel border border-emerald-500/20 space-y-3">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Strong Matches ({job.match.matched_skills.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {job.match.matched_skills.length > 0 ? (
                    job.match.matched_skills.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 rounded text-xs font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      >
                        ✓ {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">No exact skill overlaps</span>
                  )}
                </div>
              </div>

              <div className="p-5 rounded-xl glass-panel border border-amber-500/20 space-y-3">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Identified Requirement Gaps
                </span>
                <div className="space-y-1.5">
                  {job.match.missing_requirements.length > 0 ? (
                    job.match.missing_requirements.map((g, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-amber-300 flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span>{g}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">No critical qualification gaps</span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Grounded Reasoning */}
            <div className="p-4 rounded-xl glass-panel border border-white/[0.06] text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold block text-white mb-1.5">
                Evaluation Reasoning:
              </span>
              <p className="italic text-slate-300">{job.match.reasoning}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400">
            Click &ldquo;Analyze Fit with AI&rdquo; to compare your verified profile against this role.
          </div>
        )}
      </motion.div>

      {/* Full Description Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.08] shadow-xl space-y-4"
      >
        <h2 className="text-base font-bold text-white tracking-tight">
          Full Role Description
        </h2>
        <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
          {job.description}
        </div>
      </motion.div>
    </div>
  );
}
