"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  Clock,
  MapPin,
  Banknote,
  Sparkles,
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
      <div className="flex-1 flex items-center justify-center p-8 min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-400 font-mono">Loading answer bank...</p>
        </div>
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/5"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" />
              Verified Answer Bank
            </span>
            <span className="text-xs text-slate-500 font-mono">Module 14</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Screening & Answer Bank
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Store truthful pre-configured answers for repetitive ATS screening questions. JobPilot never fabricates facts.
          </p>
        </div>
      </motion.div>

      <ProfileNav />

      {/* Grounding guarantee banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl glass-panel border border-indigo-500/20 bg-indigo-500/5 flex items-start gap-3.5 text-sm text-slate-300"
      >
        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <span className="font-semibold text-white flex items-center gap-2 text-sm">
            Strict Grounding Guarantee (Section 3 & 36)
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">Deterministic</span>
          </span>
          <p className="text-xs text-slate-400 leading-relaxed">
            JobPilot will strictly use only verified profile information and these configured answers when assisting with job applications. It is strictly constrained from fabricating years of experience, companies, degrees, or certifications.
          </p>
        </div>
      </motion.div>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-xl glass-panel border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3 text-sm text-emerald-300"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-medium">Answer bank updated and synced successfully!</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-xl glass-panel border border-rose-500/30 bg-rose-500/10 flex items-center gap-3 text-sm text-rose-300"
          >
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Work Authorization Bento */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              Work Authorization & Visa Status
            </h2>
            <span className="text-xs font-mono text-slate-500">Legal Compliance</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
                Authorized in Target Country?
              </label>
              <select
                value={authorizedInUs ? "yes" : "no"}
                onChange={(e) => setAuthorizedInUs(e.target.value === "yes")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-900/80 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="yes">Yes — Legally authorized</option>
                <option value="no">No — Not currently authorized</option>
              </select>
              <p className="text-[11px] text-slate-500">Auto-filled in ATS legal clearance checks.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
                Require Visa Sponsorship?
              </label>
              <select
                value={requiresSponsorship ? "yes" : "no"}
                onChange={(e) => setRequiresSponsorship(e.target.value === "yes")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-900/80 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="no">No — Do not require sponsorship</option>
                <option value="yes">Yes — Require sponsorship now/future</option>
              </select>
              <p className="text-[11px] text-slate-500">Applied truthfully to screening question.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
                Work Status Category
              </label>
              <select
                value={workVisaStatus}
                onChange={(e) => setWorkVisaStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-900/80 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Citizen">Citizen / Permanent Resident</option>
                <option value="Work Visa (H1B/OPT)">Work Visa (H1B/OPT/Stem)</option>
                <option value="Need Sponsorship">Need Sponsorship</option>
                <option value="Authorized to Work">Authorized to Work</option>
              </select>
              <p className="text-[11px] text-slate-500">Detailed visa category.</p>
            </div>
          </div>
        </motion.div>

        {/* Standard Reusable Answers */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <CheckSquare className="w-4 h-4" />
              </div>
              Standard Screening Answers
            </h2>
            <span className="text-xs font-mono text-slate-500">Standard Fields</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Notice Period / Earliest Start
              </label>
              <input
                type="text"
                value={noticePeriod}
                onChange={(e) => setNoticePeriod(e.target.value)}
                placeholder="Immediate / 2 weeks / 30 days"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-900/80 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                Willing to Relocate?
              </label>
              <select
                value={willingToRelocate}
                onChange={(e) => setWillingToRelocate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-900/80 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Yes">Yes</option>
                <option value="No">No (Remote only)</option>
                <option value="Negotiable">Negotiable</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-indigo-400" />
                Target Salary Expectation
              </label>
              <input
                type="text"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                placeholder="e.g. $120,000 / ₹25 LPA"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-900/80 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Custom Q&A Bank */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                Custom Question & Answer Bank
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Frequently asked open-ended questions mapped directly during automated application prep.
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400">
              {customAnswers.length} {customAnswers.length === 1 ? "answer" : "answers"} saved
            </span>
          </div>

          <div className="space-y-3">
            {customAnswers.map((item, idx) => (
              <motion.div
                key={idx}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex items-start justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <span className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider block">
                    Q: {item.question}
                  </span>
                  <p className="text-sm text-slate-200 leading-relaxed">A: {item.answer}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCustom(idx)}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Remove question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}

            {/* Add new custom Q&A */}
            <div className="p-4 rounded-xl border border-dashed border-white/15 bg-white/[0.01] space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Add Reusable Application Answer
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="e.g. Why do you want to work remotely?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-900/80 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Your truthful verified answer..."
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-900/80 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustom}
                    className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Save Bar */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-500/25 cursor-pointer disabled:opacity-60"
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
