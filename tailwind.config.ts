import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        // 方案 B：Plus Jakarta Sans（拉丁/数字）优先，中文回退 Noto Sans SC 思源黑体；其余系统兜底
        sans: [
          '"Plus Jakarta Sans"',
          '"Noto Sans SC"',
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          '"PingFang SC"',
          '"Microsoft YaHei"',
          "sans-serif",
        ],
      },
      colors: {
        border: {
          DEFAULT: "hsl(var(--border))",
          light: "hsl(var(--border-light))",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: {
          DEFAULT: "hsl(var(--background))",
          secondary: "hsl(var(--background-secondary))",
          tertiary: "hsl(var(--background-tertiary))",
        },
        foreground: {
          DEFAULT: "hsl(var(--foreground))",
          muted: "hsl(var(--foreground-muted))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          glow: "hsl(var(--primary-glow))",
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
          glow: "hsl(var(--accent-glow))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          hover: "hsl(var(--card-hover))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* Four-layer semantic colors */
        layer1: {
          DEFAULT: "hsl(var(--layer-1))",
          glow: "hsl(var(--layer-1-glow))",
          muted: "hsl(var(--layer-1-muted))",
          bg: "hsl(var(--layer-1-bg))",
        },
        layer2: {
          DEFAULT: "hsl(var(--layer-2))",
          glow: "hsl(var(--layer-2-glow))",
          muted: "hsl(var(--layer-2-muted))",
          bg: "hsl(var(--layer-2-bg))",
        },
        layer3: {
          DEFAULT: "hsl(var(--layer-3))",
          glow: "hsl(var(--layer-3-glow))",
          muted: "hsl(var(--layer-3-muted))",
          bg: "hsl(var(--layer-3-bg))",
        },
        layer4: {
          DEFAULT: "hsl(var(--layer-4))",
          glow: "hsl(var(--layer-4-glow))",
          muted: "hsl(var(--layer-4-muted))",
          bg: "hsl(var(--layer-4-bg))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
