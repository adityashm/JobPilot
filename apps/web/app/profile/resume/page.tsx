"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  CheckCircle2,
  X,
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
      setTimeout(() => setSuccessMessage(null), 3000);
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
      setTimeout(() => setSuccessMessage(null), 3000);
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6"
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
            <Sparkles className="w-3 h-3" />
            <span>AI EXTRACTION PIPELINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Resume Documents & Parsing
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Upload PDF or DOCX resumes. The AI engine extracts structured skills, work history, and contact details.
          </p>
        </div>

        <Link
          href="/profile"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-white/[0.08] hover:bg-white/[0.04] text-slate-200 transition-colors self-start md:self-auto"
        >
          <span>View Profile</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </motion.div>

      <ProfileNav />

      {/* Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
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

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-panel p-8 rounded-2xl border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/50 bg-indigo-500/[0.02] text-center space-y-4 transition-all"
      >
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/10">
          {uploading ? (
            <Loader2 className="w-7 h-7 animate-spin" />
          ) : (
            <Upload className="w-7 h-7" />
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-semibold text-white tracking-tight">
            Drop or select your resume file
          </h3>
          <p className="text-xs text-slate-400">
            Accepts standard PDF, DOCX, or TXT documents (Max 10MB)
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 pt-1">
          <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="rounded accent-indigo-600"
            />
            <span>Auto-sync extracted data to Career Profile</span>
          </label>
        </div>

        <div className="pt-2">
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
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 cursor-pointer transition-all ${
              uploading
                ? "bg-indigo-500/50 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500"
            }`}
          >
            {uploading ? "Extracting & Grounding..." : "Choose File to Upload"}
          </label>
        </div>
      </motion.div>

      {/* Extracted Preview Card */}
      {extractedPreview && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 rounded-2xl border border-indigo-500/30 space-y-4 shadow-xl"
        >
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Structured Extraction Output</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl glass-panel border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 font-mono block">Experience</span>
              <span className="font-semibold text-slate-200">
                {extractedPreview.experience_years} years
              </span>
            </div>
            <div className="p-3 rounded-xl glass-panel border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 font-mono block">Phone</span>
              <span className="font-semibold text-slate-200">
                {extractedPreview.phone || "Not detected"}
              </span>
            </div>
            <div className="p-3 rounded-xl glass-panel border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 font-mono block">LinkedIn</span>
              <span className="font-semibold text-slate-200 truncate block">
                {extractedPreview.linkedin_url || "Not detected"}
              </span>
            </div>
            <div className="p-3 rounded-xl glass-panel border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 font-mono block">GitHub</span>
              <span className="font-semibold text-slate-200 truncate block">
                {extractedPreview.github_url || "Not detected"}
              </span>
            </div>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2">Verified Skills:</span>
            <div className="flex flex-wrap gap-1.5">
              {extractedPreview.skills.length > 0 ? (
                extractedPreview.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">No skills detected</span>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Resumes List */}
      <div className="space-y-4">
        <h2 className="text-sm font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Active Resume Library ({resumes.length})</span>
        </h2>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
            <span className="font-mono">LOADING RESUMES...</span>
          </div>
        ) : resumes.length === 0 ? (
          <div className="p-8 text-center rounded-2xl glass-panel border border-white/[0.08] text-slate-400 text-xs">
            No resume files uploaded yet. Upload a document above to calibrate AI matching.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {resumes.map((r) => (
              <motion.div
                key={r.id}
                whileHover={{ y: -1 }}
                className="glass-panel p-4 rounded-xl border border-white/[0.08] hover:border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-indigo-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">
                        {r.filename}
                      </span>
                      {r.is_primary && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Primary
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      Uploaded on {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {!r.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(r.id)}
                      className="px-3 py-1.5 text-xs font-mono rounded-lg border border-white/[0.08] hover:bg-white/[0.04] text-slate-300 transition-colors cursor-pointer"
                    >
                      Set Primary
                    </button>
                  )}
                  <button
                    onClick={() => handleViewRawText(r.id, r.filename)}
                    className="px-3 py-1.5 text-xs font-mono rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 transition-colors cursor-pointer"
                  >
                    View Text
                  </button>
                  <button
                    onClick={() => handleDeleteResume(r.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete resume"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Raw Text Modal */}
      <AnimatePresence>
        {selectedResumeText && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel border border-white/[0.1] rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
                <h3 className="font-semibold text-xs font-mono text-slate-200">
                  Extracted Raw Text: {selectedResumeText.filename}
                </h3>
                <button
                  onClick={() => setSelectedResumeText(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1 font-mono text-[11px] text-slate-300 whitespace-pre-wrap bg-black/40">
                {selectedResumeText.text}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
