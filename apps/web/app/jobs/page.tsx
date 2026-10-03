"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Job, MatchExplanation } from "@/lib/types";
import {
  Briefcase,
  Search,
  MapPin,
  DollarSign,
  Sparkles,
  Bookmark,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
  Filter,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function JobsPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [matchingJobId, setMatchingJobId] = useState<string | null>(null);
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [query, setQuery] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [minSalary, setMinSalary] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (token) {
      loadJobs();
    }
  }, [user, authLoading, token, router]);

  async function loadJobs() {
    if (!token) return;
    try {
      setLoading(true);
      const data = await api.listJobs(token, {
        query: query || undefined,
        remote: remoteOnly ? true : undefined,
        min_salary: minSalary ? Number(minSalary) : undefined,
      });
      if (data.length === 0) {
        await handleDiscover();
      } else {
        setJobs(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDiscover(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!token) return;

    setError(null);
    setSearching(true);
    try {
      const discovered = await api.searchJobs(token, {
        query: query || undefined,
        remote: remoteOnly ? true : undefined,
        salary_min: minSalary ? Number(minSalary) : undefined,
        limit: 25,
      });
      setJobs(discovered);
      setSuccessMessage(`Discovered ${discovered.length} relevant job opportunities!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to discover jobs.");
    } finally {
      setSearching(false);
    }
  }

  async function handleAnalyzeMatch(jobId: string) {
    if (!token) return;
    setMatchingJobId(jobId);
    try {
      const match = await api.matchJob(token, jobId);
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, match } : j))
      );
    } catch (err: any) {
      setError(err.message || "Failed to evaluate job match.");
    } finally {
      setMatchingJobId(null);
    }
  }

  async function handleSaveApplication(jobId: string) {
    if (!token) return;
    setSavingJobId(jobId);
    try {
      const app = await api.createApplication(token, { job_id: jobId });
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? { ...j, is_saved: true, application_id: app.id, application_status: app.status }
            : j
        )
      );
      setSuccessMessage("Job saved to your application pipeline!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save job to applications.");
    } finally {
      setSavingJobId(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6"
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
            <Sparkles className="w-3 h-3" />
            <span>EXPLAINABLE MATCHING ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Job Discovery & Transparency Matching
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Browse legitimate job feeds, filter deterministically, and view grounded match explanations.
          </p>
        </div>

        <button
          onClick={handleDiscover}
          disabled={searching}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-60 self-start md:self-auto"
        >
          {searching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Fetching Listings...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Discover New Jobs</span>
            </>
          )}
        </button>
      </motion.div>

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

      {/* Search & Filter Toolbar */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        onSubmit={handleDiscover}
        className="glass-panel p-4 rounded-2xl border border-white/[0.08] shadow-lg flex flex-col md:flex-row items-center gap-3"
      >
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roles, skills, or companies (e.g. Python, FastAPI, React)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-white/[0.08] bg-white/[0.02] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-sans"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs font-medium text-slate-300 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => setRemoteOnly(e.target.checked)}
              className="rounded accent-indigo-600"
            />
            <span>Remote Only</span>
          </label>

          <div className="w-36">
            <select
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 focus:outline-none focus:border-indigo-500/50"
            >
              <option value="">Any Salary</option>
              <option value="80000">$80,000+</option>
              <option value="100000">$100,000+</option>
              <option value="120000">$120,000+</option>
              <option value="150000">$150,000+</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white transition-colors shrink-0 cursor-pointer"
          >
            Filter
          </button>
        </div>
      </motion.form>

      {/* Jobs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 text-xs text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3 text-indigo-500" />
            <span className="font-mono tracking-wider">RETRIEVING NORMALIZED JOB OPPORTUNITIES...</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 p-8 rounded-2xl glass-panel border border-white/[0.08] text-slate-400 space-y-2">
            <p className="text-base font-semibold text-white">
              No matching listings found.
            </p>
            <p className="text-xs text-slate-500">
              Click &ldquo;Discover New Jobs&rdquo; above to query active career sources.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job, idx) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.5) }}
                className="glass-panel p-6 rounded-2xl border border-white/[0.08] hover:border-indigo-500/30 transition-all shadow-md space-y-4 relative group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-base sm:text-lg font-bold text-white hover:text-indigo-300 transition-colors"
                      >
                        {job.title}
                      </Link>
                      {job.remote && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Remote
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                        {job.employment_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-1.5 flex-wrap">
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
                      <span className="text-[11px] font-mono text-slate-500">
                        source: {job.source}
                      </span>
                    </div>
                  </div>

                  {/* Match Fit Score Pill */}
                  <div className="flex items-center gap-2 self-start">
                    {job.match ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-xs font-mono font-bold">{job.match.overall_score}% Match</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAnalyzeMatch(job.id)}
                        disabled={matchingJobId === job.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-300 transition-all cursor-pointer"
                      >
                        {matchingJobId === job.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                        <span>Analyze Match</span>
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                {/* Match Explanation Breakdown Snippet */}
                {job.match && (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs space-y-2">
                    <p className="text-slate-300 italic">
                      &ldquo;{job.match.reasoning}&rdquo;
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
                      {job.match.matched_skills.length > 0 && (
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Matched: {job.match.matched_skills.join(", ")}</span>
                        </div>
                      )}
                      {job.match.missing_requirements.length > 0 && (
                        <div className="flex items-center gap-1.5 text-amber-400">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Gaps: {job.match.missing_requirements.slice(0, 2).join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags & Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
                  <div className="flex flex-wrap gap-1.5">
                    {job.tags?.slice(0, 6).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/[0.03] text-slate-400 border border-white/[0.04]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="px-3.5 py-1.5 text-xs font-medium rounded-xl border border-white/[0.08] hover:bg-white/[0.06] text-slate-300 transition-colors"
                    >
                      View Details
                    </Link>

                    {job.is_saved ? (
                      <Link
                        href={`/applications/${job.application_id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>In Pipeline ({job.application_status})</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleSaveApplication(job.id)}
                        disabled={savingJobId === job.id}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-60"
                      >
                        {savingJobId === job.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Bookmark className="w-3.5 h-3.5" />
                        )}
                        <span>Save & Apply</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
