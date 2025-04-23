/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3ECF8E",
          dark: "#24B47E",
          light: "#6EE7B7",
        },
        secondary: {
          DEFAULT: "#1F1F1F",
          light: "#2E2E2E",
        },
        background: {
          light: "#FFFFFF",
          dark: "#1C1C1C",
        },
        text: {
          light: "#1F1F1F",
          dark: "#FFFFFF",
          muted: {
            light: "#6B7280",
            dark: "#9CA3AF",
          },
        },
      },
    },
  },
  plugins: [],
};
