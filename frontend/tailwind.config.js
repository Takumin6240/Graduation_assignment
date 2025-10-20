/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      fontSize: {
        // 小学生向けにフォントサイズを大幅に拡大
        'xs': ['0.875rem', { lineHeight: '1.6' }],   // 14px
        'sm': ['1rem', { lineHeight: '1.6' }],       // 16px
        'base': ['1.125rem', { lineHeight: '1.75' }], // 18px
        'lg': ['1.25rem', { lineHeight: '1.75' }],   // 20px
        'xl': ['1.5rem', { lineHeight: '1.75' }],    // 24px
        '2xl': ['1.875rem', { lineHeight: '1.75' }], // 30px
        '3xl': ['2.25rem', { lineHeight: '1.5' }],   // 36px
        '4xl': ['3rem', { lineHeight: '1.5' }],      // 48px
        '5xl': ['3.75rem', { lineHeight: '1.4' }],   // 60px
        '6xl': ['4.5rem', { lineHeight: '1.3' }],    // 72px
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
      }
    },
  },
  plugins: [],
}
