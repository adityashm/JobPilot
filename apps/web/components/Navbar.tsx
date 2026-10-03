"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { HealthBadge } from "./HealthBadge";
import {
  Compass,
  LogOut,
  Briefcase,
  FileText,
  User as UserIcon,
  CheckCircle2,
  Settings as SettingsIcon,
} from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Compass },
    { href: "/jobs", label: "Job Discovery", icon: Briefcase },
    { href: "/applications", label: "Applications", icon: CheckCircle2 },
    { href: "/profile/resume", label: "Resumes", icon: FileText },
    { href: "/profile", label: "Career Profile", icon: UserIcon },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
  ];


  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-sm group-hover:bg-sky-500 transition-colors">
              <Compass className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white">
                JobPilot
              </span>
              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium tracking-wide uppercase">
                AI Career Assistant
              </span>
            </div>
          </Link>

          {user && (
            <nav className="hidden lg:flex items-center gap-1 pl-4 border-l border-slate-200 dark:border-slate-800">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 font-semibold"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
                    }`}
                  >
                    <Icon className="w-4 h-4 opacity-75" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          <HealthBadge />

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center justify-center font-semibold text-xs">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
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
                className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-sky-600 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors shadow-sm"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
