import localFont from 'next/font/local';

export const dmSans = localFont({
  src: '../../public/fonts/inter-display/InterDisplay-Regular.ttf',
  variable: '--font-dm-sans',
  preload: false,
});

export const interDisplay = localFont({
  src: [
    {
      path: '../../public/fonts/inter-display/InterDisplay-Thin.ttf',
      weight: '100',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter-display/InterDisplay-ExtraLight.ttf',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter-display/InterDisplay-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter-display/InterDisplay-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter-display/InterDisplay-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter-display/InterDisplay-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter-display/InterDisplay-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter-display/InterDisplay-ExtraBold.ttf',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter-display/InterDisplay-Black.ttf',
      weight: '900',
      style: 'normal',
    },

    {
      path: '../../public/fonts/inter-display/InterDisplay-ThinItalic.ttf',
      weight: '100',
      style: 'italic',
    },
    {
      path: '../../public/fonts/inter-display/InterDisplay-ExtraLightItalic.ttf',
      weight: '200',
      style: 'italic',
    },
    {
      path: '../../public/fonts/inter-display/InterDisplay-LightItalic.ttf',
      weight: '300',
      style: 'italic',
    },
    {
      path: '../../public/fonts/inter-display/InterDisplay-Italic.ttf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../public/fonts/inter-display/InterDisplay-MediumItalic.ttf',
      weight: '500',
      style: 'italic',
    },
    {
      path: '../../public/fonts/inter-display/InterDisplay-SemiBoldItalic.ttf',
      weight: '600',
      style: 'italic',
    },
    {
      path: '../../public/fonts/inter-display/InterDisplay-BoldItalic.ttf',
      weight: '700',
      style: 'italic',
    },
    {
      path: '../../public/fonts/inter-display/InterDisplay-ExtraBoldItalic.ttf',
      weight: '800',
      style: 'italic',
    },
    {
      path: '../../public/fonts/inter-display/InterDisplay-BlackItalic.ttf',
      weight: '900',
      style: 'italic',
    },
  ],
  variable: '--font-inter-display',
  preload: false,
});

export const inter = localFont({
  src: '../../public/fonts/inter-display/InterDisplay-Regular.ttf',
  variable: '--font-inter',
  preload: false,
});

export const geist = localFont({
  src: '../../public/fonts/inter-display/InterDisplay-Regular.ttf',
  variable: '--font-geist',
  preload: false,
});

// Landing-page typefaces (same files as web/) — used by the chat surface so
// it matches the marketing site.
export const gambarino = localFont({
  src: [
    {
      path: '../../public/fonts/gambarino/Gambarino-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-gambarino',
  preload: false,
});

export const switzer = localFont({
  src: [
    {
      path: '../../public/fonts/switzer/Switzer-Variable.ttf',
      weight: '100 900',
      style: 'normal',
    },
    {
      path: '../../public/fonts/switzer/Switzer-VariableItalic.ttf',
      weight: '100 900',
      style: 'italic',
    },
  ],
  variable: '--font-switzer',
  preload: false,
});
