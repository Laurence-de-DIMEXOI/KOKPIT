import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'cockpit': {
          'bg': '#F5F6F7',
          'dark': '#F0F1F3',
          'card': '#FFFFFF',
          'yellow': '#F4B400',
          'danger': '#FF3E1D',
          'success': '#71DD37',
          'info': '#03C3EC',
          'warning': '#FFAB00',
          'text-primary': '#32475C',
          'text-secondary': '#8592A3',
          'text-heading': '#1F2937',
          'input-bg': '#FFFFFF',
        },
      },
      backgroundColor: {
        'cockpit': '#F5F6F7',
        'cockpit-dark': '#F0F1F3',
        'cockpit-card': '#FFFFFF',
        'cockpit-input': '#FFFFFF',
      },
      textColor: {
        'cockpit-primary': '#32475C',
        'cockpit-secondary': '#8592A3',
        'cockpit-heading': '#1F2937',
      },
      borderColor: {
        'cockpit': '#E8EAED',
        'cockpit-input': '#D9DCE3',
      },
      fontFamily: {
        sans: [
          "'Plus Jakarta Sans'",
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans"',
          'sans-serif',
        ],
      },
      borderRadius: {
        'card': '0.75rem',
        'input': '0.5rem',
      },
      boxShadow: {
        'cockpit-sm': '0 2px 8px rgba(50, 71, 92, 0.08)',
        'cockpit-md': '0 6px 20px rgba(50, 71, 92, 0.14)',
        'cockpit-lg': '0 12px 32px rgba(50, 71, 92, 0.18)',
      },
      spacing: {
        'gap': '2rem',
        '8xl': '60rem',
        '9xl': '72rem',
      },
    },
  },
  plugins: [],
};

export default config;
