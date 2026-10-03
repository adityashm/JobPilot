"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  ShieldCheck,
  Check,
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
      <div className="flex-1 flex items-center justify-center p-8 min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-400 font-mono tracking-wider">LOADING PROFILE SPECIFICATION...</p>
        </div>
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
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6"
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
            <ShieldCheck className="w-3 h-3" />
            <span>GROUNDED CAREER DATA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Career Profile & Attributes
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Define verified skills, experience, and links. Matching and AI screening answers rely strictly on this profile.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Link
            href="/profile/resume"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Upload Resume</span>
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      <ProfileNav />

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-300"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Profile attributes successfully saved to PostgreSQL database!</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-xs text-rose-300"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Career Attributes */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.08] shadow-xl space-y-5"
        >
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            Core Career Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Professional Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Senior Fullstack Engineer / Python & React Specialist"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Current Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ghaziabad, India / Remote"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Years of Industry Experience
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={experienceYears}
                onChange={(e) => setExperienceYears(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 font-mono"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Verified Skills (Comma-separated)
              </label>
              <input
                type="text"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="Python, FastAPI, React, PostgreSQL, Docker, Playwright, TypeScript"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50"
              />
              <p className="text-[11px] text-slate-500">
                Grounded skills used by the JobMatchingAgent for transparent fit scores.
              </p>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Target Roles (Comma-separated)
              </label>
              <input
                type="text"
                value={targetRolesText}
                onChange={(e) => setTargetRolesText(e.target.value)}
                placeholder="Backend Engineer, Fullstack Developer, Software Engineer"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>
        </motion.div>

        {/* Links & Profiles */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.08] shadow-xl space-y-5"
        >
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            Online Portfolios & Social Presence
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/adityashm"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                GitHub URL
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/adityashm"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Portfolio Site
              </label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://adityashm.tech"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>
        </motion.div>

        {/* Work Authorization & Application Answers */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.08] shadow-xl space-y-5"
        >
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Work Authorization & Reusable Answers
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic answers mapped by the browser agent during ATS application pre-filling.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Visa / Work Status
              </label>
              <select
                value={workVisaStatus}
                onChange={(e) => setWorkVisaStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50"
              >
                <option value="Citizen">Citizen / Permanent Resident</option>
                <option value="Work Visa (H1B/OPT)">Work Visa (H1B/OPT)</option>
                <option value="Need Sponsorship">Need Sponsorship</option>
                <option value="Authorized to Work">Authorized to Work</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Requires Sponsorship?
              </label>
              <select
                value={requiresSponsorship ? "yes" : "no"}
                onChange={(e) => setRequiresSponsorship(e.target.value === "yes")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50"
              >
                <option value="no">No - Do not require sponsorship</option>
                <option value="yes">Yes - Require sponsorship</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Notice Period
              </label>
              <input
                type="text"
                value={noticePeriod}
                onChange={(e) => setNoticePeriod(e.target.value)}
                placeholder="Immediate / 30 days"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Willing to Relocate?
              </label>
              <select
                value={willingToRelocate}
                onChange={(e) => setWillingToRelocate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50"
              >
                <option value="Yes">Yes</option>
                <option value="No">No (Remote only)</option>
                <option value="Negotiable">Negotiable</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Target Min. Salary ($/₹)
              </label>
              <input
                type="number"
                value={minimumSalary}
                onChange={(e) => setMinimumSalary(e.target.value)}
                placeholder="e.g. 120000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 font-mono"
              />
            </div>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
