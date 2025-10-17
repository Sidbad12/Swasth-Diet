/** @type {import('tailwindcss').Config} */
export default {
  // CRITICAL: Ensure 'content' array scans all React files in 'src'
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {
      // Custom colors for a cohesive Indian health app theme
      colors: {
        'indian-red': '#D35400',
        'indian-green': '#2ECC71',
        'health-blue': '#3498DB',
        'saffron-light': '#F9E79F',
      }
    },
  },
  plugins: [],
}
