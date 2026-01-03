import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
        sans: ['Inter', 'sans-serif'],
      },
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(217 91% 60% / 0.4)" },
          "50%": { boxShadow: "0 0 30px hsl(217 91% 60% / 0.6)" },
        },
        "story-progress": {
          from: { width: "0%" },
          to: { width: "100%" },
        },
        "ripple": {
          "0%": { transform: "scale(0)", opacity: "0.6" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%) rotate(15deg)" },
          "100%": { transform: "translateX(200%) rotate(15deg)" },
        },
        "bubble-rise": {
          "0%": { transform: "translateY(100%) scale(0.5)", opacity: "0" },
          "20%": { opacity: "0.8" },
          "80%": { opacity: "0.6" },
          "100%": { transform: "translateY(-20%) scale(1)", opacity: "0" },
        },
        "liquid-border": {
          "0%": { 
            backgroundPosition: "0% 50%, 100% 50%, 50% 0%, 50% 100%",
          },
          "50%": { 
            backgroundPosition: "100% 50%, 0% 50%, 50% 100%, 50% 0%",
          },
          "100%": { 
            backgroundPosition: "0% 50%, 100% 50%, 50% 0%, 50% 100%",
          },
        },
        "wave-flow": {
          "0%": { 
            transform: "translateX(-100%)",
          },
          "100%": { 
            transform: "translateX(100%)",
          },
        },
        "border-wave-1": {
          "0%, 100%": { 
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
            opacity: "0.6",
          },
          "25%": { 
            clipPath: "polygon(0 5%, 100% 0, 100% 95%, 0 100%)",
            opacity: "0.8",
          },
          "50%": { 
            clipPath: "polygon(0 0, 100% 5%, 100% 100%, 0 95%)",
            opacity: "1",
          },
          "75%": { 
            clipPath: "polygon(0 5%, 100% 0, 100% 95%, 0 100%)",
            opacity: "0.8",
          },
        },
        "glow-pulse": {
          "0%, 100%": { 
            opacity: "0.4",
            filter: "blur(8px)",
          },
          "50%": { 
            opacity: "0.8",
            filter: "blur(12px)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "story-progress": "story-progress 5s linear",
        "ripple": "ripple 0.6s ease-out forwards",
        "shimmer": "shimmer 3s ease-in-out infinite",
        "bubble-rise": "bubble-rise 4s ease-in-out infinite",
        "liquid-border": "liquid-border 4s ease-in-out infinite",
        "wave-flow": "wave-flow 2s linear infinite",
        "border-wave": "border-wave-1 3s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
