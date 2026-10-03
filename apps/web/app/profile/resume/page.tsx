"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Resume, Profile } from "@/lib/types";
import {
  Upload,
  FileText,
  CheckCircle,
  Star,
  Trash2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Loader2,
} from "lucide-react";
import { ProfileNav } from "@/components/ProfileNav";


export default function ResumeManagementPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(true);
  const [extractedPreview, setExtractedPreview] = useState<Profile | null>(null);
  const [selectedResumeText, setSelectedResumeText] = useState<{ filename: string; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (token) {
      loadResumes();
    }
  }, [user, authLoading, token, router]);

  async function loadResumes() {
    if (!token) return;
    try {
      setLoading(true);
      const data = await api.listResumes(token);
      setResumes(data);
    } catch (err: any) {
      setError(err.message || "Failed to load resumes.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setError(null);
    setSuccessMessage(null);
    setUploading(true);

    try {
      const resp = await api.uploadResume(token, file, autoSync);
      setSuccessMessage(`Successfully uploaded and parsed "${file.name}"!`);
      setExtractedPreview(resp.extracted_profile);
      await loadResumes();
    } catch (err: any) {
      setError(err.message || "Failed to process resume file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSetPrimary(resumeId: number) {
    if (!token) return;
    try {
      await api.setPrimaryResume(token, resumeId);
      await loadResumes();
      setSuccessMessage("Primary application resume updated.");
    } catch (err: any) {
      setError(err.message || "Failed to set primary resume.");
    }
  }

  async function handleDeleteResume(resumeId: number) {
    if (!token) return;
    if (!confirm("Are you sure you want to delete this resume?")) return;
    try {
      await api.deleteResume(token, resumeId);
      await loadResumes();
      setSuccessMessage("Resume deleted.");
    } catch (err: any) {
      setError(err.message || "Failed to delete resume.");
    }
  }

  async function handleViewRawText(resumeId: number, filename: string) {
    if (!token) return;
    try {
      const detail = await api.getResume(token, resumeId);
      setSelectedResumeText({ filename, text: detail.raw_text || "No text available." });
    } catch (err: any) {
      setError(err.message || "Failed to load resume details.");
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-sky-600 dark:text-sky-400 font-medium mb-1">
            <Link href="/profile" className="hover:underline">Career Profile</Link>
            <span>/</span>
            <span>Resumes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Resume Management & AI Extraction
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Upload PDF or DOCX resumes. Our AI parser extracts structured skills, experience, and contact data.
          </p>
        </div>

        <Link
          href="/profile"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
        >
          View Full Profile <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <ProfileNav />


      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Upload Box */}
      <div className="p-6 rounded-xl border-2 border-dashed border-sky-300 dark:border-sky-900/60 bg-sky-50/40 dark:bg-sky-950/20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300 mx-auto flex items-center justify-center">
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Upload className="w-6 h-6" />
          )}
        </div>

        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Upload your Resume
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Supports PDF, DOCX, or TXT documents (Max 10MB)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500"
            />
            <span>Automatically sync extracted skills & info to Career Profile</span>
          </label>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx,.txt"
            className="hidden"
            id="resume-file-input"
            disabled={uploading}
          />
          <label
            htmlFor="resume-file-input"
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm cursor-pointer transition-colors ${
              uploading
                ? "bg-sky-400 cursor-not-allowed"
                : "bg-sky-600 hover:bg-sky-500"
            }`}
          >
            {uploading ? "Extracting & Parsing..." : "Choose File to Upload"}
          </label>
        </div>
      </div>

      {/* Extracted Preview Card */}
      {extractedPreview && (
        <div className="p-5 rounded-xl border border-sky-200 dark:border-sky-900 bg-white dark:bg-slate-900 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>AI Extraction Preview</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-500 block">Experience</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {extractedPreview.experience_years} years
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-500 block">Phone</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {extractedPreview.phone || "Not detected"}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-500 block">LinkedIn</span>
              <span className="font-semibold text-slate-900 dark:text-white truncate block">
                {extractedPreview.linkedin_url || "Not detected"}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-500 block">GitHub</span>
              <span className="font-semibold text-slate-900 dark:text-white truncate block">
                {extractedPreview.github_url || "Not detected"}
              </span>
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500 block mb-1">Extracted Skills:</span>
            <div className="flex flex-wrap gap-1.5">
              {extractedPreview.skills.length > 0 ? (
                extractedPreview.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded text-xs bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-medium"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No skills automatically identified</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resumes List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center justify-between">
          <span>Uploaded Resumes ({resumes.length})</span>
        </h2>

        {loading ? (
          <div className="text-center py-8 text-sm text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-600" />
            Loading uploaded resumes...
          </div>
        ) : resumes.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
            No resumes uploaded yet. Upload your first resume above to begin matching jobs!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {resumes.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        {r.filename}
                      </span>
                      {r.is_primary && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Primary
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      Uploaded on {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {!r.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(r.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      Set Primary
                    </button>
                  )}
                  <button
                    onClick={() => handleViewRawText(r.id, r.filename)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    View Text
                  </button>
                  <button
                    onClick={() => handleDeleteResume(r.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    title="Delete resume"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raw Text Modal / Drawer */}
      {selectedResumeText && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-xl">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                Extracted Text: {selectedResumeText.filename}
              </h3>
              <button
                onClick={() => setSelectedResumeText(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-950 rounded-b-2xl">
              {selectedResumeText.text}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
