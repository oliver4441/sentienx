import type { NavigationType } from "@/types"

/**
 * Sentienx navigation structure
 */
export const navigationsData: NavigationType[] = [
  {
    title: "Main",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        iconName: "LayoutDashboard",
      },
    ],
  },
  {
    title: "Trading",
    items: [
      {
        title: "Markets",
        href: "/dashboard/markets",
        iconName: "ChartCandlestick",
      },
      {
        title: "Trade",
        href: "/dashboard/trade",
        iconName: "ArrowLeftRight",
      },
      {
        title: "Positions",
        href: "/dashboard/positions",
        iconName: "Briefcase",
      },
      {
        title: "History",
        href: "/dashboard/history",
        iconName: "Clock",
      },
    ],
  },
  {
    title: "Automation",
    items: [
      {
        title: "Bot Engine",
        href: "/dashboard/bots",
        iconName: "Bot",
      },
    ],
  },
  {
    title: "Resources",
    items: [
      {
        title: "Academy",
        href: "/dashboard/academy",
        iconName: "GraduationCap",
      },
      {
        title: "Bankroll",
        href: "/dashboard/bankroll",
        iconName: "Wallet",
      },
      {
        title: "Earnings",
        href: "/dashboard/earnings",
        iconName: "DollarSign",
      },
    ],
  },
]
