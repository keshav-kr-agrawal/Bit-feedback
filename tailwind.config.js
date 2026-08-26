/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        institutional: {
          50: '#f0f5fa',
          100: '#e1ebf4',
          200: '#c3d7e8',
          300: '#94bad9',
          400: '#5e96c5',
          500: '#3b78af',
          600: '#2b5f92',
          700: '#1F4E79', // Muted institutional navy primary
          800: '#1c4166',
          900: '#1b3754',
          950: '#112338',
        },
        surface: {
          light: '#FFFFFF',
          background: '#F8F9FB',
          border: '#E2E8F0',
          slate: '#64748B',
        },
        success: {
          DEFAULT: '#2E7D32',
          light: '#E8F5E9',
        },
        warning: {
          DEFAULT: '#B7791F',
          light: '#FEF3C7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
