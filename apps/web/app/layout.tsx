import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { SmoothCursor } from "@/components/SmoothCursor";

export const metadata: Metadata = {
  title: "JobPilot — AI-Powered Job Search & Application Assistant",
  description:
    "Production-quality AI job search and application copilot. Explainable matching, structured career profiles, and human-in-the-loop browser automation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark">
      <body className="min-h-full flex flex-col bg-[#070a12] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <SmoothCursor />
        <AuthProvider>
          <div className="fixed inset-0 pointer-events-none bg-dot-grid opacity-40 z-0" />
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] hero-glow pointer-events-none z-0" />
          <div className="fixed top-20 right-0 w-[500px] h-[500px] hero-glow-cyan pointer-events-none z-0" />
          
          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 flex flex-col">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
