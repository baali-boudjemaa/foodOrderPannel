import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E85D3D',
          dark: '#C7431F',
        },
      },
    },
  },
  plugins: [],
};

export default config;
