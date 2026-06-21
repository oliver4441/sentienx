"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

/* ─── Navigation Config ───────────────────────────────────────────── */

const TOP_NAV = [
  { href: "/dashboard", label: "Overview", icon: "grid" },
  { href: "/dashboard/trade", label: "Trade", icon: "trending-up" },
  { href: "/dashboard/bots", label: "Bots", icon: "bot" },
  { href: "/dashboard/markets", label: "Markets", icon: "bar-chart" },
  { href: "/dashboard/crash", label: "Games", icon: "zap", badge: "HOT" },
];

const ALL_NAV = [
  { href: "/dashboard", label: "Overview", icon: "grid" },
  { href: "/dashboard/trade", label: "Trade", icon: "trending-up" },
  { href: "/dashboard/markets", label: "Markets", icon: "bar-chart" },
  { href: "/dashboard/positions", label: "Positions", icon: "briefcase" },
  { href: "/dashboard/history", label: "History", icon: "clock" },
  { href: "/dashboard/bots", label: "Trading Bots", icon: "bot" },
  { href: "/dashboard/bankroll", label: "Bankroll", icon: "wallet" },
  { href: "/dashboard/academy", label: "Academy", icon: "book" },
  { href: "/dashboard/crash", label: "Crash Game", icon: "zap", badge: "HOT" },
];

// Bottom tab bar items (portrait mobile)
const BOTTOM_TABS = [
  { href: "/dashboard", label: "Home", icon: "grid" },
  { href: "/dashboard/trade", label: "Trade", icon: "trending-up" },
  { href: "/dashboard/bots", label: "Bots", icon: "bot" },
  { href: "/dashboard/markets", label: "Markets", icon: "bar-chart" },
  { href: "/dashboard/more", label: "More", icon: "menu" },
];

/* ─── Icon Component ───────────────────────────────────────────────── */

function Icon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, ReactNode> = {
    grid: (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>),
    "bar-chart": (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>),
    "trending-up": (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>),
    briefcase: (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>),
    clock: (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>),
    bot: (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg>),
    wallet: (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>),
    book: (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>),
    "dollar-sign": (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>),
    zap: (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>),
    users: (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>),
    search: (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>),
    bell: (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>),
    settings: (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>),
    logout: (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>),
    external: (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>),
    chevron: (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>),
    x: (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>),
    menu: (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="8" x2="21" y2="8" /><line x1="3" y1="16" x2="21" y2="16" /></svg>),
  };
  return icons[name] || null;
}

