"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Integrations & Automation Safety
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monitor active job discovery sources and Playwright browser automation guardrails (Section 9, 18 & 28).
        </p>
      </div>

      <SettingsNav />

      {/* Browser Automation Safety Card (Section 2 & 18) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Monitor className="w-4 h-4 text-sky-600" />
            Playwright Browser Agent (Section 15 & 28)
          </h2>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active & Sandboxed
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          JobPilot controls an isolated Chromium instance to inspect ATS pages, map form fields to your profile, fill repetitive contact inputs, and upload your selected resume.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-white">
              <Lock className="w-4 h-4 text-amber-500" />
              Human-in-the-Loop Principle (Section 2)
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              No application is ever submitted autonomously without explicit candidate review and approval. The agent pauses at the confirmation stage for your final signoff.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-white">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              CAPTCHA / 2FA Guardrail (Section 18)
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Anti-bot puzzles, Cloudflare challenges, and 2FA are never bypassed. The automation detects them, halts execution, and allows you to complete the challenge manually.
            </p>
          </div>
        </div>
      </div>

      {/* Active Job Sources (Section 9) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-600" />
          Configured Job Discovery Sources (Section 9)
        </h2>
        <p className="text-xs text-slate-500">
          JobPilot queries legitimate, terms-compliant sources with automatic URL normalization and deduplication.
        </p>

        <div className="space-y-3">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Remotive Public API
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Live External API
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Discovers remote software engineering and tech opportunities directly from Remotive&apos;s public feed.
              </p>
            </div>
            <a
              href="https://remotive.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-500 font-medium shrink-0"
            >
              <span>remotive.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  JobPilot Curated Source
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                  Deterministic Dev
                </span>
              </div>
              <p className="text-xs text-slate-500">
                High-fidelity software engineering benchmark postings for local offline testing and CI/CD pipelines.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">Local Fixture</span>
          </div>

          <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between gap-3 opacity-75">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Custom ATS Adapters (Workday, Greenhouse, Lever)
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Roadmap Phase
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Extensible ATS adapters extending the core GenericFormAdapter architecture.
              </p>
            </div>
            <Workflow className="w-5 h-5 text-slate-400 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
