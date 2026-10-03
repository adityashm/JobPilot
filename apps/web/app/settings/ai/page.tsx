"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
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
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          AI Engine Configuration
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Switch AI providers and models seamlessly without changing application code (Section 3.2).
        </p>
      </div>

      <SettingsNav />

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3 text-sm text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>AI engine configuration updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center gap-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Provider Selector */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-600" />
            Active AI Provider Abstraction (Section 3.2)
          </h2>
          <p className="text-xs text-slate-500">
            Local models (Ollama) run at zero API cost on your machine. OpenRouter enables scalable cloud inference across 100+ models.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: "ollama",
                label: "Ollama (Local)",
                badge: "Zero Cost",
                desc: "Runs locally on your computer via Ollama daemon.",
              },
              {
                id: "openrouter",
                label: "OpenRouter (Cloud)",
                badge: "Cloud API",
                desc: "Access Claude, GPT-4, Llama 3 via unified API key.",
              },
              {
                id: "mock",
                label: "Mock Provider",
                badge: "Test / Offline",
                desc: "Deterministic instant responses for tests and offline dev.",
              },
            ].map((item) => (
              <label
                key={item.id}
                onClick={() => setProvider(item.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  provider === item.id
                    ? "border-sky-600 bg-sky-50/50 dark:bg-sky-950/30 ring-1 ring-sky-600"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {item.label}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-sky-600 dark:text-sky-400">
                  <input
                    type="radio"
                    name="ai_provider"
                    checked={provider === item.id}
                    onChange={() => setProvider(item.id)}
                    className="w-3.5 h-3.5 text-sky-600 focus:ring-sky-500"
                  />
                  <span>{provider === item.id ? "Active" : "Select"}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Model & Connection Settings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-sky-600" />
            Model & Endpoint Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Model Identifier
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={provider === "ollama" ? "llama3 / mistral" : "anthropic/claude-3-haiku"}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                E.g. &apos;llama3&apos;, &apos;mistral&apos;, &apos;deepseek/deepseek-r1&apos;
              </p>
            </div>

            {provider === "ollama" && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Ollama Base URL
                </label>
                <input
                  type="text"
                  value={ollamaBaseUrl}
                  onChange={(e) => setOllamaBaseUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            )}

            {provider === "openrouter" && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  OpenRouter API Key
                </label>
                <input
                  type="password"
                  value={openrouterApiKey}
                  onChange={(e) => setOpenrouterApiKey(e.target.value)}
                  placeholder={hasExistingKey ? "•••••••••••••••• (Configured)" : "sk-or-v1-..."}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Stored securely in server environment variables.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cost Optimization & Multi-Tier Architecture (Section 24) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            AI Cost Management Architecture (Section 24)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">Layer 1: Normal Code</span>
              <p className="text-slate-500">Location, salary, keyword, and deduplication run at 0ms and $0 cost.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">Layer 2: Local AI</span>
              <p className="text-slate-500">Ollama extracts skills and scores compatibility locally at zero API cost.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">Layer 3: Caching</span>
              <p className="text-slate-500">Parsed job descriptions are hashed and cached to avoid redundant calls.</p>
            </div>
          </div>
        </div>

        {/* Live Test Connection Card */}
        <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Provider Connectivity Test
              </h2>
              <p className="text-xs text-slate-500">
                Send a real test query to verify your active model responds correctly.
              </p>
            </div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-60"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  Test Active AI Connection
                </>
              )}
            </button>
          </div>

          {testResult && (
            <div
              className={`p-4 rounded-xl border text-sm ${
                testResult.status === "ok"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200"
                  : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200"
              }`}
            >
              <div className="flex items-center justify-between font-semibold mb-1">
                <span>
                  {testResult.status === "ok" ? "✓ Connection Successful" : "✗ Connection Error"}
                </span>
                <span className="text-xs font-mono font-normal">
                  Latency: {testResult.latency_ms}ms
                </span>
              </div>
              <p className="text-xs font-mono opacity-90 break-words">{testResult.output}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-colors shadow-sm cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving AI Configuration...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save AI Configuration
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
