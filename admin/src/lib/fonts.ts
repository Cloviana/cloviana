import localFont from 'next/font/local';

// App font. One variable file covers every weight (font-medium, font-semibold, ...).
export const inter = localFont({
  src: '../../public/fonts/inter/Inter-Variable.ttf',
  variable: '--font-inter-face',
  weight: '100 900',
  preload: false,
});
