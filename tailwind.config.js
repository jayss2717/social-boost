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
        'sb-primary': 'var(--sb-primary)',
        'sb-primary-dark': 'var(--sb-primary-dark)',
        'sb-success': 'var(--sb-success)',
        'sb-danger': 'var(--sb-danger)',
        'sb-gray-900': 'var(--sb-gray-900)',
        'sb-gray-700': 'var(--sb-gray-700)',
        'sb-gray-100': 'var(--sb-gray-100)',
      },
      fontFamily: {
        'display': ['Space Grotesk', 'Inter', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '0.75rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [],
}; 