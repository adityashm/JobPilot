"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Settings, Cpu, Layers } from "lucide-react";

export function SettingsNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/settings", label: "General & System", icon: Settings },
    { href: "/settings/ai", label: "AI Engine Configuration", icon: Cpu },
    { href: "/settings/integrations", label: "Integrations & Guardrails", icon: Layers },
  ];

  return (
    <div className="flex border-b border-white/[0.08] gap-1.5 mb-8 overflow-x-auto pb-2 scrollbar-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
              isActive
                ? "text-white font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="settingsTabPill"
                className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/[0.12] -z-10 shadow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