/* ─── Notifications Panel ──────────────────────────────────────────── */

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const notifications = [
    { id: 1, title: "Welcome to Sentienx", message: "Connect your Deriv account to start trading.", time: "Just now", read: false },
    { id: 2, title: "Academy available", message: "New trading courses are available in the Academy.", time: "1h ago", read: false },
  ];

  return (
    <div ref={panelRef} className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-1rem)] rounded-2xl border border-white/[0.08] bg-[#0f0f14] shadow-2xl shadow-black/40 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-[#f4f4f5]">Notifications</h3>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#6366f1]/10 text-[#818cf8]">
          {notifications.filter(n => !n.read).length} new
        </span>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.map((n) => (
          <div key={n.id} className={`px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${!n.read ? "bg-[#6366f1]/[0.03]" : ""}`}>
            <div className="flex items-start gap-3">
              {!n.read && <div className="w-2 h-2 rounded-full bg-[#6366f1] mt-1.5 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#f4f4f5]">{n.title}</p>
                <p className="text-xs text-[#71717a] mt-0.5 leading-relaxed">{n.message}</p>
                <p className="text-[10px] text-[#71717a] mt-1">{n.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 border-t border-white/[0.06]">
        <button className="text-xs text-[#6366f1] hover:text-[#818cf8] font-medium transition-colors">
          Mark all as read
        </button>
      </div>
    </div>
  );
}

/* ─── User Dropdown ─────────────────────────────────────────────────── */

function UserDropdown({ onClose }: { onClose: () => void }) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { accountInfo, isDemo, logout } = useAuth();
  const router = useRouter();

  const fullname = accountInfo?.authorize?.fullname || (accountInfo as unknown as { fullname?: string })?.fullname || "Trader";
  const email = accountInfo?.authorize?.email || (accountInfo as unknown as { email?: string })?.email || "";
  const balance = accountInfo?.authorize?.balance ?? (accountInfo as unknown as { balance?: number })?.balance ?? (isDemo ? 10000 : 0);
  const currency = accountInfo?.authorize?.currency || "USD";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <div ref={dropdownRef} className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-1rem)] rounded-2xl border border-white/[0.08] bg-[#0f0f14] shadow-2xl shadow-black/40 z-50 overflow-hidden">
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
            isDemo ? "bg-purple-500/15 text-purple-400" : "bg-[#6366f1]/15 text-[#818cf8]"
          }`}>
            {fullname[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#f4f4f5] truncate">{fullname}</p>
            <p className="text-xs text-[#71717a] truncate">{email || (isDemo ? "Demo Account" : "Connected via Deriv")}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
          <span className="text-xs text-[#71717a]">Balance</span>
          <span className="ml-auto text-sm font-semibold tabular-nums text-[#f4f4f5]">
            {currency} {Number(balance).toFixed(2)}
          </span>
        </div>
      </div>
      <div className="p-1.5">
        {[
          { icon: "grid", label: "Dashboard", href: "/dashboard" },
          { icon: "settings", label: "Settings", href: "/dashboard/settings" },
          { icon: "dollar-sign", label: "Earnings", href: "/dashboard/earnings" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-white/[0.04] transition-all"
          >
            <Icon name={item.icon} className="w-4 h-4 text-[#71717a]" />
            {item.label}
          </Link>
        ))}
      </div>
      <div className="p-1.5 border-t border-white/[0.06]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-[#ff1744] hover:bg-[#ff1744]/[0.06] transition-all"
        >
          <Icon name="logout" className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

/* ─── Search Modal ──────────────────────────────────────────────────── */

function SearchModal({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const quickLinks = [
    { icon: "trending-up", label: "Trade", href: "/dashboard/trade" },
    { icon: "bot", label: "Trading Bots", href: "/dashboard/bots" },
    { icon: "bar-chart", label: "Markets", href: "/dashboard/markets" },
    { icon: "book", label: "Academy", href: "/dashboard/academy" },
    { icon: "wallet", label: "Bankroll", href: "/dashboard/bankroll" },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-3 pt-[8vh] sm:pt-[15vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0f0f14] shadow-2xl shadow-black/50 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <Icon name="search" className="w-5 h-5 text-[#71717a] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, markets, features..."
            className="flex-1 bg-transparent text-sm text-[#f4f4f5] placeholder-[#71717a] outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[10px] text-[#71717a] font-mono">
            ESC
          </kbd>
        </div>
        <div className="p-3">
          <p className="px-2 py-1.5 text-[10px] font-semibold text-[#71717a] uppercase tracking-wider">Quick Links</p>
          <div className="space-y-0.5">
            {quickLinks
              .filter((l) => !query || l.label.toLowerCase().includes(query.toLowerCase()))
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-white/[0.04] transition-all"
                >
                  <Icon name={link.icon} className="w-4 h-4 text-[#71717a]" />
                  {link.label}
                  <Icon name="external" className="w-3 h-3 ml-auto text-[#71717a]" />
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Bottom Tab Bar (Portrait Mobile) ──────────────────────────────── */

function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/[0.08] md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-14 px-1">
        {BOTTOM_TABS.map((tab) => {
          const isActive = tab.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(tab.href) && tab.href !== "/dashboard/more";

          const isMoreActive = tab.href === "/dashboard/more" && !BOTTOM_TABS.some(
            t => t.href !== "/dashboard/more" && (t.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(t.href))
          );

          const active = tab.href === "/dashboard/more" ? isMoreActive : isActive;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl transition-all min-h-[44px] ${
                active ? "text-[#818cf8]" : "text-[#71717a]"
              }`}
            >
              <div className={`relative p-1 rounded-lg transition-colors ${active ? "bg-[#6366f1]/10" : ""}`}>
                <Icon name={tab.icon} className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-medium ${active ? "text-[#818cf8]" : "text-[#71717a]"}`}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* ─── More Menu (Mobile) ────────────────────────────────────────────── */

function MoreMenu({ onClose }: { onClose: () => void }) {
  const { isDemo, logout } = useAuth();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  const moreItems = ALL_NAV.filter(
    item => !BOTTOM_TABS.some(tab => tab.href === item.href)
  );

  return (
    <div ref={menuRef} className="absolute right-0 bottom-full mb-2 w-56 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/[0.08] bg-[#0f0f14] shadow-2xl shadow-black/40 z-50 overflow-hidden">
      <div className="p-1.5 max-h-[60vh] overflow-y-auto">
        {moreItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-white/[0.04] transition-all"
          >
            <Icon name={item.icon} className="w-4 h-4 text-[#71717a]" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                item.badge === "HOT" ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"
              }`}>
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
      <div className="p-1.5 border-t border-white/[0.06]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-[#ff1744] hover:bg-[#ff1744]/[0.06] transition-all"
        >
          <Icon name="logout" className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

