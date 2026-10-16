import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F6F7FB",
        navy: "#0B1220",
        ink: "#0F1729",
        sub: "#5B6478",
        line: "#E7E9F0",
        primary: {
          DEFAULT: "#2F5CFF",
          light: "#EEF2FF",
        },
        success: {
          DEFAULT: "#16A34A",
          bg: "#EAFBF1",
        },
        danger: {
          DEFAULT: "#DC2626",
          bg: "#FDECEC",
        },
        warn: {
          DEFAULT: "#D97706",
          bg: "#FEF6E7",
        },
        ai: {
          DEFAULT: "#7C3AED",
          bg: "#F5F3FF",
        },
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        in: "fadeInUp 0.35s ease-out",
        "spin-slow": "spin 1s linear infinite",
        "pulse-dot": "pulseDot 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
