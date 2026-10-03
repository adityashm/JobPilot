"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { HealthBadge } from "./HealthBadge";
import { motion } from "framer-motion";
import { JobPilotLogo } from "./FeatureIcons";
import {
  Compass,
  LogOut,
  Briefcase,
  FileText,
  User as UserIcon,
  CheckCircle2,
  Settings as SettingsIcon,
  Sparkles,
} from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Compass },
    { href: "/jobs", label: "Discovery & Matching", icon: Briefcase },
    { href: "/applications", label: "Applications", icon: CheckCircle2 },
    { href: "/profile/resume", label: "Resume Parser", icon: FileText },
    { href: "/profile", label: "Career Profile", icon: UserIcon },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#080c16]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-900/60 via-indigo-950 to-purple-950 border border-indigo-500/30 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:border-indigo-500/60 group-hover:shadow-indigo-500/30 transition-all duration-300">
                <JobPilotLogo className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base leading-tight tracking-tight text-white flex items-center gap-1.5">
                JobPilot
                <span className="px-1.5 py-0.5 text-[10px] font-mono tracking-wider font-semibold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                Agentic Application Copilot
              </span>
            </div>
          </Link>

          {user && (
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 ${
                      isActive
                        ? "text-white font-semibold"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="navActivePill"
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-indigo-500/20 border border-indigo-500/30 -z-10 shadow-sm"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          <HealthBadge />

          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-white/[0.08]">
              <Link
                href="/profile"
                className="flex items-center gap-2.5 px-2.5 py-1 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] transition-all"
              >
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-[11px] shadow-sm">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-medium text-slate-200 leading-tight">
                    {user.full_name || user.email.split("@")[0]}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                    {user.email}
                  </span>
                </div>
              </Link>

              <button
                onClick={logout}
                title="Sign out"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer border border-transparent hover:border-rose-500/20"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="relative group overflow-hidden px-4 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white transition-all shadow-md shadow-indigo-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Get Started</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