/* ─── Main Dashboard Layout ─────────────────────────────────────────── */

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, logout, accountInfo, isDemo } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      const landscape = window.innerWidth > window.innerHeight && window.innerHeight < 500;
      setIsMobile(mobile);
      setIsLandscape(landscape);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (!isLoading && !isAuthenticated) {
    router.push("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070709]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#71717a]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const balance = accountInfo?.authorize?.balance ?? (accountInfo as unknown as { balance?: number })?.balance ?? (isDemo ? 10000 : 0);
  const currency = accountInfo?.authorize?.currency || "USD";
  const fullname = accountInfo?.authorize?.fullname || (accountInfo as unknown as { fullname?: string })?.fullname || "Trader";

  // Check if we're on the "more" page (mobile)
  const isMorePage = pathname === "/dashboard/more" && isMobile;

  return (
    <div className="min-h-screen flex bg-[#070709]">
      {/* Search Modal */}
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — hidden on portrait mobile, shown on landscape or md+ */}
      {(!isMobile || isLandscape) && (
        <aside
          className={`${
            isMobile && isLandscape
              ? "fixed inset-y-0 left-0 z-50 w-[220px]"
              : isMobile
                ? `fixed inset-y-0 left-0 z-50 w-[280px] transform transition-transform duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`
                : "fixed inset-y-0 left-0 z-40 w-[250px]"
          } bg-[#0a0a0f] border-r border-white/[0.06] flex flex-col`}
        >
          {/* Logo */}
          <div className="h-14 sm:h-16 flex items-center px-4 sm:px-5 border-b border-white/[0.06] shrink-0">
            <img src="/logo.jpg" alt="Sentienx" className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl shrink-0" />
            <div className="ml-2.5 sm:ml-3">
              <span className="text-sm sm:text-base font-bold text-[#f4f4f5] tracking-tight">Sentienx</span>
              {isDemo && <span className="block text-[10px] text-purple-400 font-medium">DEMO MODE</span>}
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-3 sm:py-4 px-2 sm:px-3 space-y-0.5 overflow-y-auto">
            {ALL_NAV.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-[#6366f1]/10 text-[#818cf8]"
                      : "text-[#a1a1aa] hover:bg-white/[0.04] hover:text-[#f4f4f5]"
                  }`}
                  title={item.label}
                >
                  <Icon name={item.icon} className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-[#6366f1]" : "text-[#71717a]"}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.badge && (
                    <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                      item.badge === "HOT" ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-white/[0.06] p-2 sm:p-3 shrink-0">
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-colors">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                isDemo ? "bg-purple-500/15 text-purple-400" : "bg-[#6366f1]/15 text-[#818cf8]"
              }`}>
                {fullname[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#f4f4f5] truncate">{fullname}</p>
                <p className="text-xs text-[#71717a] truncate tabular-nums">
                  {currency} {Number(balance).toFixed(2)}
                </p>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-[#71717a] hover:text-[#f4f4f5] hover:bg-white/[0.05] transition-colors"
                title="Logout"
              >
                <Icon name="logout" className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main content area */}
      <div className={`flex-1 flex flex-col ${(!isMobile || isLandscape) ? "md:ml-[250px]" : ""}`}>
        {/* ─── TOP NAVBAR ─────────────────────────────────────────── */}
        <header className={`h-14 sm:h-16 border-b border-white/[0.06] bg-[#070709]/80 backdrop-blur-xl sticky top-0 z-30 ${isMobile && !isLandscape ? "safe-area-top" : ""}`}>
          <div className="flex items-center justify-between h-full px-3 sm:px-4 md:px-6">
            {/* Left: hamburger + breadcrumb */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Hamburger — only on portrait mobile */}
              {isMobile && !isLandscape && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2.5 -ml-1 rounded-xl hover:bg-white/[0.05] transition-colors text-[#a1a1aa] shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Icon name="menu" className="w-5 h-5" />
                </button>
              )}

              {/* Breadcrumb — hidden on small screens */}
              <div className="hidden sm:flex items-center gap-2 text-sm min-w-0">
                <span className="text-[#71717a] shrink-0">Dashboard</span>
                {pathname !== "/dashboard" && (
                  <>
                    <svg className="w-3 h-3 text-[#71717a] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    <span className="text-[#f4f4f5] font-medium capitalize truncate">
                      {pathname.split("/").pop()?.replace(/-/g, " ") || "Overview"}
                    </span>
                  </>
                )}
              </div>

              {/* Mobile page title */}
              <span className="sm:hidden text-sm font-medium text-[#f4f4f5] capitalize truncate">
                {pathname === "/dashboard" ? "Overview" : pathname.split("/").pop()?.replace(/-/g, " ") || "Overview"}
              </span>
            </div>

            {/* Center: Search trigger — desktop only */}
            <div className="flex-1 flex justify-center max-w-md mx-4 hidden md:flex">
              <button
                onClick={() => setShowSearch(true)}
                className="flex items-center gap-2.5 w-full max-w-sm px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] transition-colors group"
              >
                <Icon name="search" className="w-4 h-4 text-[#71717a] group-hover:text-[#a1a1aa] transition-colors" />
                <span className="text-sm text-[#71717a] group-hover:text-[#a1a1aa] transition-colors flex-1 text-left">
                  Search...
                </span>
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[10px] text-[#71717a] font-mono">
                  Ctrl K
                </kbd>
              </button>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* Mobile search */}
              <button
                onClick={() => setShowSearch(true)}
                className="md:hidden p-2 sm:p-2.5 rounded-xl hover:bg-white/[0.05] transition-colors text-[#a1a1aa]"
              >
                <Icon name="search" className="w-5 h-5" />
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => { setShowNotifications(!showNotifications); setShowUserDropdown(false); }}
                  className="p-2 sm:p-2.5 rounded-xl hover:bg-white/[0.05] transition-colors text-[#a1a1aa] relative"
                >
                  <Icon name="bell" className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#6366f1]" />
                </button>
                {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
              </div>

              {/* Divider — hidden on mobile */}
              <div className="w-px h-6 bg-white/[0.06] mx-1 hidden sm:block" />

              {/* Balance pill — always visible */}
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] mr-0.5 sm:mr-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isDemo ? "bg-purple-400" : "bg-[#00e676]"} pulse-dot`} />
                <span className="text-[11px] sm:text-xs font-medium tabular-nums text-[#a1a1aa]">
                  {currency} {Number(balance).toFixed(2)}
                </span>
              </div>

              {/* User dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setShowUserDropdown(!showUserDropdown); setShowNotifications(false); }}
                  className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-white/[0.05] transition-colors"
                >
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isDemo ? "bg-purple-500/15 text-purple-400" : "bg-[#6366f1]/15 text-[#818cf8]"
                  }`}>
                    {fullname[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="text-sm font-medium text-[#f4f4f5] hidden lg:block">{fullname.split(" ")[0]}</span>
                  <Icon name="chevron" className="w-3.5 h-3.5 text-[#71717a] hidden lg:block" />
                </button>
                {showUserDropdown && <UserDropdown onClose={() => setShowUserDropdown(false)} />}
              </div>
            </div>
          </div>
        </header>

        {/* Demo banner */}
        {isDemo && (
          <div className="bg-gradient-to-r from-purple-600/10 via-purple-600/5 to-blue-600/10 border-b border-purple-500/10 px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-center gap-2 sm:gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse shrink-0" />
            <span className="text-[11px] sm:text-xs font-medium text-purple-300/90 text-center">
              Demo Mode — $10,000 virtual balance. No real money at risk.
            </span>
            <a
              href="/login"
              className="text-[11px] sm:text-xs font-semibold text-purple-400 hover:text-purple-300 underline underline-offset-2 decoration-purple-400/30 hover:decoration-purple-400/60 transition-colors shrink-0"
            >
              Connect account
            </a>
          </div>
        )}

        {/* Page content */}
        <main className={`flex-1 overflow-y-auto ${isMobile && !isLandscape ? "pb-24" : "pb-6"}`}>
          <div className="p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Tab Bar — portrait mobile only */}
      {isMobile && !isLandscape && <BottomTabBar />}

      {/* More Menu for bottom tab */}
      {showMoreMenu && (
        <div className="fixed bottom-16 right-2 z-50 md:hidden">
          <MoreMenu onClose={() => setShowMoreMenu(false)} />
        </div>
      )}
    </div>
  );
}
