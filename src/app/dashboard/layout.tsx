"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "grid" },
  { href: "/dashboard/markets", label: "Markets", icon: "bar-chart" },
  { href: "/dashboard/trade", label: "Trade", icon: "trending-up" },
  { href: "/dashboard/positions", label: "Positions", icon: "briefcase" },
  { href: "/dashboard/history", label: "History", icon: "clock" },
  { href: "/dashboard/bots", label: "Bots", icon: "bot" },
  { href: "/dashboard/bankroll", label: "Bankroll", icon: "wallet" },
  { href: "/dashboard/academy", label: "Academy", icon: "book" },
  { href: "/dashboard/earnings", label: "Earnings", icon: "dollar-sign" },
  { href: "/dashboard/crash", label: "Crash Game", icon: "zap", badge: "HOT" },
  { href: "/dashboard/affiliate", label: "Affiliate Hub", icon: "users", badge: "EARN" },
];

function Icon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, ReactNode> = {
    grid: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    "bar-chart": (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
      </svg>
    ),
    "trending-up": (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    briefcase: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    clock: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    bot: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" />
      </svg>
    ),
    wallet: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
      </svg>
    ),
    book: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    "dollar-sign": (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    zap: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    users: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  };
  return icons[name] || null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, logout, accountInfo } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auth guard
  if (!isLoading && !isAuthenticated) {
    router.push("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sentienx-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? "w-[68px]" : "w-[240px]"
        } bg-sentienx-sidebar border-r border-sentienx-border flex flex-col transition-all duration-200 fixed inset-y-0 left-0 z-40`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-sentienx-border shrink-0">
          <img
            src="/icon-192.png"
            alt="Sentienx"
            className="w-8 h-8 rounded-lg shrink-0"
          />
          {!sidebarCollapsed && (
            <span className="ml-3 text-lg font-bold text-sentienx-text whitespace-nowrap">
              Sentienx
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-sentienx-sidebar-active text-sentienx-brand"
                    : "text-sentienx-text-muted hover:bg-sentienx-sidebar-hover hover:text-sentienx-text"
                }`}
                title={item.label}
              >
                <Icon
                  name={item.icon}
                  className={`w-[18px] h-[18px] shrink-0 ${
                    isActive ? "text-sentienx-brand" : ""
                  }`}
                />
                {!sidebarCollapsed && (
                  <span className="whitespace-nowrap flex items-center gap-1.5">
                    {item.label}
                    {item.badge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        item.badge === "HOT"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-sentienx-border p-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sentienx-brand/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-sentienx-brand">
                {accountInfo?.authorize?.fullname?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {accountInfo?.authorize?.fullname || "Trader"}
                </p>
                <p className="text-xs text-sentienx-text-dim truncate">
                  {accountInfo?.authorize?.email || "Connected via Deriv"}
                </p>
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={logout}
                className="p-1.5 rounded text-sentienx-text-dim hover:text-sentienx-text hover:bg-sentienx-sidebar-hover transition-colors"
                title="Logout"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ${
          sidebarCollapsed ? "ml-[68px]" : "ml-[240px]"
        }`}
      >
        {/* Top bar */}
        <header className="h-14 border-b border-sentienx-border bg-sentienx-bg/80 backdrop-blur-xl sticky top-0 z-30 flex items-center px-6 justify-between">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-sentienx-sidebar-hover transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            {/* Connection status */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sentienx-bull pulse-dot" />
              <span className="text-xs text-sentienx-text-muted">
                Deriv Connected
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
