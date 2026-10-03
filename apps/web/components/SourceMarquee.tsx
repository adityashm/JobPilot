"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Globe,
  Briefcase,
  Zap,
  Layers,
  ArrowUpRight,
} from "lucide-react";

interface SourceItem {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  type: "Job Board" | "ATS System";
  domain: string;
  glow: string;
}

const SOURCES: SourceItem[] = [
  {
    id: "LinkedIn",
    name: "LinkedIn",
    badge: "Public Jobs API",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    type: "Job Board",
    domain: "linkedin.com",
    glow: "from-blue-500/10 to-transparent",
  },
  {
    id: "Y Combinator",
    name: "Y Combinator",
    badge: "W25 & S24 Startups",
    badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    type: "Job Board",
    domain: "news.ycombinator.com",
    glow: "from-orange-500/10 to-transparent",
  },
  {
    id: "Wellfound",
    name: "Wellfound",
    badge: "AngelList Feeds",
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    type: "Job Board",
    domain: "wellfound.com",
    glow: "from-rose-500/10 to-transparent",
  },
  {
    id: "Naukri",
    name: "Naukri.com",
    badge: "India Tech Roles",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    type: "Job Board",
    domain: "naukri.com",
    glow: "from-indigo-500/10 to-transparent",
  },
  {
    id: "Greenhouse",
    name: "Greenhouse ATS",
    badge: "Assisted Autofill",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    type: "ATS System",
    domain: "boards.greenhouse.io",
    glow: "from-emerald-500/10 to-transparent",
  },
  {
    id: "Lever",
    name: "Lever ATS",
    badge: "Assisted Autofill",
    badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    type: "ATS System",
    domain: "jobs.lever.co",
    glow: "from-teal-500/10 to-transparent",
  },
  {
    id: "Remotive",
    name: "Remotive",
    badge: "Global Remote",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    type: "Job Board",
    domain: "remotive.com",
    glow: "from-cyan-500/10 to-transparent",
  },
  {
    id: "Arbeitnow",
    name: "Arbeitnow",
    badge: "Tech Feeds",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    type: "Job Board",
    domain: "arbeitnow.com",
    glow: "from-purple-500/10 to-transparent",
  },
];

export function SourceMarquee() {
  // Duplicate list to create seamless infinite scrolling effect
  const marqueeItems = [...SOURCES, ...SOURCES];

  return (
    <div className="w-full relative overflow-hidden py-6 group select-none">
      {/* Sleek edge fade masks on desktop */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#070a12] via-[#070a12]/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#070a12] via-[#070a12]/80 to-transparent z-10 pointer-events-none" />

      {/* Header Label */}
      <div className="flex items-center justify-center gap-2 mb-4 text-xs font-mono text-slate-400 tracking-wider uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
        <span>Connected Live Job Sources & ATS Portals</span>
      </div>

      {/* Scrolling Track */}
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] gap-4">
        {marqueeItems.map((item, idx) => (
          <Link
            key={`${item.id}-${idx}`}
            href={`/jobs?source=${encodeURIComponent(item.id)}`}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c1220]/80 hover:bg-white/[0.06] hover:border-indigo-500/40 transition-all duration-200 cursor-pointer shadow-lg backdrop-blur-md group/card"
          >
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-300 group-hover/card:text-indigo-400 transition-colors">
              {item.type === "ATS System" ? (
                <Zap className="w-4 h-4" />
              ) : (
                <Briefcase className="w-4 h-4" />
              )}
            </div>

            <div className="text-left space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white tracking-tight">
                  {item.name}
                </span>
                <ArrowUpRight className="w-3 h-3 text-slate-500 opacity-0 group-hover/card:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {item.domain}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default SourceMarquee;
