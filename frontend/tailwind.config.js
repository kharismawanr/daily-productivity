/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#09090b",
          card: "#18181b",
          border: "#27272a",
          text: "#fafafa",
          muted: "#a1a1aa"
        }
      }
    },
  },
  plugins: [],
}
