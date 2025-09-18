/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        'editor': {
          'bg': '#1e1e1e',
          'text': '#d4d4d4',
          'selection': '#264f78',
          'line': '#2d2d30',
        }
      }
    },
  },
  plugins: [],
}
