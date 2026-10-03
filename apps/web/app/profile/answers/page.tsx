"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ProfileNav } from "@/components/ProfileNav";
import {
  CheckSquare,
  ShieldCheck,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";

export default function AnswersBankPage() {
  const router = useRouter();
  const { user, token, isLoading, refreshUser } = useAuth();

  // Work Authorization
  const [authorizedInUs, setAuthorizedInUs] = useState(true);
  const [requiresSponsorship, setRequiresSponsorship] = useState(false);
  const [workVisaStatus, setWorkVisaStatus] = useState("Citizen");

  // Reusable Answers
  const [noticePeriod, setNoticePeriod] = useState("Immediate");
  const [willingToRelocate, setWillingToRelocate] = useState("Yes");
  const [expectedSalary, setExpectedSalary] = useState("120000");

  // Custom Q&A pairs
  const [customAnswers, setCustomAnswers] = useState<Array<{ question: string; answer: string }>>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (user?.profile) {
      const auth = user.profile.work_authorization || {};
      setAuthorizedInUs(auth.authorized_in_us ?? true);
      setRequiresSponsorship(auth.requires_sponsorship ?? false);
      setWorkVisaStatus(auth.work_visa_status || "Citizen");

      const answers = user.profile.application_answers || {};
      setNoticePeriod(answers.notice_period || "Immediate");
      setWillingToRelocate(answers.willing_to_relocate || "Yes");
      setExpectedSalary(answers.expected_salary || "120000");

      // Extract custom answers (excluding standard keys)
      const standardKeys = ["notice_period", "willing_to_relocate", "expected_salary"];
      const customList = Object.entries(answers)
        .filter(([k]) => !standardKeys.includes(k))
        .map(([question, answer]) => ({ question, answer: String(answer) }));
      setCustomAnswers(customList);
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  const handleAddCustom = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    setCustomAnswers([...customAnswers, { question: newQuestion.trim(), answer: newAnswer.trim() }]);
    setNewQuestion("");
    setNewAnswer("");
  };

  const handleRemoveCustom = (idx: number) => {
    setCustomAnswers(customAnswers.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    // Merge answers
    const mergedAnswers: Record<string, string> = {
      notice_period: noticePeriod,
      willing_to_relocate: willingToRelocate,
      expected_salary: expectedSalary,
    };
    for (const item of customAnswers) {
      if (item.question.trim()) {
        mergedAnswers[item.question.trim()] = item.answer.trim();
      }
    }

    try {
      await api.updateProfile(token, {
        work_authorization: {
          authorized_in_us: authorizedInUs,
          requires_sponsorship: requiresSponsorship,
          work_visa_status: workVisaStatus,
        },
        application_answers: mergedAnswers,
      });

      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to update answer bank.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Reusable Answer Bank
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Store truthful pre-configured answers for repetitive application screening questions (Section 14).
        </p>
      </div>

      <ProfileNav />

      {/* Grounding guarantee banner */}
      <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex items-start gap-3 text-sm text-sky-800 dark:text-sky-300">
        <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold block">Grounding Guarantee (Section 3 & 36)</span>
          <p className="text-xs text-sky-700 dark:text-sky-300/90 leading-relaxed">
            JobPilot will strictly use only verified profile information and these configured answers when assisting with applications. It is strictly constrained from fabricating years of experience, companies, degrees, or certifications.
          </p>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3 text-sm text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Answer bank updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center gap-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Work Authorization */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Work Authorization & Visa Status
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Authorized to Work in Target Country?
              </label>
              <select
                value={authorizedInUs ? "yes" : "no"}
                onChange={(e) => setAuthorizedInUs(e.target.value === "yes")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="yes">Yes - Legally authorized</option>
                <option value="no">No - Not currently authorized</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Require Visa Sponsorship?
              </label>
              <select
                value={requiresSponsorship ? "yes" : "no"}
                onChange={(e) => setRequiresSponsorship(e.target.value === "yes")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="no">No - Do not require sponsorship</option>
                <option value="yes">Yes - Require sponsorship now or future</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Work Status Category
              </label>
              <select
                value={workVisaStatus}
                onChange={(e) => setWorkVisaStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Citizen">Citizen / Permanent Resident</option>
                <option value="Work Visa (H1B/OPT)">Work Visa (H1B/OPT/Stem)</option>
                <option value="Need Sponsorship">Need Sponsorship</option>
                <option value="Authorized to Work">Authorized to Work</option>
              </select>
            </div>
          </div>
        </div>

        {/* Standard Reusable Answers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-sky-600" />
            Standard Screening Answers
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Notice Period / Earliest Start
              </label>
              <input
                type="text"
                value={noticePeriod}
                onChange={(e) => setNoticePeriod(e.target.value)}
                placeholder="Immediate / 2 weeks / 30 days"
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
                Target Salary Expectation
              </label>
              <input
                type="text"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                placeholder="e.g. $120,000 / ₹25 LPA"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Custom Q&A Bank */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Custom Question & Answer Bank
            </h2>
            <span className="text-xs text-slate-500">
              {customAnswers.length} custom {customAnswers.length === 1 ? "answer" : "answers"} saved
            </span>
          </div>

          <div className="space-y-3">
            {customAnswers.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-start justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    {item.question}
                  </span>
                  <p className="text-sm text-slate-800 dark:text-slate-200">{item.answer}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCustom(idx)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Add new custom Q&A */}
            <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                Add Reusable Application Answer
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="e.g. Why do you want to work remotely?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Your truthful verified answer..."
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustom}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
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
                Saving Answers...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Answer Bank
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
