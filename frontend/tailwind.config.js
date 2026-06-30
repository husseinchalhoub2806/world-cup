/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: {
          700: "#15803d",
          600: "#16a34a",
          500: "#22c55e",
          400: "#4ade80",
          300: "#86efac",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in":    "fadeIn 0.3s ease-in-out",
        "slide-up":   "slideUp 0.3s ease-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "bounce-in":  "bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(10px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(249,115,22,0.4)" },
          "50%":       { boxShadow: "0 0 24px rgba(249,115,22,0.9)" },
        },
        bounceIn: {
          "0%":   { transform: "scale(0.3)", opacity: "0" },
          "100%": { transform: "scale(1)",   opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
