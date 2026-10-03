"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, FileText, Sliders, CheckSquare } from "lucide-react";

export function ProfileNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/profile", label: "Career Overview", icon: User },
    { href: "/profile/resume", label: "Resumes", icon: FileText },
    { href: "/profile/preferences", label: "Job Preferences", icon: Sliders },
    { href: "/profile/answers", label: "Answer Bank", icon: CheckSquare },
  ];

  return (
    <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 mb-6 overflow-x-auto pb-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              isActive
                ? "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-semibold border-b-2 border-sky-600 dark:border-sky-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900"
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
