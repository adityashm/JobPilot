"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { HealthResponse } from "@/lib/types";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export function HealthBadge() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const check = async () => {
    setLoading(true);
    try {
      const data = await api.checkHealth();
      setHealth(data);
      setError(false);
    } catch {
      setError(true);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800">
      {loading ? (
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
      ) : error ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-red-600 dark:text-red-400">Backend Offline</span>
        </>
      ) : (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-700 dark:text-emerald-400 font-mono">
            API Online ({health?.version || "v0.1.0"})
          </span>
        </>
      )}
    </div>
  );
}
