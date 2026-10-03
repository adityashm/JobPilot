"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
        Loading application review...
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-slate-500">
        <p className="font-semibold text-slate-800 dark:text-slate-200">
          Application not found.
        </p>
        <Link href="/applications" className="text-sky-600 underline text-xs mt-2 inline-block">
          Return to Applications
        </Link>
      </div>
    );
  }

  const isApplied = application.status === "APPLIED";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/applications"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-sky-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pipeline
        </Link>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {application.job?.title || "Application Review"}
              </h1>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                {application.status}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Company: <span className="font-semibold text-slate-800 dark:text-slate-200">{application.job?.company}</span> | Location: {application.job?.location}
            </p>
          </div>

          {application.job?.url && (
            <a
              href={application.job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              <span>View Posting</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Human-in-the-loop Banner (Section 2 & 19) */}
        {!isApplied ? (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <p className="font-bold">Human-in-the-Loop Review Required</p>
              <p>
                JobPilot will NEVER submit an application without your explicit approval.
                Please inspect prefilled fields and screening question answers below. You may edit any answer before final submission.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200">
              <p className="font-bold">Application Approved & Submitted</p>
              <p>
                Submitted on {application.applied_at ? new Date(application.applied_at).toLocaleString() : "Recently"}. Status is currently marked as APPLIED.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Resume Selection */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-600" />
          Attached Resume Document
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <select
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(Number(e.target.value))}
            disabled={isApplied}
            className="w-full sm:w-80 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
          >
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.filename} {r.is_primary ? "(Primary)" : ""}
              </option>
            ))}
          </select>

          <Link
            href="/profile/resume"
            className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium"
          >
            + Upload alternative resume version
          </Link>
        </div>
      </div>

      {/* Profile Details Deterministic Mapping Summary */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Deterministic Profile Mappings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
            <span className="text-slate-500 block">Candidate Name</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {user?.full_name || "Aditya Sharma"}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
            <span className="text-slate-500 block">Contact Email</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
              {user?.email}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
            <span className="text-slate-500 block">Phone</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {user?.profile?.phone || "Not set"}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
            <span className="text-slate-500 block">Experience</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {user?.profile?.experience_years || 0} years
            </span>
          </div>
        </div>
      </div>

      {/* Screening Questions & Answers (Section 17 & 19) */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              Screening Questions & AI Prepared Answers
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Grounded strictly in your verified profile skills and resume. You can edit any answer below.
            </p>
          </div>

          {!isApplied && (
            <button
              onClick={handlePrepareAnswers}
              disabled={preparing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {preparing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Regenerate Answers
            </button>
          )}
        </div>

        {Object.keys(answers).length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500 space-y-3">
            <p>No screening answers prepared yet.</p>
            <button
              onClick={handlePrepareAnswers}
              disabled={preparing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-sm"
            >
              <Sparkles className="w-4 h-4" /> Prepare Grounded Answers with AI
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(answers).map(([question, ansText]) => (
              <div
                key={question}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {question}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
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
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 leading-relaxed"
                />
              </div>
            ))}
          </div>
        )}

        {/* Application Notes */}
        <div className="space-y-1.5 pt-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Application Notes & Custom Instructions
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isApplied}
            placeholder="e.g. Applied after referral from engineering manager; followed up on LinkedIn."
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Action Buttons */}
        {!isApplied && (
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleSaveAnswers}
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save Changes
            </button>

            <button
              onClick={() => setShowConfirmModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Approve & Submit Application
            </button>
          </div>
        )}
      </div>

      {/* Automation Logs & Event Timeline (Section 27) */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          Automation & Audit Logs
        </h2>
        <div className="space-y-2">
          {application.automation_logs?.length ? (
            application.automation_logs.map((log, idx) => (
              <div
                key={idx}
                className="text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 font-mono text-slate-700 dark:text-slate-300 flex items-start gap-2"
              >
                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-sky-600 font-bold shrink-0">[{log.level}]</span>
                <span className="break-all">{log.message}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic">No automation logs recorded.</p>
          )}
        </div>
      </div>

      {/* Human Approval Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Confirm Application Submission
              </h3>
              <p className="text-xs text-slate-500">
                You are about to submit your application for{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {application.job?.title} at {application.job?.company}
                </span>
                .
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p>✓ Resume attached: {resumes.find((r) => r.id === selectedResumeId)?.filename || "Primary"}</p>
              <p>✓ {Object.keys(answers).length} screening answers verified</p>
              <p>✓ Contact details confirmed</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-1/2 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300"
              >
                Go Back
              </button>
              <button
                onClick={handleExplicitSubmit}
                disabled={submitting}
                className="w-1/2 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
