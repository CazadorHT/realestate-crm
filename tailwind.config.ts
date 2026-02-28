const config = {
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

        // 60-30-10 Scales
        brand: {
          50: "hsl(var(--brand-50))",
          100: "hsl(var(--brand-100))",
          200: "hsl(var(--brand-200))",
          300: "hsl(var(--brand-300))",
          400: "hsl(var(--brand-400))",
          500: "hsl(var(--brand-500))",
          600: "hsl(var(--brand-600))",
          700: "hsl(var(--brand-700))",
          800: "hsl(var(--brand-800))",
          900: "hsl(var(--brand-900))",
          DEFAULT: "hsl(var(--brand-600))",
        },
        secondary: {
          50: "hsl(var(--secondary-50))",
          100: "hsl(var(--secondary-100))",
          200: "hsl(var(--secondary-200))",
          300: "hsl(var(--secondary-300))",
          400: "hsl(var(--secondary-400))",
          500: "hsl(var(--secondary-500))",
          600: "hsl(var(--secondary-600))",
          700: "hsl(var(--secondary-700))",
          800: "hsl(var(--secondary-800))",
          900: "hsl(var(--secondary-900))",
          DEFAULT: "hsl(var(--secondary-100))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        neutral: {
          50: "hsl(var(--neutral-50))",
          100: "hsl(var(--neutral-100))",
          200: "hsl(var(--neutral-200))",
          300: "hsl(var(--neutral-300))",
          400: "hsl(var(--neutral-400))",
          500: "hsl(var(--neutral-500))",
          600: "hsl(var(--neutral-600))",
          700: "hsl(var(--neutral-700))",
          800: "hsl(var(--neutral-800))",
          900: "hsl(var(--neutral-900))",
          DEFAULT: "hsl(var(--neutral-50))",
          foreground: "hsl(var(--neutral-700))",
        },

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
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

        // State Layer
        state: {
          hover: "var(--state-hover)",
          pressed: "var(--state-pressed)",
          selected: "hsl(var(--state-selected))",
        },

        // Legacy compatibility
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
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(50px, -100px) scale(1.15)",
          },
          "66%": {
            transform: "translate(-40px, 40px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
        "blob-reverse": {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(-50px, 80px) scale(1.1)",
          },
          "66%": {
            transform: "translate(40px, -30px) scale(0.95)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
        "blob-horizontal": {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(400px, 80px) scale(1.05)",
          },
          "66%": {
            transform: "translate(-800px, -80px) scale(1.1)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
        "blob-vertical": {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(15px, -90px) scale(1.12)",
          },
          "66%": {
            transform: "translate(-20px, 70px) scale(0.92)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.4s ease-out",
        "accordion-up": "accordion-up 0.4s ease-out",
        marquee: "marquee 50s linear infinite",
        blob: "blob 2s ease-in-out infinite",
        "blob-reverse": "blob-reverse 2.5s ease-in-out infinite",
        "blob-horizontal": "blob-horizontal 5s ease-in-out infinite",
        "blob-vertical": "blob-vertical 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;
