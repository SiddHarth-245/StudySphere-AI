/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        space: {
          950: "#05060f",
          900: "#0a0c1b",
          800: "#0f1226",
          700: "#161a35",
        },
        orbit: {
          purple: "#8b5cf6",
          violet: "#7c3aed",
          blue: "#3b82f6",
          cyan: "#22d3ee",
        },
      },
      fontFamily: {
        display: ["'Sora'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(139, 92, 246, 0.55)",
        "glow-cyan": "0 0 40px -10px rgba(34, 211, 238, 0.5)",
        card: "0 10px 40px -12px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "orbit-gradient": "linear-gradient(135deg, #7c3aed 0%, #3b82f6 55%, #22d3ee 100%)",
        "orbit-radial": "radial-gradient(circle at 50% 0%, rgba(124,58,237,0.25), transparent 60%)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 10s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "spin-slow": "spin 12s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: 0.6, transform: "scale(1)" },
          "50%": { opacity: 1, transform: "scale(1.05)" },
        },
      },
    },
  },
  plugins: [],
}
