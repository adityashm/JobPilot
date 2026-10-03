"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Job, Application, AnalyticsData } from "@/lib/types";
import {
  Compass,
  Briefcase,
  CheckCircle,
  Clock,
  Search,
  Upload,
  ArrowRight,
  TrendingUp,
  FileText,
  ShieldCheck,
  Building,
  MapPin,
  Calendar,
  Sparkles,
  Loader2,
  ExternalLink,
  ChevronRight,
  Layers,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (token) {
      loadDashboardData();
    }
  }, [user, authLoading, token, router]);

  async function loadDashboardData() {
    if (!token) return;
    try {
      setLoading(true);
      const [analyticsData, jobsData, appsData] = await Promise.all([
        api.getAnalytics(token).catch(() => null),
        api.listJobs(token, { limit: 4 }).catch(() => []),
        api.listApplications(token).catch(() => []),
      ]);
      setAnalytics(analyticsData);
      setRecommendedJobs(jobsData);
      setRecentApplications(appsData.slice(0, 5));
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || (!user && loading)) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-400 font-mono tracking-wider">SYNCING AGENTIC WORKSPACE...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const profile = user.profile;

  const stats = [
    {
      label: "Discovered Roles",
      value: analytics ? String(analytics.jobs_discovered) : "0",
      delta: "From active feeds",
      icon: Search,
      glow: "from-blue-500/20 to-indigo-500/5",
      accent: "text-blue-400",
      border: "border-blue-500/20",
    },
    {
      label: "Semantic Matches",
      value: analytics ? String(analytics.jobs_matched) : "0",
      delta: "Explainable scores",
      icon: Sparkles,
      glow: "from-indigo-500/20 to-purple-500/5",
      accent: "text-indigo-400",
      border: "border-indigo-500/20",
    },
    {
      label: "Review Gate Queue",
      value: analytics ? String((analytics.status_breakdown?.REVIEW || 0) + (analytics.status_breakdown?.SAVED || 0)) : "0",
      delta: "Awaiting approval",
      icon: Clock,
      glow: "from-amber-500/20 to-orange-500/5",
      accent: "text-amber-400",
      border: "border-amber-500/20",
    },
    {
      label: "Applications Sent",
      value: analytics ? String(analytics.applications_applied || 0) : "0",
      delta: analytics ? `${analytics.response_rate}% response rate` : "0% response rate",
      icon: CheckCircle,
      glow: "from-emerald-500/20 to-teal-500/5",
      accent: "text-emerald-400",
      border: "border-emerald-500/20",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-panel border border-white/[0.08] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              PILOT AGENT SYSTEM READY
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, {user.full_name || user.email.split("@")[0]}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Your human-in-the-loop application assistant is monitoring opportunities, mapping form fields, and preparing truthful screening responses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Link
            href="/profile/resume"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Upload Resume</span>
          </Link>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Discover Roles</span>
          </Link>
        </div>
      </motion.div>

      {/* Metric Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className={`glass-panel border ${stat.border} rounded-xl p-5 relative group overflow-hidden shadow-lg`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
              />

              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    {stat.label}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                    <Icon className={`w-4 h-4 ${stat.accent}`} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    {stat.delta}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Candidate Profile Card */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-panel border border-white/[0.08] rounded-2xl p-6 space-y-6 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <h2 className="font-semibold text-sm text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Verified Profile
            </h2>
            <Link
              href="/profile"
              className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Edit <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">Target Role</span>
              <p className="font-medium text-slate-200 mt-0.5">
                {profile?.headline || "Software Engineer / Candidate"}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">Location & Remote</span>
              <p className="font-medium text-slate-300 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {profile?.location || "Remote / Global"}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">Experience Level</span>
              <p className="font-medium text-slate-300 mt-0.5">
                {profile?.experience_years ? `${profile.experience_years} years industry experience` : "Entry-level / Early career"}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block mb-2">
                Grounding Skills ({profile?.skills?.length || 0})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile?.skills && profile.skills.length > 0 ? (
                  profile.skills.slice(0, 8).map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-[11px] font-mono rounded bg-white/[0.04] border border-white/[0.08] text-slate-300"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">
                    Upload your resume to extract verified skills.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.08]">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/20 text-emerald-400 text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Grounded QA active: 0% hallucinations guaranteed</span>
            </div>
          </div>
        </motion.div>

        {/* Right Columns: Recommended Jobs & Pipeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recommended Jobs */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-panel border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="font-semibold text-sm text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Featured Discovered Jobs
              </h2>
              <Link
                href="/jobs"
                className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                Browse All ({analytics?.jobs_discovered || 0}) <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {recommendedJobs.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 space-y-3">
                <p>No jobs discovered yet in your local database.</p>
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md"
                >
                  <Search className="w-3.5 h-3.5" /> Start Job Search
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendedJobs.map((job) => (
                  <motion.div
                    key={job.id}
                    whileHover={{ y: -2 }}
                    className="p-4 rounded-xl border border-white/[0.08] hover:border-indigo-500/40 bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="font-semibold text-sm text-white hover:text-indigo-300 transition-colors line-clamp-1"
                        >
                          {job.title}
                        </Link>
                        {job.remote && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                            Remote
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {job.company} • {job.location}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
                      {job.salary_min ? (
                        <span className="font-mono text-slate-300">
                          ${(job.salary_min / 1000).toFixed(0)}k - ${(job.salary_max! / 1000).toFixed(0)}k
                        </span>
                      ) : (
                        <span className="text-slate-500">Competitive</span>
                      )}

                      <Link
                        href={`/jobs/${job.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                      >
                        Inspect Fit <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent Applications Pipeline */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-panel border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="font-semibold text-sm text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Active Applications Pipeline
              </h2>
              <Link
                href="/applications"
                className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                Full Pipeline ({analytics?.applications_total || 0}) <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {recentApplications.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 space-y-2">
                <p>No active applications in queue.</p>
                <p className="text-[11px] text-slate-500">
                  Select a job and click &ldquo;Prepare Application&rdquo; to test the automated browser agent.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {recentApplications.map((app) => (
                  <div
                    key={app.id}
                    className="py-3 flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <Link
                        href={`/applications/${app.id}`}
                        className="font-semibold text-white hover:text-indigo-300 transition-colors"
                      >
                        {app.job?.title || "Job Application"}
                      </Link>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {app.job?.company} • Updated {new Date(app.updated_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-white/[0.04] border border-white/[0.08] text-slate-300">
                        {app.status}
                      </span>
                      <Link
                        href={`/applications/${app.id}`}
                        className="text-indigo-400 font-semibold hover:text-indigo-300"
                      >
                        Review Gate
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
