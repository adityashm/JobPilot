"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ProfileNav } from "@/components/ProfileNav";
import {
  Sliders,
  MapPin,
  DollarSign,
  Ban,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building,
  Check,
} from "lucide-react";

export default function PreferencesPage() {
  const router = useRouter();
  const { user, token, isLoading, refreshUser } = useAuth();

  const [locationsText, setLocationsText] = useState("");
  const [remote, setRemote] = useState(true);
  const [employmentTypes, setEmploymentTypes] = useState<string[]>(["Full-time"]);
  const [minimumSalary, setMinimumSalary] = useState<number | string>("");
  const [currency, setCurrency] = useState("USD");
  const [excludedKeywordsText, setExcludedKeywordsText] = useState("");
  const [excludedCompaniesText, setExcludedCompaniesText] = useState("");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (user?.profile?.preferences) {
      const prefs = user.profile.preferences;
      setLocationsText((prefs.locations || []).join(", "));
      setRemote(prefs.remote ?? true);
      setEmploymentTypes(prefs.employment_types || ["Full-time"]);
      setMinimumSalary(prefs.minimum_salary ?? "");
      setCurrency((prefs as any).currency || "USD");
      setExcludedKeywordsText(((prefs as any).excluded_keywords || []).join(", "));
      setExcludedCompaniesText(((prefs as any).excluded_companies || []).join(", "));
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-400 font-mono tracking-wider">LOADING SEARCH PREFERENCES...</p>
        </div>
      </div>
    );
  }

  const handleEmploymentTypeToggle = (type: string) => {
    if (employmentTypes.includes(type)) {
      if (employmentTypes.length > 1) {
        setEmploymentTypes(employmentTypes.filter((t) => t !== type));
      }
    } else {
      setEmploymentTypes([...employmentTypes, type]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    const locations = locationsText
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);

    const excluded_keywords = excludedKeywordsText
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const excluded_companies = excludedCompaniesText
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    try {
      await api.updateProfile(token, {
        preferences: {
          locations,
          remote,
          employment_types: employmentTypes,
          minimum_salary: minimumSalary ? Number(minimumSalary) : null,
          currency,
          excluded_keywords,
          excluded_companies,
        },
      });

      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to save preferences.");
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
            <Sliders className="w-3 h-3" />
            <span>DETERMINISTIC FILTER CRITERIA (SECTION 11)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Job Search Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Set hard requirements to filter out jobs without using expensive AI reasoning.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-60 self-start sm:self-auto"
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Preferences</span>
            </>
          )}
        </button>
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
            <span>Search preferences updated and applied to discovery filters!</span>
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
        {/* Location & Remote Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.08] shadow-xl space-y-5"
        >
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-400" />
            Location & Work Modality
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Target Cities or Countries (Comma-separated)
              </label>
              <input
                type="text"
                value={locationsText}
                onChange={(e) => setLocationsText(e.target.value)}
                placeholder="India, United States, Bangalore, Remote"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl glass-panel border border-white/[0.06]">
              <input
                type="checkbox"
                id="remote-checkbox"
                checked={remote}
                onChange={(e) => setRemote(e.target.checked)}
                className="rounded accent-indigo-600"
              />
              <label htmlFor="remote-checkbox" className="text-xs text-slate-200 cursor-pointer">
                <span className="font-semibold block">Prioritize Remote Opportunities</span>
                <span className="text-slate-400 text-[11px]">Match roles regardless of physical location constraints</span>
              </label>
            </div>
          </div>
        </motion.div>

        {/* Employment & Salary Requirements */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.08] shadow-xl space-y-5"
        >
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Employment Type & Salary Floor
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Minimum Annual Compensation ($/₹)
              </label>
              <input
                type="number"
                value={minimumSalary}
                onChange={(e) => setMinimumSalary(e.target.value)}
                placeholder="e.g. 100000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 font-mono"
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Accepted Employment Types
              </label>
              <div className="flex flex-wrap gap-2">
                {["Full-time", "Part-time", "Contract", "Internship"].map((t) => {
                  const isSelected = employmentTypes.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleEmploymentTypeToggle(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                          : "bg-white/[0.02] text-slate-400 border-white/[0.08] hover:bg-white/[0.04]"
                      }`}
                    >
                      {isSelected ? "✓ " : ""}{t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Exclusion Criteria (Negative Filters) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.08] shadow-xl space-y-5"
        >
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-400" />
              Negative Exclusions (Skip Automatically)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Automatically discard job postings matching these keywords or companies before AI analysis.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Excluded Keywords (e.g. legacy stacks, unsupported tech)
              </label>
              <input
                type="text"
                value={excludedKeywordsText}
                onChange={(e) => setExcludedKeywordsText(e.target.value)}
                placeholder="WordPress, PHP, Cobol, Legacy"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Excluded Companies
              </label>
              <input
                type="text"
                value={excludedCompaniesText}
                onChange={(e) => setExcludedCompaniesText(e.target.value)}
                placeholder="Company A, Company B"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
