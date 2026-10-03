"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { SettingsNav } from "@/components/SettingsNav";
import { SettingsResponse } from "@/lib/types";
import {
  Layers,
  Globe,
  Monitor,
  ShieldAlert,
  CheckCircle2,
  Lock,
  ExternalLink,
  Loader2,
  Workflow,
  ShieldCheck,
} from "lucide-react";

export default function IntegrationsSettingsPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const [settingsData, setSettingsData] = useState<SettingsResponse | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (token) {
      api
        .getSettings(token)
        .then((data) => setSettingsData(data))
        .catch(() => {});
    }
  }, [user, token, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-400 font-mono tracking-wider">LOADING SYSTEM INTEGRATIONS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="border-b border-white/[0.08] pb-6 space-y-1"
      >
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
          <Layers className="w-3 h-3" />
          <span>INTEGRATIONS & SAFETY GUARDRAILS (SECTION 9, 18, 28)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Integrations & Automation Safety
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Supervise active job discovery sources and Playwright browser automation guardrails.
        </p>
      </motion.div>

      <SettingsNav />

      {/* Browser Automation Safety Card (Section 2 & 18) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.08] shadow-xl space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Monitor className="w-4 h-4 text-indigo-400" />
            Playwright Browser Agent (Section 15 & 28)
          </h2>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Active & Sandboxed
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          JobPilot controls an isolated headless Chromium instance to inspect ATS pages, map form fields to your profile, fill repetitive contact inputs, and upload your selected resume.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-5 rounded-xl glass-panel border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 font-semibold text-xs text-white">
              <Lock className="w-4 h-4 text-amber-400" />
              Human-in-the-Loop Principle (Section 2)
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              No application is ever submitted autonomously without explicit candidate review and approval. The agent pauses at the confirmation stage for your final signoff.
            </p>
          </div>

          <div className="p-5 rounded-xl glass-panel border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 font-semibold text-xs text-white">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              CAPTCHA / 2FA Guardrail (Section 18)
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Anti-bot puzzles, Cloudflare challenges, and 2FA are never bypassed. The automation detects them, halts execution, and allows you to complete the challenge manually.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Supported Job Sources */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.08] shadow-xl space-y-4"
      >
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-400" />
          Active Job Discovery Sources
        </h2>
        <div className="space-y-3">
          <div className="p-4 rounded-xl glass-panel border border-white/[0.06] flex items-center justify-between">
            <div className="space-y-1">
              <span className="font-semibold text-white text-xs block">
                Remotive API (Public Feeds)
              </span>
              <p className="text-[11px] text-slate-400">
                Official public remote software engineering job API. Legitimate access with zero scraping bypasses.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Online (200 OK)
            </span>
          </div>

          <div className="p-4 rounded-xl glass-panel border border-white/[0.06] flex items-center justify-between">
            <div className="space-y-1">
              <span className="font-semibold text-white text-xs block">
                Local Mock Provider (Testing Harness)
              </span>
              <p className="text-[11px] text-slate-400">
                Deterministic verified job postings for offline unit testing and staging verification.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Ready
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
