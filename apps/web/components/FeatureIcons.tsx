"use client";

import React from "react";

// 1. JobPilot Brand Logo: Aerospace Jet Wing + Quantum AI Core
export function JobPilotLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="jp-logo-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="jp-logo-grad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      {/* Outer Aerospace Flight Wings */}
      <path
        d="M18 3L4 26L18 20L32 26L18 3Z"
        fill="url(#jp-logo-grad1)"
        className="drop-shadow-[0_2px_8px_rgba(99,102,241,0.5)]"
      />
      {/* Inner Supersonic Jet Intake */}
      <path
        d="M18 10L10 23L18 20L26 23L18 10Z"
        fill="#070a12"
      />
      {/* Quantum Copilot Core Bead */}
      <circle cx="18" cy="18" r="3.2" fill="url(#jp-logo-grad2)" />
      <circle cx="18" cy="18" r="1.5" fill="#ffffff" />
      {/* Tail Booster Ray */}
      <path
        d="M16 26L18 33L20 26H16Z"
        fill="#38bdf8"
        className="opacity-90"
      />
    </svg>
  );
}

// 2. Card 1: Zero Blind Submissions — Headless Browser & Human Approval Gate Shield
export function BrowserApprovalSVG({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="shield-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="browser-bg" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#064e3b" stopOpacity="0.4" />
          <stop offset="1" stopColor="#022c22" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      {/* Browser Viewport Frame */}
      <rect x="4" y="6" width="40" height="34" rx="8" fill="url(#browser-bg)" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.3" />
      {/* Window Controls */}
      <circle cx="10" cy="12" r="2" fill="#ef4444" />
      <circle cx="16" cy="12" r="2" fill="#f59e0b" />
      <circle cx="22" cy="12" r="2" fill="#10b981" />
      <line x1="4" y1="18" x2="44" y2="18" stroke="#10b981" strokeWidth="1" strokeOpacity="0.2" />
      
      {/* Security Approval Shield in Center */}
      <path
        d="M24 16L34 20V27C34 33 29.5 37.5 24 39C18.5 37.5 14 33 14 27V20L24 16Z"
        fill="url(#shield-grad)"
        className="drop-shadow-[0_2px_10px_rgba(16,185,129,0.4)]"
      />
      {/* Checkmark verification */}
      <path
        d="M20 27L23 30L28 24"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 3. Card 2: Local Ollama or Cloud LLMs — Dual-Engine Neural Processor
export function NeuralEngineSVG({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="neural-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      {/* Processor Die Base */}
      <rect x="10" y="10" width="28" height="28" rx="6" fill="#1e1b4b" stroke="url(#neural-grad)" strokeWidth="1.8" />
      
      {/* External Pins */}
      <path d="M16 6V10M24 6V10M32 6V10M16 38V42M24 38V42M32 38V42" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 16H10M6 24H10M6 32H10M38 16H42M38 24H42M38 32H42" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" />
      
      {/* Central AI Synapse Core */}
      <rect x="17" y="17" width="14" height="14" rx="4" fill="url(#neural-grad)" />
      {/* Command prompt CLI cursor */}
      <path d="M21 22L24 24L21 26" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="25" y1="26" x2="27" y2="26" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// 4. Card 3: Grounded Screening Answers — Verified Resume Document with Semantic Seal
export function GroundedDocSVG({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="doc-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c084fc" />
          <stop offset="1" stopColor="#9333ea" />
        </linearGradient>
      </defs>
      {/* Document Sheet */}
      <path
        d="M12 8C12 6.89543 12.8954 6 14 6H28L36 14V38C36 39.1046 35.1046 40 34 40H14C12.8954 40 12 39.1046 12 38V8Z"
        fill="#2e1065"
        stroke="url(#doc-grad)"
        strokeWidth="1.8"
      />
      {/* Folded Corner */}
      <path d="M28 6V14H36" stroke="url(#doc-grad)" strokeWidth="1.8" fill="#3b0764" />
      
      {/* Grounded Code / Text Lines */}
      <line x1="17" y1="18" x2="26" y2="18" stroke="#d8b4fe" strokeWidth="2" strokeLinecap="round" />
      <line x1="17" y1="23" x2="31" y2="23" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" />
      <line x1="17" y1="28" x2="25" y2="28" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
      
      {/* Golden/Purple Authenticity Stamp */}
      <circle cx="30" cy="33" r="5" fill="#9333ea" stroke="#f3e8ff" strokeWidth="1.5" />
      <path d="M28 33L29.5 34.5L32 31.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 5. Card 4: Transparent Compat Score — Telemetry Radar & Precision Alignment Matrix
export function RadarScoreSVG({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="radar-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      {/* Outer Concentric Radar Circles */}
      <circle cx="24" cy="24" r="17" stroke="#0369a1" strokeWidth="1.5" strokeOpacity="0.4" fill="#082f49" fillOpacity="0.3" />
      <circle cx="24" cy="24" r="11" stroke="#0ea5e9" strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="24" cy="24" r="5" fill="url(#radar-grad)" />
      
      {/* Precision Crosshairs */}
      <line x1="24" y1="4" x2="24" y2="44" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="2 2" strokeOpacity="0.6" />
      <line x1="4" y1="24" x2="44" y2="24" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="2 2" strokeOpacity="0.6" />
      
      {/* Sweeping Target Indicator Points */}
      <circle cx="31" cy="17" r="2" fill="#38bdf8" className="animate-ping" />
      <circle cx="31" cy="17" r="2" fill="#ffffff" />
      <circle cx="16" cy="30" r="1.5" fill="#38bdf8" />
    </svg>
  );
}
