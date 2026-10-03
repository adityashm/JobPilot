"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { SettingsNav } from "@/components/SettingsNav";
import { SettingsResponse, TestAIResponse } from "@/lib/types";
import {
  Cpu,
  Zap,
  Server,
  Key,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  DollarSign,
  Check,
} from "lucide-react";

export default function AISettingsPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const [provider, setProvider] = useState("ollama");
  const [model, setModel] = useState("llama3");
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState("http://localhost:11434");
  const [openrouterApiKey, setOpenrouterApiKey] = useState("");
  const [hasExistingKey, setHasExistingKey] = useState(false);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Testing connection
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestAIResponse | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (token) {
      api
        .getSettings(token)
        .then((data: SettingsResponse) => {
          setProvider(data.ai.active_provider || "ollama");
          setModel(data.ai.model || "llama3");
          setOllamaBaseUrl(data.ai.ollama_base_url || "http://localhost:11434");
          setHasExistingKey(data.ai.has_openrouter_key);
        })
        .catch(() => {});
    }
  }, [user, token, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-400 font-mono tracking-wider">RETRIEVING AI PROVIDER REGISTRY...</p>
        </div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const resp = await api.updateAiSettings(token, {
        provider,
        model,
        ollama_base_url: ollamaBaseUrl,
        openrouter_api_key: openrouterApiKey || undefined,
      });

      if (resp.ai.has_openrouter_key) {
        setHasExistingKey(true);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to update AI settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!token) return;
    setTesting(true);
    setTestResult(null);

    try {
      const res = await api.testAiConnection(token);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        status: "error",
        provider,
        model,
        latency_ms: 0,
        output: err.message || "Connection failed.",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="border-b border-white/[0.08] pb-6 space-y-1"
      >
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
          <Cpu className="w-3 h-3" />
          <span>PLUGGABLE AI ENGINE (SECTION 3.2)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          AI Provider Abstraction
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Toggle between local zero-cost models (Ollama) and cloud APIs (OpenRouter) with zero code changes.
        </p>
      </motion.div>

      <SettingsNav />

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-300"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>AI runtime configuration successfully updated!</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-xs text-rose-300"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Provider Selector Cards */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.08] shadow-xl space-y-5"
        >
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Active Inference Provider
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select your primary LLM completion provider. The application code stays completely agnostic.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: "ollama",
                label: "Ollama (Local)",
                badge: "Zero Cost",
                desc: "Runs locally on your computer via local Ollama daemon.",
              },
              {
                id: "openrouter",
                label: "OpenRouter (Cloud)",
                badge: "Cloud API",
                desc: "Scalable access to Claude, GPT-4, and Llama 3 via unified API.",
              },
              {
                id: "mock",
                label: "Mock Provider",
                badge: "Test / Offline",
                desc: "Deterministic mock responses for offline unit tests and UI dev.",
              },
            ].map((item) => (
              <label
                key={item.id}
                onClick={() => setProvider(item.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative group ${
                  provider === item.id
                    ? "border-indigo-500 bg-indigo-500/[0.08] shadow-lg shadow-indigo-500/10"
                    : "border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">
                      {item.label}
                    </span>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-300">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs font-mono text-indigo-400">
                  <input
                    type="radio"
                    name="ai_provider"
                    checked={provider === item.id}
                    onChange={() => setProvider(item.id)}
                    className="accent-indigo-500"
                  />
                  <span>{provider === item.id ? "Selected Engine" : "Switch Provider"}</span>
                </div>
              </label>
            ))}
          </div>
        </motion.div>

        {/* Model & Connection Settings */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.08] shadow-xl space-y-5"
        >
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" />
            Model & Endpoint Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Model Identifier
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={provider === "ollama" ? "llama3 / mistral" : "anthropic/claude-3-haiku"}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 font-mono"
              />
              <p className="text-[11px] text-slate-500 font-mono">
                E.g. &apos;llama3&apos;, &apos;mistral&apos;, &apos;deepseek/deepseek-r1&apos;
              </p>
            </div>

            {provider === "ollama" && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Ollama Base URL
                </label>
                <input
                  type="text"
                  value={ollamaBaseUrl}
                  onChange={(e) => setOllamaBaseUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 font-mono"
                />
              </div>
            )}

            {provider === "openrouter" && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  OpenRouter API Key
                </label>
                <input
                  type="password"
                  value={openrouterApiKey}
                  onChange={(e) => setOpenrouterApiKey(e.target.value)}
                  placeholder={hasExistingKey ? "•••••••••••••••• (Configured)" : "sk-or-v1-..."}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c1220] text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 font-mono"
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Multi-Tier Architecture Explanation */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.08] shadow-xl space-y-4"
        >
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            AI Cost Guard Architecture (Section 24)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-xl glass-panel border border-white/[0.06] space-y-1.5">
              <span className="font-semibold text-slate-200 block font-mono text-[11px] text-cyan-400">Layer 1: Normal Code</span>
              <p className="text-slate-400 text-xs leading-relaxed">Location, salary, keyword, and deduplication run at 0ms and $0 API cost.</p>
            </div>
            <div className="p-4 rounded-xl glass-panel border border-white/[0.06] space-y-1.5">
              <span className="font-semibold text-slate-200 block font-mono text-[11px] text-indigo-400">Layer 2: Local AI</span>
              <p className="text-slate-400 text-xs leading-relaxed">Ollama extracts skills and scores compatibility locally without credit limits.</p>
            </div>
            <div className="p-4 rounded-xl glass-panel border border-white/[0.06] space-y-1.5">
              <span className="font-semibold text-slate-200 block font-mono text-[11px] text-purple-400">Layer 3: Caching</span>
              <p className="text-slate-400 text-xs leading-relaxed">Parsed job listings are hashed and cached to eliminate redundant model calls.</p>
            </div>
          </div>
        </motion.div>

        {/* Live Test Connection Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.08] shadow-xl space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Provider Connectivity Test
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Dispatch a lightweight health ping to verify your active provider responds promptly.
              </p>
            </div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 text-xs font-semibold transition-all cursor-pointer disabled:opacity-60"
            >
              {testing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>Pinging Model...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Test Connection</span>
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-xl border text-xs font-mono ${
                  testResult.status === "ok"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-300"
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>
                    {testResult.status === "ok" ? "✓ CONNECTION VERIFIED" : "✗ CONNECTION FAILED"}
                  </span>
                  <span className="text-[11px] opacity-80">
                    Latency: {testResult.latency_ms}ms
                  </span>
                </div>
                <p className="text-[11px] opacity-90 break-words mt-1">{testResult.output}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Config...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save AI Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
