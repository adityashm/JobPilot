"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { SettingsNav } from "@/components/SettingsNav";
import { SettingsResponse } from "@/lib/types";
import {
  Settings,
  Cpu,
  Layers,
  ShieldCheck,
  User,
  Activity,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from "lucide-react";

export default function SettingsOverviewPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const [settingsData, setSettingsData] = useState<SettingsResponse | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (token) {
      api
        .getSettings(token)
        .then((data) => setSettingsData(data))
        .catch(() => {})
        .finally(() => setLoadingSettings(false));
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
          System Settings & Overview
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your AI provider runtime, job board sources, and browser automation settings.
        </p>
      </div>

      <SettingsNav />

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/settings/ai"
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
            AI Engine Configuration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure local Ollama, OpenRouter, or mock providers without changing application code (Section 3.2).
          </p>
        </Link>

        <Link
          href="/settings/integrations"
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            Integrations & Browser Agent
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Inspect public job board adapters (Remotive), Playwright Chromium agent, and CAPTCHA safeguards.
          </p>
        </Link>
      </div>

      {/* System Status Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-600" />
          Runtime Environment & Health
        </h2>

        {loadingSettings ? (
          <div className="py-6 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase text-slate-500 block mb-1">
                Project Name
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {settingsData?.project_name || "JobPilot"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase text-slate-500 block mb-1">
                Version
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                v{settingsData?.version || "0.1.0"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase text-slate-500 block mb-1">
                Active AI Provider
              </span>
              <span className="font-semibold text-sky-600 dark:text-sky-400 capitalize">
                {settingsData?.ai.active_provider || "ollama"} ({settingsData?.ai.model || "llama3"})
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase text-slate-500 block mb-1">
                Browser Engine
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Playwright Chromium (Headless)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-sky-600" />
          Active Account
        </h2>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-base">
            {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-900 dark:text-white block">
              {user.full_name || "Job Candidate"}
            </span>
            <span className="text-xs text-slate-500 block">{user.email}</span>
            <div className="flex items-center gap-1.5 pt-1 text-xs text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Authenticated via secure JWT bearer token</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
