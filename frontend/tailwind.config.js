/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans KR', 'sans-serif'],
      },
      colors: {
        'slate-850': '#172033',
        'slate-450': '#7f8fa4',
        'slate-550': '#5f708a',
        'slate-650': '#3b4a60',
        'indigo-650': '#493fdf',
        'indigo-450': '#6366f1',
        'rose-450': '#e23b5d',
        'rose-455': '#e11d48',
        'emerald-450': '#0ea070',
        'amber-405': '#e2a105',
        'amber-450': '#f59e0b',
      }
    },
  },
  plugins: [],
}
