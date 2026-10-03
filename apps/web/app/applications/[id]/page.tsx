"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Application, Resume } from "@/lib/types";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  FileText,
  Save,
  Send,
  Loader2,
  Clock,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Check,
  Terminal,
} from "lucide-react";

export default function ApplicationReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const applicationId = Number(resolvedParams.id);

  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [application, setApplication] = useState<Application | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | "">("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (token && applicationId) {
      loadData();
    }
  }, [user, authLoading, token, applicationId, router]);

  async function loadData() {
    if (!token) return;
    try {
      setLoading(true);
      const [appData, resumesList] = await Promise.all([
        api.getApplication(token, applicationId),
        api.listResumes(token),
      ]);
      setApplication(appData);
      setResumes(resumesList);
      setSelectedResumeId(appData.resume_id || (resumesList[0]?.id ?? ""));
      setAnswers(appData.answers || {});
      setNotes(appData.notes || "");
    } catch (err: any) {
      setError(err.message || "Failed to load application details.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePrepareAnswers() {
    if (!token) return;
    setPreparing(true);
    setError(null);
    try {
      const updated = await api.prepareApplication(token, applicationId);
      setApplication(updated);
      setAnswers(updated.answers || {});
      setSuccessMessage("AI screening answers prepared from your verified profile!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to prepare answers.");
    } finally {
      setPreparing(false);
    }
  }

  async function handleSaveAnswers() {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateApplication(token, applicationId, {
        answers,
        notes,
        resume_id: selectedResumeId ? Number(selectedResumeId) : undefined,
      });
      setApplication(updated);
      setSuccessMessage("Application changes saved.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save answers.");
    } finally {
      setSaving(false);
    }
  }

  async function handleExplicitSubmit() {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    setShowConfirmModal(false);
    try {
      const updated = await api.submitApplication(token, applicationId, {
        confirmed: true,
        submission_notes: notes,
      });
      setApplication(updated);
      setSuccessMessage("Application explicitly approved and submitted!");
    } catch (err: any) {
      setError(err.message || "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-xs text-slate-400">
        <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3 text-indigo-500" />
        <span className="font-mono tracking-wider">RETRIEVING HUMAN REVIEW GATE DATA...</span>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-xs text-slate-400">
        <p className="font-semibold text-white">Application record not found.</p>
        <Link href="/applications" className="text-indigo-400 underline text-xs mt-2 inline-block">
          Return to Application Tracker
        </Link>
      </div>
    );
  }

  const isApplied = application.status === "APPLIED";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/applications"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Pipeline
        </Link>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </motion.div>
        )}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.08] shadow-xl space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {application.job?.title || "Application Review"}
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {application.status}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Company: <span className="font-semibold text-slate-200">{application.job?.company}</span> • Location: {application.job?.location}
            </p>
          </div>

          {application.job?.url && (
            <a
              href={application.job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-xs font-mono text-slate-300"
            >
              <span>View Source</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Human-in-the-loop Banner (Section 2 & 19) */}
        {!isApplied ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 space-y-1">
              <p className="font-bold text-amber-300">Human-in-the-Loop Review Gate</p>
              <p>
                JobPilot will NEVER submit an application without your explicit approval.
                Please review mapped profile attributes and screening question answers. You can edit any answer before authorizing submission.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs text-emerald-200">
              <p className="font-bold text-emerald-300">Application Approved & Submitted</p>
              <p>
                Authorized and recorded on {application.applied_at ? new Date(application.applied_at).toLocaleString() : "Recently"}.
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Resume Selection */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-panel p-6 rounded-2xl border border-white/[0.08] shadow-xl space-y-3"
      >
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          Attached Resume Document
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <select
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(Number(e.target.value))}
            disabled={isApplied}
            className="w-full sm:w-80 px-3 py-2 text-xs rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 focus:outline-none focus:border-indigo-500/50"
          >
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.filename} {r.is_primary ? "(Primary)" : ""}
              </option>
            ))}
          </select>

          <Link
            href="/profile/resume"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium font-mono"
          >
            + Upload alternative resume
          </Link>
        </div>
      </motion.div>

      {/* Profile Details Deterministic Mapping Summary */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="glass-panel p-6 rounded-2xl border border-white/[0.08] shadow-xl space-y-3"
      >
        <h2 className="text-sm font-bold text-white">
          Deterministic Profile Mappings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl glass-panel border border-white/[0.06]">
            <span className="text-[10px] text-slate-500 font-mono block">Candidate Name</span>
            <span className="font-semibold text-slate-200">
              {user?.full_name || "Aditya Sharma"}
            </span>
          </div>
          <div className="p-3 rounded-xl glass-panel border border-white/[0.06]">
            <span className="text-[10px] text-slate-500 font-mono block">Contact Email</span>
            <span className="font-semibold text-slate-200 truncate block">
              {user?.email}
            </span>
          </div>
          <div className="p-3 rounded-xl glass-panel border border-white/[0.06]">
            <span className="text-[10px] text-slate-500 font-mono block">Phone</span>
            <span className="font-semibold text-slate-200">
              {user?.profile?.phone || "Not set"}
            </span>
          </div>
          <div className="p-3 rounded-xl glass-panel border border-white/[0.06]">
            <span className="text-[10px] text-slate-500 font-mono block">Experience</span>
            <span className="font-semibold text-slate-200">
              {user?.profile?.experience_years || 0} years
            </span>
          </div>
        </div>
      </motion.div>

      {/* Screening Questions & Answers (Section 17 & 19) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.08] shadow-xl space-y-5"
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Screening Questions & AI Grounded Responses
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Derived strictly from your verified profile skills and experience. Zero hallucinated claims.
            </p>
          </div>

          {!isApplied && (
            <button
              onClick={handlePrepareAnswers}
              disabled={preparing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {preparing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span>Regenerate Answers</span>
            </button>
          )}
        </div>

        {Object.keys(answers).length === 0 ? (
          <div className="p-8 text-center rounded-xl glass-panel border border-white/[0.06] text-xs text-slate-400 space-y-3">
            <p>No screening answers prepared yet.</p>
            <button
              onClick={handlePrepareAnswers}
              disabled={preparing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Prepare Grounded Answers with AI
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(answers).map(([question, ansText]) => (
              <div
                key={question}
                className="p-4 rounded-xl glass-panel border border-white/[0.06] space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    {question}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Grounded in Profile
                  </span>
                </div>
                <textarea
                  value={ansText}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [question]: e.target.value }))
                  }
                  disabled={isApplied}
                  rows={ansText.length > 80 ? 3 : 1}
                  className="w-full p-3 rounded-xl border border-white/[0.08] bg-[#0c1220] text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 leading-relaxed font-sans"
                />
              </div>
            ))}
          </div>
        )}

        {/* Application Notes */}
        <div className="space-y-1.5 pt-2">
          <label className="block text-xs font-semibold text-slate-300">
            Application Notes & Custom Instructions
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isApplied}
            placeholder="e.g. Applied after referral; scheduled follow-up via email."
            className="w-full px-3 py-2 text-xs rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        {/* Action Buttons */}
        {!isApplied && (
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <button
              onClick={handleSaveAnswers}
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] text-xs font-medium text-slate-300 transition-colors cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save Draft Answers</span>
            </button>

            <button
              onClick={() => setShowConfirmModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Approve & Authorize Submission</span>
            </button>
          </div>
        )}
      </motion.div>

      {/* Automation Logs & Event Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="glass-panel p-6 rounded-2xl border border-white/[0.08] shadow-xl space-y-3"
      >
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          Playwright Automation Logs
        </h2>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {application.automation_logs?.length ? (
            application.automation_logs.map((log, idx) => (
              <div
                key={idx}
                className="text-[11px] p-2.5 rounded-lg bg-black/40 border border-white/[0.04] font-mono text-slate-300 flex items-start gap-2"
              >
                <span className="text-slate-500 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-indigo-400 font-bold shrink-0">[{log.level}]</span>
                <span className="break-all">{log.message}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic">No automation logs recorded for this session.</p>
          )}
        </div>
      </motion.div>

      {/* Human Approval Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="glass-panel border border-white/[0.1] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Confirm Explicit Approval
                </h3>
                <p className="text-xs text-slate-400">
                  You are authorizing submission for{" "}
                  <span className="font-semibold text-slate-200">
                    {application.job?.title} at {application.job?.company}
                  </span>
                  .
                </p>
              </div>

              <div className="p-4 rounded-xl glass-panel border border-white/[0.06] text-xs text-slate-300 space-y-1.5 font-mono">
                <p className="flex items-center gap-2 text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>Resume: {resumes.find((r) => r.id === selectedResumeId)?.filename || "Primary"}</span>
                </p>
                <p className="flex items-center gap-2 text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>{Object.keys(answers).length} screening answers verified</span>
                </p>
                <p className="flex items-center gap-2 text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>Contact profile data grounded</span>
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="w-1/2 py-2.5 text-xs font-semibold rounded-xl border border-white/[0.08] hover:bg-white/[0.04] text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExplicitSubmit}
                  disabled={submitting}
                  className="w-1/2 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Authorize</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
