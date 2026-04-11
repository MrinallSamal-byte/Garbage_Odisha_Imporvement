import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./server/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        lg: "1.5rem",
        xl: "2rem",
      },
    },
    extend: {
      boxShadow: {
        civic: "0 18px 60px -24px rgba(15, 61, 61, 0.45)",
        card: "0 8px 30px -16px rgba(17, 47, 73, 0.2)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      colors: {
        ink: "#16324f",
        civic: {
          50: "#edf7f5",
          100: "#d2ece7",
          200: "#a7d8d0",
          300: "#77c0b6",
          400: "#43a799",
          500: "#218c80",
          600: "#176f67",
          700: "#145a56",
          800: "#124a47",
          900: "#113d3d",
        },
        saffron: {
          50: "#fff7ed",
          100: "#ffedd4",
          200: "#ffd6a8",
          300: "#ffb96f",
          400: "#ff9436",
          500: "#fd7414",
          600: "#ee5a0a",
          700: "#c5420b",
          800: "#9c3411",
          900: "#7d2d11",
        },
        slateblue: {
          50: "#f3f7fb",
          100: "#e3edf6",
          200: "#cbdfee",
          300: "#a8c8e0",
          400: "#7fa8cb",
          500: "#628cb7",
          600: "#4f729b",
          700: "#415c7d",
          800: "#394e68",
          900: "#324256",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
      },
      keyframes: {
        "page-enter": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.95)", opacity: "0.45" },
          "70%": { transform: "scale(1.08)", opacity: "0" },
          "100%": { transform: "scale(1.08)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.8s ease-out forwards",
        "pulse-ring": "pulse-ring 2.4s ease-out infinite",
        "page-enter": "page-enter 0.25s ease-out both",
        shimmer: "shimmer 1.4s ease-in-out infinite",
      },
      backgroundImage: {
        "civic-grid":
          "radial-gradient(circle at 1px 1px, rgba(17, 61, 61, 0.12) 1px, transparent 0)",
        "hero-wash":
          "linear-gradient(135deg, rgba(237,247,245,0.98) 0%, rgba(255,245,234,0.98) 50%, rgba(227,237,246,0.98) 100%)",
      },
      backgroundSize: {
        "grid-sm": "22px 22px",
      },
    },
  },
  plugins: [],
};

export default config;
