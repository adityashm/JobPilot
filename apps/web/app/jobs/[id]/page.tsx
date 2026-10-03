"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
        Loading job posting...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-slate-500">
        <p className="font-semibold text-slate-800 dark:text-slate-200">Job not found.</p>
        <Link href="/jobs" className="text-sky-600 underline text-xs mt-2 inline-block">
          Return to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-sky-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Job Discovery
        </Link>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Header Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {job.title}
              </h1>
              {job.remote && (
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Remote
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-2 flex-wrap">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {job.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.location}
              </span>
              {job.salary_min && job.salary_max && (
                <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                  <DollarSign className="w-4 h-4" />
                  ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {job.is_saved ? (
              <Link
                href={`/applications/${job.application_id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                In Pipeline ({job.application_status})
              </Link>
            ) : (
              <button
                onClick={handleSaveApplication}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
                Save & Start Application
              </button>
            )}

            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              title="Open Original Job Posting"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {job.tags.map((t) => (
            <span
              key={t}
              className="px-2.5 py-1 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Explainable Match Evaluation Card (Section 12) */}
      <div className="p-6 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/30 dark:bg-sky-950/20 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300 font-bold text-base">
            <Sparkles className="w-5 h-5 text-sky-600" />
            <span>Explainable Candidate Fit Evaluation</span>
          </div>

          <button
            onClick={handleEvaluateMatch}
            disabled={evaluating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
          >
            {evaluating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            )}
            {job.match ? "Re-evaluate Match" : "Analyze Fit with AI"}
          </button>
        </div>

        {job.match ? (
          <div className="space-y-4">
            {/* Score breakdown metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-2xl font-black text-sky-600 dark:text-sky-400">
                  {job.match.overall_score}%
                </span>
                <span className="text-[11px] block font-medium text-slate-500 uppercase mt-0.5">
                  Overall Fit
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {job.match.skill_match}%
                </span>
                <span className="text-[11px] block font-medium text-slate-500 uppercase mt-0.5">
                  Skill Match
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {job.match.experience_match}%
                </span>
                <span className="text-[11px] block font-medium text-slate-500 uppercase mt-0.5">
                  Experience Fit
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                  {job.match.location_match}%
                </span>
                <span className="text-[11px] block font-medium text-slate-500 uppercase mt-0.5">
                  Location Fit
                </span>
              </div>
            </div>

            {/* Matched skills vs Gaps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Strong Matches ({job.match.matched_skills.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {job.match.matched_skills.length > 0 ? (
                    job.match.matched_skills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      >
                        ✓ {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No exact skill overlaps</span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Potential Gaps / Unverified
                </span>
                <div className="space-y-1">
                  {job.match.missing_requirements.length > 0 ? (
                    job.match.missing_requirements.map((g, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span>{g}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No significant requirement gaps identified</span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Grounded Reasoning */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="font-semibold block text-slate-900 dark:text-white mb-1">
                Fit Analysis Summary:
              </span>
              <p>{job.match.reasoning}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-500">
            Click "Analyze Fit with AI" to evaluate how your skills and experience match this role.
          </div>
        )}
      </div>

      {/* Full Description Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Job Description
        </h2>
        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {job.description}
        </div>
      </div>
    </div>
  );
}
