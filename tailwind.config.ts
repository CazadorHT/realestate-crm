import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // ใช้ class="dark" บน <html> หรือ <body>
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./features/**/*.{ts,tsx,js,jsx}",
  ],
  safelist: [
    // Property type badge colors - ensure all dynamic colors are compiled
    "text-blue-700",
    "bg-blue-50",
    "text-purple-700",
    "bg-purple-50",
    "text-orange-700",
    "bg-orange-50",
    "text-sky-700",
    "bg-sky-50",
    "text-yellow-700",
    "bg-yellow-50",
    "text-green-700",
    "bg-green-50",
    "text-indigo-700",
    "bg-indigo-50",
    "text-slate-700",
    "bg-slate-50",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Legacy compatibility (remains for old bg-bg, bg-surface calls)
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "primary-soft": "rgb(var(--color-primary-soft) / <alpha-value>)",
        text: "rgb(var(--color-text) / <alpha-value>)",
        "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",

        // state colors
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#38BDF8",

        // gray scale ตรงๆ เผื่ออยากใช้
        slate: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          300: "#CBD5E1",
          600: "#475569",
          900: "#0F172A",
        },
        bluebrand: {
          900: "#0F2A44",
          700: "#1F4ED8",
          500: "#3B82F6",
          300: "#93C5FD",
          100: "#DBEAFE",
        },
        investor: {
          // สีทองสำหรับ Investor Theme
          900: "#3B2A1A",
          700: "#A26B2A",
          500: "#E0C097",
          300: "#F3DDB9",
          100: "#FFF7E7",
        },
      },

      backgroundImage: {
        // Landing page hero ปกติ (ฟ้า-กรม)
        "gradient-hero": "linear-gradient(135deg, #0F2A44, #1F4ED8)",

        // Section เบาๆ
        "gradient-soft": "linear-gradient(135deg, #DBEAFE, #F8FAFC)",

        // CTA ปุ่ม
        "gradient-cta": "linear-gradient(135deg, #1F4ED8, #3B82F6)",

        // BG CRM มืดๆ
        "gradient-crm": "linear-gradient(135deg, #020617, #0F172A)",

        // Investor Theme (ทอง)
        "gradient-investor-hero": "linear-gradient(135deg, #3B2A1A, #A26B2A)",
        "gradient-investor-soft": "linear-gradient(135deg, #FFF7E7, #F3DDB9)",
      },

      boxShadow: {
        card: "0 12px 40px rgba(15, 23, 42, 0.12)",
        soft: "0 4px 20px rgba(15, 23, 42, 0.06)",
      },

      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      fontFamily: {
        sans: ["var(--font-prompt)", "var(--font-noto-thai)", "sans-serif"],
        display: ["var(--font-prompt)", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap)))" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.4s ease-out",
        "accordion-up": "accordion-up 0.4s ease-out",
        marquee: "marquee 25s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;
