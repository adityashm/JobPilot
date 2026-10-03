"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  ShieldCheck,
  ChevronRight,
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

const STATUS_BADGES: Record<string, { bg: string; text: string; dot: string }> = {
  SAVED: { bg: "bg-slate-500/10 border-slate-500/20", text: "text-slate-300", dot: "bg-slate-400" },
  REVIEW: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-300", dot: "bg-amber-400" },
  READY: { bg: "bg-cyan-500/10 border-cyan-500/20", text: "text-cyan-300", dot: "bg-cyan-400" },
  APPLIED: { bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-300", dot: "bg-blue-400" },
  SCREENING: { bg: "bg-indigo-500/10 border-indigo-500/20", text: "text-indigo-300", dot: "bg-indigo-400" },
  INTERVIEW: { bg: "bg-purple-500/10 border-purple-500/20", text: "text-purple-300", dot: "bg-purple-400" },
  OFFER: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-300", dot: "bg-emerald-400" },
  REJECTED: { bg: "bg-rose-500/10 border-rose-500/20", text: "text-rose-300", dot: "bg-rose-400" },
  WITHDRAWN: { bg: "bg-zinc-500/10 border-zinc-500/20", text: "text-zinc-400", dot: "bg-zinc-400" },
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6"
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>HUMAN-IN-THE-LOOP TRACKING</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Application Pipeline & Review Gate
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Supervise Playwright form preparation, audit screening QA answers, and approve submissions.
          </p>
        </div>

        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 transition-all self-start md:self-auto cursor-pointer"
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Discover Roles</span>
        </Link>
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
      </AnimatePresence>

      {/* Status Filter Tabs with Animated Pill */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {STATUSES.map((st) => {
          const count =
            st === "ALL"
              ? applications.length
              : applications.filter((a) => a.status === st).length;
          const isActive = activeStatus === st;
          return (
            <button
              key={st}
              onClick={() => setActiveStatus(st)}
              className={`relative px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                isActive ? "text-white font-semibold" : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="statusPill"
                  className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/[0.12] -z-10 shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span>{st}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive
                    ? "bg-indigo-500/30 text-indigo-200 border border-indigo-500/40"
                    : "bg-white/[0.04] text-slate-400"
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
          <div className="text-center py-20 text-xs text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3 text-indigo-500" />
            <span className="font-mono tracking-wider">LOADING APPLICATION TRACKER...</span>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center rounded-2xl glass-panel border border-white/[0.08] text-slate-400 space-y-3">
            <p className="font-semibold text-white">
              No applications with status &ldquo;{activeStatus}&rdquo;.
            </p>
            <p className="text-xs text-slate-500">
              Save jobs from Job Discovery to start preparing automated applications.
            </p>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 pt-2"
            >
              Discover Roles <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredApps.map((app, idx) => {
              const badge = STATUS_BADGES[app.status] || STATUS_BADGES.SAVED;
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.4) }}
                  className="glass-panel p-5 rounded-2xl border border-white/[0.08] hover:border-indigo-500/30 transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Link
                        href={`/applications/${app.id}`}
                        className="text-base font-bold text-white hover:text-indigo-300 transition-colors"
                      >
                        {app.job?.title || "Job Application"}
                      </Link>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border ${badge.bg} ${badge.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {app.status}
                      </span>
                      {app.match_score && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          {app.match_score}% Fit
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      <span className="font-semibold text-slate-200">
                        {app.job?.company}
                      </span>
                      <span>{app.job?.location}</span>
                      {app.resume && (
                        <span className="flex items-center gap-1 font-mono text-slate-400">
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          {app.resume.filename}
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-slate-500">
                        Created {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {app.notes && (
                      <p className="text-xs text-slate-400 italic line-clamp-1">
                        Note: {app.notes}
                      </p>
                    )}
                  </div>

                  {/* Status selector & Actions */}
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      className="px-2.5 py-1.5 text-xs font-mono rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 focus:outline-none focus:border-indigo-500/50"
                    >
                      {STATUSES.filter((s) => s !== "ALL").map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>

                    <Link
                      href={`/applications/${app.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                    >
                      <span>Human Review Gate</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => handleDelete(app.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20 cursor-pointer"
                      title="Delete application"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
