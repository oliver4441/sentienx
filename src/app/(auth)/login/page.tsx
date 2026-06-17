"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login, error: authError } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }
  }, []);

  const handleLogin = async () => {
    setError(null);
    try {
      await login();
    } catch {
      setError("Failed to initiate login. Please try again.");
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      const response = await fetch("/api/auth/demo", { credentials: "include" });
      if (response.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("Failed to start demo session. Please try again.");
      }
    } catch {
      setError("Failed to start demo session. Please try again.");
    } finally {
      setDemoLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070709]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#71717a]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#070709] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#6366f1_0%,_transparent_60%)] opacity-[0.04]" />

      <div className="relative w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <img src="/logo.jpg" alt="Sentienx" className="w-11 h-11 rounded-xl" />
            <span className="text-2xl font-bold text-[#f4f4f5] tracking-tight">Sentienx</span>
          </div>
          <p className="text-[#a1a1aa]">Connect your Deriv account or try demo mode</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-[#ff1744]/[0.08] border border-[#ff1744]/15 text-sm text-[#ff1744]">
              {error}
            </div>
          )}

          {authError && (
            <div className="p-3.5 rounded-xl bg-[#ff1744]/[0.08] border border-[#ff1744]/15 text-sm text-[#ff1744]">
              {authError}
            </div>
          )}

          {/* Real Deriv Login */}
          <button
            onClick={handleLogin}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f46e5] hover:from-[#818cf8] hover:to-[#6366f1] text-white font-medium transition-all hover:shadow-lg hover:shadow-[#6366f1]/20 flex items-center justify-center gap-3 text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
            Connect with Deriv
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#16161d] text-[#71717a]">or</span>
            </div>
          </div>

          {/* Demo Login */}
          <button
            onClick={handleDemoLogin}
            disabled={demoLoading}
            className="w-full py-3.5 px-4 rounded-xl border border-purple-500/20 bg-purple-500/[0.06] hover:bg-purple-500/[0.1] hover:border-purple-500/30 text-purple-300 font-medium transition-all flex items-center justify-center gap-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {demoLoading ? (
              <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
                </svg>
                Try Demo — $10,000 Virtual
              </>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#16161d] text-[#71717a]">Secure OAuth 2.0</span>
            </div>
          </div>

          <p className="text-xs text-center text-[#71717a] leading-relaxed">
            Demo mode uses virtual money — no real trading.<br />
            Connect a Deriv account for live trading.
          </p>
        </div>

        {/* Back to home */}
        <p className="text-center">
          <a href="/" className="text-sm text-[#71717a] hover:text-[#a1a1aa] transition-colors">
            Back to home
          </a>
        </p>
      </div>
    </div>
  );
}
