"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  User,
  Briefcase,
  MapPin,
  Phone,
  Globe,
  Link2,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { ProfileNav } from "@/components/ProfileNav";


export default function ProfilePage() {
  const router = useRouter();
  const { user, token, isLoading, refreshUser } = useAuth();

  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const [skillsText, setSkillsText] = useState("");
  const [targetRolesText, setTargetRolesText] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  // Work Authorization & Answers Bank (Section 7 & 14)
  const [authorizedInUs, setAuthorizedInUs] = useState(true);
  const [requiresSponsorship, setRequiresSponsorship] = useState(false);
  const [workVisaStatus, setWorkVisaStatus] = useState("Citizen");
  const [noticePeriod, setNoticePeriod] = useState("Immediate");
  const [willingToRelocate, setWillingToRelocate] = useState("Yes");
  const [minimumSalary, setMinimumSalary] = useState<number | string>("");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (user?.profile) {
      setHeadline(user.profile.headline || "");
      setLocation(user.profile.location || "");
      setPhone(user.profile.phone || "");
      setExperienceYears(user.profile.experience_years || 0);
      setSkillsText(user.profile.skills?.join(", ") || "");
      setTargetRolesText(user.profile.target_roles?.join(", ") || "");
      setLinkedinUrl(user.profile.linkedin_url || "");
      setGithubUrl(user.profile.github_url || "");
      setPortfolioUrl(user.profile.portfolio_url || "");

      const auth = user.profile.work_authorization || {};
      setAuthorizedInUs(auth.authorized_in_us ?? true);
      setRequiresSponsorship(auth.requires_sponsorship ?? false);
      setWorkVisaStatus(auth.work_visa_status || "Citizen");

      const answers = user.profile.application_answers || {};
      setNoticePeriod(answers.notice_period || "Immediate");
      setWillingToRelocate(answers.willing_to_relocate || "Yes");

      const prefs = user.profile.preferences || {};
      setMinimumSalary(prefs.minimum_salary ?? "");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    const skills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const target_roles = targetRolesText
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    try {
      await api.updateProfile(token, {
        headline,
        location,
        phone,
        experience_years: Number(experienceYears),
        skills,
        target_roles,
        linkedin_url: linkedinUrl || null,
        github_url: githubUrl || null,
        portfolio_url: portfolioUrl || null,
        work_authorization: {
          authorized_in_us: authorizedInUs,
          requires_sponsorship: requiresSponsorship,
          work_visa_status: workVisaStatus,
        },
        application_answers: {
          notice_period: noticePeriod,
          willing_to_relocate: willingToRelocate,
        },
        preferences: {
          ...(user.profile?.preferences || {}),
          minimum_salary: minimumSalary ? Number(minimumSalary) : null,
        },
      });

      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Career Profile
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Define your verified skills and target roles. JobPilot matching uses strictly this grounded data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/profile/resume"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 text-sm font-medium transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-sky-600" />
            Upload Resume
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-colors shadow-sm cursor-pointer disabled:opacity-60"
          >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Profile
            </>
          )}
          </button>
        </div>
      </div>


      <ProfileNav />


      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3 text-sm text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Profile changes successfully updated and saved to database!</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center gap-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Career Attributes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-sky-600" />
            Core Career Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Professional Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Senior Fullstack Engineer / Python & React Specialist"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ghaziabad, India / Remote"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Years of Experience
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={experienceYears}
                onChange={(e) => setExperienceYears(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Verified Skills (Comma separated)
              </label>
              <input
                type="text"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="Python, FastAPI, React, PostgreSQL, Docker, Playwright, TypeScript"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                These skills will be used in Phase 4 for transparent, explainable match score computation.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Target Roles (Comma separated)
              </label>
              <input
                type="text"
                value={targetRolesText}
                onChange={(e) => setTargetRolesText(e.target.value)}
                placeholder="Backend Engineer, Fullstack Developer, Software Engineer"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Links & Socials */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-600" />
            Online Profiles & Portfolios
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-blue-600" />
                LinkedIn
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/adityashm"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                GitHub
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/adityashm"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                Portfolio
              </label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://adityashm.tech"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Work Authorization & Application Answers (Sections 7 & 14) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Work Authorization & Reusable Answer Bank
          </h2>
          <p className="text-xs text-slate-500">
            Pre-configured answers used by the Application Agent during browser auto-filling. You review everything before final submission.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Work Visa / Status
              </label>
              <select
                value={workVisaStatus}
                onChange={(e) => setWorkVisaStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Citizen">Citizen / Permanent Resident</option>
                <option value="Work Visa (H1B/OPT)">Work Visa (H1B/OPT)</option>
                <option value="Need Sponsorship">Need Sponsorship</option>
                <option value="Authorized to Work">Authorized to Work</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Requires Sponsorship?
              </label>
              <select
                value={requiresSponsorship ? "yes" : "no"}
                onChange={(e) => setRequiresSponsorship(e.target.value === "yes")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="no">No - Do not require sponsorship</option>
                <option value="yes">Yes - Require sponsorship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Notice Period
              </label>
              <input
                type="text"
                value={noticePeriod}
                onChange={(e) => setNoticePeriod(e.target.value)}
                placeholder="Immediate / 30 days"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Willing to Relocate?
              </label>
              <select
                value={willingToRelocate}
                onChange={(e) => setWillingToRelocate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Yes">Yes</option>
                <option value="No">No (Remote only)</option>
                <option value="Negotiable">Negotiable</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Target Min. Salary ($/₹)
              </label>
              <input
                type="number"
                value={minimumSalary}
                onChange={(e) => setMinimumSalary(e.target.value)}
                placeholder="e.g. 120000"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
