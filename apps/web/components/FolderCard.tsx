"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export interface FolderCardProps {
  index: number;
  badge: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string; // e.g. "emerald", "indigo", "purple", "cyan"
  glowGradient: string;
  previewSnippet?: {
    label: string;
    value: string;
    badge?: string;
  };
}

export function FolderCard({
  index,
  badge,
  title,
  description,
  icon: Icon,
  accentColor,
  glowGradient,
  previewSnippet,
}: FolderCardProps) {
  const formattedIndex = String(index).padStart(2, "0");

  // Accent styling mappings
  const colorMap: Record<
    string,
    {
      tabBg: string;
      tabText: string;
      tabBorder: string;
      cardBorder: string;
      iconBg: string;
      iconText: string;
      glow: string;
      accentLine: string;
    }
  > = {
    emerald: {
      tabBg: "bg-emerald-950/80",
      tabText: "text-emerald-300",
      tabBorder: "border-emerald-500/30",
      cardBorder: "group-hover:border-emerald-500/40",
      iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      iconText: "text-emerald-400",
      glow: "from-emerald-500/20 via-teal-500/5 to-transparent",
      accentLine: "bg-emerald-500",
    },
    indigo: {
      tabBg: "bg-indigo-950/80",
      tabText: "text-indigo-300",
      tabBorder: "border-indigo-500/30",
      cardBorder: "group-hover:border-indigo-500/40",
      iconBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      iconText: "text-indigo-400",
      glow: "from-indigo-500/20 via-purple-500/5 to-transparent",
      accentLine: "bg-indigo-500",
    },
    purple: {
      tabBg: "bg-purple-950/80",
      tabText: "text-purple-300",
      tabBorder: "border-purple-500/30",
      cardBorder: "group-hover:border-purple-500/40",
      iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      iconText: "text-purple-400",
      glow: "from-purple-500/20 via-pink-500/5 to-transparent",
      accentLine: "bg-purple-500",
    },
    cyan: {
      tabBg: "bg-cyan-950/80",
      tabText: "text-cyan-300",
      tabBorder: "border-cyan-500/30",
      cardBorder: "group-hover:border-cyan-500/40",
      iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      iconText: "text-cyan-400",
      glow: "from-cyan-500/20 via-blue-500/5 to-transparent",
      accentLine: "bg-cyan-500",
    },
  };

  const theme = colorMap[accentColor] || colorMap.indigo;

  return (
    <motion.div
      whileHover={{ y: -6, transition: { duration: 0.25, ease: "easeOut" } }}
      className="group relative flex flex-col pt-7 cursor-default"
    >
      {/* 1. Folder Tab Header (Cutout Notch Inspired by Framer Cards Folder) */}
      <div className="absolute top-0 left-6 z-20 flex items-center">
        {/* Custom Folder Tab Silhouette */}
        <div
          className={`flex items-center gap-2 px-4 py-1.5 rounded-t-xl border-t border-x ${theme.tabBorder} ${theme.tabBg} backdrop-blur-md shadow-lg shadow-black/40`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse opacity-80" />
          <span className={`text-[11px] font-mono font-semibold tracking-wider uppercase ${theme.tabText}`}>
            {badge}
          </span>
        </div>

        {/* Curved File Tab Fillet SVG connecting to top border */}
        <svg
          className="w-5 h-7 text-[#0c1220] fill-current -ml-0.5 pointer-events-none"
          viewBox="0 0 20 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 28V0C0 7 7 14 14 21L20 28H0Z"
            fill="currentColor"
            className="opacity-90"
          />
        </svg>
      </div>

      {/* 2. Main Folder Card Container */}
      <div
        className={`relative z-10 flex flex-col justify-between h-full rounded-3xl border border-white/[0.08] ${theme.cardBorder} bg-[#0c1220]/90 backdrop-blur-xl p-7 md:p-8 overflow-hidden shadow-2xl transition-all duration-300`}
      >
        {/* Subtle radial glow background on hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${theme.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
        />

        {/* Ambient Top Light Beam */}
        <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

        {/* Giant Watermark Numeric Index */}
        <div className="absolute top-4 right-6 font-mono text-6xl md:text-7xl font-black text-white/[0.04] group-hover:text-white/[0.12] transition-colors duration-300 select-none pointer-events-none">
          {formattedIndex}
        </div>

        {/* Upper Content Section */}
        <div className="relative z-10 space-y-4">
          {/* Icon Box */}
          <div className="flex items-center justify-between">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-md transition-transform duration-300 group-hover:scale-105 ${theme.iconBg}`}
            >
              <Icon className="w-6 h-6" />
            </div>

            <div className="w-8 h-8 rounded-full bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-slate-500 group-hover:text-white transition-colors">
              <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-white transition-colors">
              {title}
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              {description}
            </p>
          </div>
        </div>

        {/* Lower Interactive Peek-Out Document Sheet (Simulates paper peeking out of folder) */}
        {previewSnippet && (
          <div className="relative z-10 mt-6 pt-4 border-t border-white/[0.06]">
            <motion.div
              initial={false}
              className="p-3 rounded-xl bg-black/40 border border-white/[0.04] group-hover:border-white/[0.1] transition-all flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${theme.accentLine}`} />
                <span className="text-[11px] font-mono text-slate-400">
                  {previewSnippet.label}
                </span>
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-200">
                {previewSnippet.value}
              </span>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default FolderCard;
