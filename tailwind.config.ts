import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/providers/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        sentienx: {
          bg: "#070709",
          surface: "#0f0f14",
          card: "#16161d",
          border: "rgba(255, 255, 255, 0.06)",
          "border-hover": "rgba(255, 255, 255, 0.12)",
          text: "#f4f4f5",
          "text-muted": "#a1a1aa",
          "text-dim": "#71717a",
          brand: "#6366f1",
          "brand-light": "#818cf8",
          "brand-dark": "#4f46e5",
          bull: "#00e676",
          "bull-dim": "#00c853",
          "bull-bg": "rgba(0, 230, 118, 0.1)",
          bear: "#ff1744",
          "bear-dim": "#d50000",
          "bear-bg": "rgba(255, 23, 68, 0.1)",
          sidebar: "#0a0a0f",
          "sidebar-hover": "rgba(255, 255, 255, 0.04)",
          "sidebar-active": "rgba(99, 102, 241, 0.15)",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      animation: {
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
