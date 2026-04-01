/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FFF8EE",
        "bg-alt": "#F5E6D0",
        surface: "#FFFFFF",
        wood: "#D4A574",
        "wood-dark": "#B8865A",
        "wood-light": "#E8C9A0",
        "wood-board": "#D4A060",
        "wood-line": "#A67840",
        primary: "#E8834A",
        "primary-hover": "#D6722E",
        secondary: "#5B9BD5",
        "secondary-hover": "#4A88C0",
        danger: "#E05D5D",
        "danger-hover": "#CC4444",
        success: "#5DB87E",
        text: "#3D2B1F",
        "text-light": "#7A6555",
        "text-muted": "#A89585",
        border: "#E0D0C0",
        "piece-sente": "#F5E6D0",
        "piece-gote": "#4A4A4A",
        "piece-gote-bg": "#E0D0C0",
      },
      fontFamily: {
        wafuu: ["'M PLUS Rounded 1c'", "'Noto Sans JP'", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
      },
      boxShadow: {
        sm: "0 2px 8px rgba(60, 40, 20, 0.12)",
        md: "0 4px 16px rgba(60, 40, 20, 0.12)",
        lg: "0 8px 32px rgba(60, 40, 20, 0.2)",
      },
    },
  },
  plugins: [],
}
