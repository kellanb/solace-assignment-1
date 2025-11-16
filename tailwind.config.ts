import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        md: "2rem",
        lg: "3rem",
      },
    },
    extend: {
      // Brand palette + layout tokens used by the refreshed UI components.
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui"],
      },
      colors: {
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        slate: {
          950: "#020617",
        },
        accent: {
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
        },
        warning: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
        },
      },
      boxShadow: {
        "soft-card": "0 20px 50px -20px rgba(15, 23, 42, 0.25)",
        "focus-ring": "0 0 0 4px rgba(16, 185, 129, 0.25)",
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.75rem",
      },
      maxWidth: {
        "8xl": "96rem",
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(circle at top, rgba(16, 185, 129, 0.25), transparent 55%)",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.65))",
      },
    },
  },
  plugins: [],
};
export default config;
