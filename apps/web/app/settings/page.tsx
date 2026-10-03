"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
  ChevronRight,
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
      <div className="flex-1 flex items-center justify-center p-8 min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-400 font-mono tracking-wider">RETRIEVING SYSTEM RUNTIME...</p>
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
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
          <Settings className="w-3 h-3" />
          <span>SYSTEM CONTROLS & ARCHITECTURE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          System Settings & Runtime
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Supervise your AI provider runtime, job board sources, and browser automation settings.
        </p>
      </motion.div>

      <SettingsNav />

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <Link
            href="/settings/ai"
            className="p-6 rounded-2xl glass-panel border border-white/[0.08] hover:border-indigo-500/40 hover:shadow-lg transition-all group block space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </div>
            <h2 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors">
              AI Engine Configuration
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Configure local Ollama, OpenRouter, or mock providers without changing application code (Section 3.2).
            </p>
          </Link>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <Link
            href="/settings/integrations"
            className="p-6 rounded-2xl glass-panel border border-white/[0.08] hover:border-emerald-500/40 hover:shadow-lg transition-all group block space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            <h2 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
              Integrations & Browser Agent
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inspect public job board adapters (Remotive), Playwright Chromium agent, and CAPTCHA safeguards.
            </p>
          </Link>
        </motion.div>
      </div>

      {/* System Status Table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.08] shadow-xl space-y-5"
      >
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          Runtime Environment & Health
        </h2>

        {loadingSettings ? (
          <div className="py-6 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl glass-panel border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">
                Project Codebase
              </span>
              <span className="font-semibold text-white text-sm">
                {settingsData?.project_name || "JobPilot"}
              </span>
            </div>

            <div className="p-4 rounded-xl glass-panel border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">
                Version Release
              </span>
              <span className="font-semibold text-white text-sm">
                v{settingsData?.version || "0.1.0"}
              </span>
            </div>

            <div className="p-4 rounded-xl glass-panel border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">
                Active AI Engine
              </span>
              <span className="font-semibold text-indigo-400 capitalize text-sm">
                {settingsData?.ai.active_provider || "ollama"} ({settingsData?.ai.model || "llama3"})
              </span>
            </div>

            <div className="p-4 rounded-xl glass-panel border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">
                Browser Driver
              </span>
              <span className="font-semibold text-emerald-400 text-sm">
                Playwright Chromium (Headless)
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Account Info */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.08] shadow-xl space-y-4"
      >
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-400" />
          Active Account Session
        </h2>

        <div className="flex items-center gap-4 p-4 rounded-xl glass-panel border border-white/[0.06]">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-base shadow-md">
            {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-0.5">
            <span className="font-semibold text-white block text-sm">
              {user.full_name || "Job Candidate"}
            </span>
            <span className="text-xs text-slate-400 font-mono block">{user.email}</span>
            <div className="flex items-center gap-1.5 pt-1 text-[11px] font-mono text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Authenticated via secure JWT bearer token</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
