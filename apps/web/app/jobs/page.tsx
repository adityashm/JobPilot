"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
      // If DB has no jobs yet, auto-trigger initial discovery
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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Briefcase className="w-7 h-7 text-sky-600" />
            Job Discovery & Grounded Matching
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Discover normalized listings and evaluate transparent, explainable fit against your verified skills.
          </p>
        </div>

        <button
          onClick={handleDiscover}
          disabled={searching}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-colors shadow-sm cursor-pointer disabled:opacity-60 self-start md:self-auto"
        >
          {searching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Discovering...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Discover New Jobs
            </>
          )}
        </button>
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

      {/* Search & Filter Toolbar */}
      <form
        onSubmit={handleDiscover}
        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-center gap-3"
      >
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, technology, or company (e.g. Python, FastAPI, React)..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => setRemoteOnly(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500"
            />
            <span>Remote Only</span>
          </label>

          <div className="w-36">
            <select
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              className="w-full px-2 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
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
            className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 transition-colors shrink-0"
          >
            Apply Filters
          </button>
        </div>
      </form>

      {/* Jobs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-16 text-sm text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
            Loading job listings...
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500">
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No jobs matching criteria found.
            </p>
            <p className="text-xs mt-1">
              Click "Discover New Jobs" above to fetch fresh job postings from our discovery sources.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-lg font-bold text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                      >
                        {job.title}
                      </Link>
                      {job.remote && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          Remote
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {job.employment_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.location}
                      </span>
                      {job.salary_min && job.salary_max && (
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <DollarSign className="w-3.5 h-3.5" />
                          ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        via {job.source}
                      </span>
                    </div>
                  </div>

                  {/* Match Fit Score */}
                  <div className="flex items-center gap-2 self-start">
                    {job.match ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300">
                        <Sparkles className="w-4 h-4 text-sky-600" />
                        <span className="text-xs font-bold">{job.match.overall_score}% Match</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAnalyzeMatch(job.id)}
                        disabled={matchingJobId === job.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        {matchingJobId === job.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        Analyze Match
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                {/* Match Explanation breakdown snippet if available */}
                {job.match && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs space-y-2">
                    <p className="text-slate-700 dark:text-slate-300 italic">
                      "{job.match.reasoning}"
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px]">
                      {job.match.matched_skills.length > 0 && (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Matched: {job.match.matched_skills.join(", ")}</span>
                        </div>
                      )}
                      {job.match.missing_requirements.length > 0 && (
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Gaps: {job.match.missing_requirements.slice(0, 2).join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags & Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex flex-wrap gap-1.5">
                    {job.tags?.slice(0, 6).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      View Details
                    </Link>

                    {job.is_saved ? (
                      <Link
                        href={`/applications/${job.application_id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        In Pipeline ({job.application_status})
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleSaveApplication(job.id)}
                        disabled={savingJobId === job.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer disabled:opacity-60"
                      >
                        {savingJobId === job.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Bookmark className="w-3.5 h-3.5" />
                        )}
                        Save & Apply
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
