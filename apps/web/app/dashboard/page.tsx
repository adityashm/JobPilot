"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  UserCheck,
  ShieldCheck,
  Building,
  MapPin,
  Calendar,
  Sparkles,
  Loader2,
  DollarSign,
  Bookmark,
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
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading JobPilot workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const profile = user.profile;

  const stats = [
    {
      label: "Jobs Discovered",
      value: analytics ? String(analytics.jobs_discovered) : "0",
      delta: "From active sources",
      icon: Search,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      label: "Matches Evaluated",
      value: analytics ? String(analytics.jobs_matched) : "0",
      delta: "Explainable fit",
      icon: Sparkles,
      color: "text-sky-600",
      bg: "bg-sky-50 dark:bg-sky-950/40",
    },
    {
      label: "In Review / Pipeline",
      value: analytics ? String((analytics.status_breakdown?.REVIEW || 0) + (analytics.status_breakdown?.SAVED || 0)) : "0",
      delta: "Human-in-the-loop",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    },
    {
      label: "Applications Submitted",
      value: analytics ? String(analytics.applications_applied || 0) : "0",
      delta: analytics ? `${analytics.response_rate}% response rate` : "0% response rate",
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              JobPilot Production MVP Operational
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome, {user.full_name || user.email.split("@")[0]}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            AI-powered job discovery, grounded match explanation, and human-in-the-loop application assistant.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/profile/resume"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Upload Resume
          </Link>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Search className="w-4 h-4 text-sky-600" />
            Discover Jobs
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {stat.label}
                </span>
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                  {stat.delta}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Candidate Profile Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-600" />
              Candidate Profile
            </h2>
            <Link
              href="/profile"
              className="text-xs font-medium text-sky-600 hover:text-sky-500"
            >
              Edit &rarr;
            </Link>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <span className="text-xs text-slate-400 block uppercase font-medium">Headline</span>
              <p className="font-medium text-slate-800 dark:text-slate-200">
                {profile?.headline || "Software Engineer / Candidate"}
              </p>
            </div>

            <div>
              <span className="text-xs text-slate-400 block uppercase font-medium">Location</span>
              <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {profile?.location || "Remote / Anywhere"}
              </p>
            </div>

            <div>
              <span className="text-xs text-slate-400 block uppercase font-medium">Experience</span>
              <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                {profile?.experience_years ? `${profile.experience_years} years` : "0 years"}
              </p>
            </div>

            <div>
              <span className="text-xs text-slate-400 block uppercase font-medium mb-1.5">
                Verified Skills ({profile?.skills?.length || 0})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile?.skills && profile.skills.length > 0 ? (
                  profile.skills.slice(0, 8).map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-xs rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Upload a resume or edit profile to add verified skills.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Grounded matching guard: Never claims unsupported skills</span>
            </div>
          </div>
        </div>

        {/* Right Columns: Recommended Jobs & Recent Applications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recommended Jobs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-sky-600" />
                Featured Recommended Jobs
              </h2>
              <Link
                href="/jobs"
                className="text-xs font-semibold text-sky-600 hover:text-sky-500"
              >
                Browse All ({analytics?.jobs_discovered || 0}) &rarr;
              </Link>
            </div>

            {recommendedJobs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 space-y-2">
                <p>No jobs discovered yet.</p>
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 text-white font-medium text-xs"
                >
                  <Search className="w-3.5 h-3.5" /> Discover Jobs Now
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 bg-slate-50/50 dark:bg-slate-950/40 transition-all space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="font-bold text-sm text-slate-900 dark:text-white hover:text-sky-600 transition-colors line-clamp-1"
                        >
                          {job.title}
                        </Link>
                        {job.remote && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                            Remote
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {job.company} • {job.location}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                      {job.salary_min ? (
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          ${(job.salary_min / 1000).toFixed(0)}k - ${(job.salary_max! / 1000).toFixed(0)}k
                        </span>
                      ) : (
                        <span className="text-slate-400">Competitive</span>
                      )}

                      <Link
                        href={`/jobs/${job.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline"
                      >
                        Details <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Applications Pipeline */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Active Applications Pipeline
              </h2>
              <Link
                href="/applications"
                className="text-xs font-semibold text-sky-600 hover:text-sky-500"
              >
                View Pipeline ({analytics?.applications_total || 0}) &rarr;
              </Link>
            </div>

            {recentApplications.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 space-y-2">
                <p>No active applications yet.</p>
                <p className="text-[11px] text-slate-400">
                  Save jobs to prepare grounded answers and submit with human approval.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentApplications.map((app) => (
                  <div
                    key={app.id}
                    className="py-3 flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <Link
                        href={`/applications/${app.id}`}
                        className="font-bold text-slate-900 dark:text-white hover:text-sky-600 transition-colors"
                      >
                        {app.job?.title || "Job Application"}
                      </Link>
                      <p className="text-slate-500">
                        {app.job?.company} • Updated {new Date(app.updated_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {app.status}
                      </span>
                      <Link
                        href={`/applications/${app.id}`}
                        className="text-sky-600 font-semibold hover:underline"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
