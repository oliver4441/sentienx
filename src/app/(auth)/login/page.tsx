"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login, error: authError } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  // Check for OAuth error in URL
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sentienx-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <img src="/icon-192.png" alt="Sentienx" className="w-10 h-10 rounded-xl" />
            <span className="text-2xl font-bold text-sentienx-text">
              Sentienx
            </span>
          </div>
          <p className="text-sentienx-text-muted">
            Connect your Deriv account to start trading
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-sentienx-bear-bg border border-sentienx-bear/20 text-sm text-sentienx-bear">
              {error}
            </div>
          )}

          {authError && (
            <div className="p-3 rounded-lg bg-sentienx-bear-bg border border-sentienx-bear/20 text-sm text-sentienx-bear">
              {authError}
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full py-3 px-4 rounded-xl bg-sentienx-brand hover:bg-sentienx-brand-dark text-white font-medium transition-all hover:shadow-lg hover:shadow-sentienx-brand/25 flex items-center justify-center gap-3"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
            Connect with Deriv
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-sentienx-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-sentienx-card text-sentienx-text-dim">
                Secure OAuth 2.0
              </span>
            </div>
          </div>

          <p className="text-xs text-center text-sentienx-text-dim">
            By connecting, you agree to Sentienx&apos;s Terms of Service.
            <br />
            We never store your Deriv password.
          </p>
        </div>

        {/* Back to home */}
        <p className="text-center">
          <a
            href="/"
            className="text-sm text-sentienx-text-muted hover:text-sentienx-text transition-colors"
          >
            Back to home
          </a>
        </p>
      </div>
    </div>
  );
}
