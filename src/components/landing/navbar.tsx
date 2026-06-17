"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#earn", label: "Earn" },
    { href: "#course", label: "Academy" },
    { href: "#pricing", label: "Pricing" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#070709]/90 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/20"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <img src="/logo.jpg" alt="Sentienx" className="w-8 h-8 rounded-lg" />
            <span className="text-lg font-bold text-[#f4f4f5] tracking-tight hidden sm:block">Sentienx</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm text-[#a1a1aa] hover:text-[#f4f4f5] rounded-lg hover:bg-white/[0.04] transition-all"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm text-[#a1a1aa] hover:text-[#f4f4f5] rounded-lg hover:bg-white/[0.04] transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 text-sm font-medium rounded-lg bg-[#6366f1] hover:bg-[#4f46e5] text-white transition-all hover:shadow-lg hover:shadow-[#6366f1]/20"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/[0.05] transition-colors text-[#a1a1aa]"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="4" y1="8" x2="20" y2="8" /><line x1="4" y1="16" x2="20" y2="16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile menu panel */}
      <div
        className={`fixed top-16 right-0 z-40 w-72 h-[calc(100vh-4rem)] bg-[#0f0f14] border-l border-white/[0.06] transform transition-transform duration-300 ease-out md:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 space-y-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm text-[#a1a1aa] hover:text-[#f4f4f5] rounded-xl hover:bg-white/[0.04] transition-all"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/[0.06] space-y-2">
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="block w-full text-center px-4 py-3 text-sm text-[#a1a1aa] hover:text-[#f4f4f5] rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            onClick={() => setMobileOpen(false)}
            className="block w-full text-center px-4 py-3 text-sm font-medium rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white transition-all"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </>
  );
}
