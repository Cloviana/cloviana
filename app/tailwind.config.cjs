/** @type {import('tailwindcss').Config} */

function withOpacity(variableName) {
  return ({ opacityValue }) =>
    opacityValue !== undefined
      ? `hsla(var(${variableName}), ${opacityValue})`
      : `hsl(var(${variableName}))`;
}

module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter-display': ['var(--font-inter-display)', 'sans-serif'],
        'dm-sans': ['var(--font-dm-sans)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: withOpacity('--primary'),
          light: withOpacity('--primary-light'),
        },
        background: withOpacity('--background'),
        foreground: {
          DEFAULT: withOpacity('--foreground'),
          light: withOpacity('--foreground-light'),
          lighter: withOpacity('--foreground-lighter'),
        },
        border: withOpacity('--border'),
        surface: {
          400: withOpacity('--surface-400'),
          300: withOpacity('--surface-300'),
          200: withOpacity('--surface-200'),
          100: withOpacity('--surface-100'),
          75: withOpacity('--surface-75'),
        },
        muted: {
          DEFAULT: withOpacity('--muted'),
          foreground: withOpacity('--muted-foreground'),
        },
        sidebar: {
          background: withOpacity('--sidebar-background'),
          item: {
            hover: withOpacity('--sidebar-item-hover'),
            active: withOpacity('--sidebar-item-active'),
            border: withOpacity('--sidebar-item-border'),
            foreground: withOpacity('--sidebar-item-foreground'),
          },
        },
      },
      keyframes: {
        slideUpAndFade: {
          '0%': { opacity: '0', transform: 'translateY(3px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        slideUpAndFade: 'slideUpAndFade 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
