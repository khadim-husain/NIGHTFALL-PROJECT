import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nf: {
          bg: "#F4F7FB",
          surface: "#FFFFFF",
          border: "#E2EAF4",
          "border-light": "#EDF3FA",
          navy: "#10234F",
          secondary: "#64748B",
          muted: "#94A3B8",
          blue: {
            DEFAULT: "#2563EB",
            hover: "#1D4ED8",
            light: "#EAF2FF",
            subtle: "#F0F6FF",
          },
          green: {
            DEFAULT: "#10B981",
            hover: "#059669",
            light: "#E8FBF4",
            border: "#A7F3D0",
          },
          amber: {
            DEFAULT: "#F59E0B",
            hover: "#D97706",
            light: "#FEF7E6",
            border: "#FDE68A",
          },
          red: {
            DEFAULT: "#EF4444",
            hover: "#DC2626",
            light: "#FEF2F2",
            border: "#FECACA",
          },
          violet: {
            DEFAULT: "#8B5CF6",
            light: "#F5F3FF",
            border: "#DDD6FE",
          },
          teal: {
            DEFAULT: "#0D9488",
            light: "#F0FDFA",
            border: "#99F6E4",
          },
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(16, 35, 79, 0.04), 0 4px 12px rgba(16, 35, 79, 0.03)",
        "card-hover": "0 8px 24px rgba(16, 35, 79, 0.08)",
        dropdown: "0 10px 30px rgba(16, 35, 79, 0.12)",
        glow: "0 0 20px rgba(37, 99, 235, 0.25)",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
