/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FAF7FF',
          100: '#EFE9FA',
          200: '#DDD2F5',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6B2FA8',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        spark: {
          DEFAULT: '#F28C38',
          soft: '#FFEEDB',
          hover: '#E07B28',
        },
        navy: {
          900: '#130F28',
          800: '#1E1B4B',
          700: '#2A245C',
          600: '#3D3577',
        },
      },
      fontFamily: {
        display: ['Montserrat', 'Segoe UI', 'system-ui', 'sans-serif'],
        body: ['Montserrat', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
