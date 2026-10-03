"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
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
        } as any,
      });

      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to update preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Job Search Preferences
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Control deterministic filtering rules (Section 11) for locations, remote status, compensation, and keyword exclusions.
        </p>
      </div>

      <ProfileNav />

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3 text-sm text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Job search preferences saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center gap-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Location & Remote */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-600" />
            Location & Remote Work
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Target Locations (Comma separated)
              </label>
              <input
                type="text"
                value={locationsText}
                onChange={(e) => setLocationsText(e.target.value)}
                placeholder="e.g. Remote, San Francisco, CA, Bangalore, New York"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Jobs matching any of these locations will be prioritized in discovery.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="remote_toggle"
                checked={remote}
                onChange={(e) => setRemote(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
              />
              <label htmlFor="remote_toggle" className="text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                Target Remote Opportunities (Recommend remote and distributed roles)
              </label>
            </div>
          </div>
        </div>

        {/* Employment Type & Compensation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Employment Type & Minimum Compensation
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Allowed Employment Types
              </label>
              <div className="space-y-2">
                {["Full-time", "Part-time", "Contract", "Internship"].map((type) => (
                  <label key={type} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={employmentTypes.includes(type)}
                      onChange={() => handleEmploymentTypeToggle(type)}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Minimum Target Salary (Annual)
                </label>
                <div className="flex gap-2">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-24 px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                  <input
                    type="number"
                    value={minimumSalary}
                    onChange={(e) => setMinimumSalary(e.target.value)}
                    placeholder="e.g. 120000"
                    className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Jobs paying less than this threshold will be filtered out before AI matching.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Deterministic Exclusions (Section 11) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Ban className="w-4 h-4 text-red-500" />
            Deterministic Exclusions (Section 11)
          </h2>
          <p className="text-xs text-slate-500">
            Automatically prune jobs matching these keywords or companies without consuming AI tokens.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Ban className="w-3.5 h-3.5 text-red-400" />
                Excluded Keywords
              </label>
              <input
                type="text"
                value={excludedKeywordsText}
                onChange={(e) => setExcludedKeywordsText(e.target.value)}
                placeholder="e.g. crypto, unpaid, wordpress, cleared"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Excluded Companies
              </label>
              <input
                type="text"
                value={excludedCompaniesText}
                onChange={(e) => setExcludedCompaniesText(e.target.value)}
                placeholder="e.g. UnwantedCorp, Revature"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-colors shadow-sm cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Preferences...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
