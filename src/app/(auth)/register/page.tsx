"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

/**
 * Register page — same as login for Deriv OAuth flow.
 * Deriv handles account creation during OAuth.
 */
export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleRegister = async () => {
    try {
      const response = await fetch("/api/auth/deriv/login?action=registration");
      const data = await response.json();

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    } catch {
      // handle error
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
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <img src="/logo.jpg" alt="Sentienx" className="w-10 h-10 rounded-xl" />
            <span className="text-2xl font-bold text-sentienx-text">
              Sentienx
            </span>
          </div>
          <p className="text-sentienx-text-muted">
            Create your free Deriv account through Sentienx
          </p>
        </div>

        <div className="glass-card p-8 space-y-6">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-center">
              Why trade through Sentienx?
            </h2>
            <ul className="space-y-2 text-sm text-sentienx-text-muted">
              <li className="flex items-start gap-2">
                <span className="text-sentienx-bull mt-0.5">+</span>
                Powerful custom trading dashboard
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sentienx-bull mt-0.5">+</span>
                Automated trading bots with proven strategies
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sentienx-bull mt-0.5">+</span>
                Trading academy with guides and tutorials
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sentienx-bull mt-0.5">+</span>
                Bankroll management and risk tools
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sentienx-bull mt-0.5">+</span>
                Portfolio analytics and trade history
              </li>
            </ul>
          </div>

          <button
            onClick={handleRegister}
            className="w-full py-3 px-4 rounded-xl bg-sentienx-brand hover:bg-sentienx-brand-dark text-white font-medium transition-all hover:shadow-lg hover:shadow-sentienx-brand/25"
          >
            Create Free Account
          </button>

          <p className="text-xs text-center text-sentienx-text-dim">
            Already have a Deriv account?{" "}
            <a href="/login" className="text-sentienx-brand hover:underline">
              Sign in
            </a>
          </p>
        </div>

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
