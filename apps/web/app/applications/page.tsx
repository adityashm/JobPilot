"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Application } from "@/lib/types";
import {
  CheckCircle2,
  Clock,
  Briefcase,
  Sparkles,
  ArrowRight,
  Trash2,
  AlertCircle,
  FileText,
  Loader2,
  Filter,
} from "lucide-react";

const STATUSES = [
  "ALL",
  "SAVED",
  "REVIEW",
  "READY",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
];

const STATUS_COLORS: Record<string, string> = {
  SAVED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300",
  REVIEW: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300",
  READY: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300",
  APPLIED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300",
  SCREENING: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300",
  INTERVIEW: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300",
  OFFER: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300",
  WITHDRAWN: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-300",
};

export default function ApplicationsPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [applications, setApplications] = useState<Application[]>([]);
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (token) {
      loadApplications();
    }
  }, [user, authLoading, token, router]);

  async function loadApplications() {
    if (!token) return;
    try {
      setLoading(true);
      const data = await api.listApplications(token);
      setApplications(data);
    } catch (err: any) {
      setError(err.message || "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(applicationId: number, newStatus: string) {
    if (!token) return;
    try {
      await api.updateApplication(token, applicationId, { status: newStatus });
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app))
      );
    } catch (err: any) {
      setError(err.message || "Failed to update status.");
    }
  }

  async function handleDelete(applicationId: number) {
    if (!token) return;
    if (!confirm("Are you sure you want to remove this application?")) return;
    try {
      await api.deleteApplication(token, applicationId);
      setApplications((prev) => prev.filter((app) => app.id !== applicationId));
    } catch (err: any) {
      setError(err.message || "Failed to delete application.");
    }
  }

  const filteredApps =
    activeStatus === "ALL"
      ? applications
      : applications.filter((a) => a.status === activeStatus);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <CheckCircle2 className="w-7 h-7 text-sky-600" />
            Application Pipeline & Tracker
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Track status transitions, review prefilled forms, and manage your entire application lifecycle.
          </p>
        </div>

        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-colors shadow-sm self-start md:self-auto"
        >
          <Briefcase className="w-4 h-4" />
          Find More Jobs
        </Link>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        {STATUSES.map((st) => {
          const count =
            st === "ALL"
              ? applications.length
              : applications.filter((a) => a.status === st).length;
          return (
            <button
              key={st}
              onClick={() => setActiveStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeStatus === st
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <span>{st}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeStatus === st
                    ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Applications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-16 text-sm text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
            Loading application pipeline...
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 space-y-3">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              No applications with status "{activeStatus}".
            </p>
            <p className="text-xs">
              Save jobs from Job Discovery to start preparing applications!
            </p>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:underline pt-2"
            >
              Browse Jobs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Link
                      href={`/applications/${app.id}`}
                      className="text-base font-bold text-slate-900 dark:text-white hover:text-sky-600 transition-colors"
                    >
                      {app.job?.title || "Job Application"}
                    </Link>
                    <span
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold border uppercase tracking-wider ${
                        STATUS_COLORS[app.status] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {app.status}
                    </span>
                    {app.match_score && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        <Sparkles className="w-3 h-3 text-sky-600" />
                        {app.match_score}% Fit
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {app.job?.company}
                    </span>
                    <span>{app.job?.location}</span>
                    {app.resume && (
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <FileText className="w-3 h-3" />
                        {app.resume.filename}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      Discovered {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {app.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-1">
                      Note: {app.notes}
                    </p>
                  )}
                </div>

                {/* Status selector & Actions */}
                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <div className="relative">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500"
                    >
                      {STATUSES.filter((s) => s !== "ALL").map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Link
                    href={`/applications/${app.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors"
                  >
                    Human Review <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => handleDelete(app.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Delete application"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
