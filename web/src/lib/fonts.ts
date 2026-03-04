import localFont from 'next/font/local';

export const gambarino = localFont({
  src: [
    {
      path: '../../public/fonts/gambarino/WEB/fonts/Gambarino-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-gambarino',
  preload: true,
});

export const calSans = localFont({
  src: [
    {
      path: '../../public/fonts/cal-sans/CalSans-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-cal-sans',
  preload: false,
});

export const satoshi = localFont({
  src: [
    {
      path: '../../public/fonts/satoshi/OTF/Satoshi-Light.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/satoshi/OTF/Satoshi-LightItalic.otf',
      weight: '300',
      style: 'italic',
    },
    {
      path: '../../public/fonts/satoshi/OTF/Satoshi-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/satoshi/OTF/Satoshi-Italic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../public/fonts/satoshi/OTF/Satoshi-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/satoshi/OTF/Satoshi-MediumItalic.otf',
      weight: '500',
      style: 'italic',
    },
    {
      path: '../../public/fonts/satoshi/OTF/Satoshi-Bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/satoshi/OTF/Satoshi-BoldItalic.otf',
      weight: '700',
      style: 'italic',
    },
    {
      path: '../../public/fonts/satoshi/OTF/Satoshi-Black.otf',
      weight: '900',
      style: 'normal',
    },
    {
      path: '../../public/fonts/satoshi/OTF/Satoshi-BlackItalic.otf',
      weight: '900',
      style: 'italic',
    },
  ],
  variable: '--font-satoshi',
  preload: false,
});

export const switzer = localFont({
  src: [
    {
      path: '../../public/fonts/switzer/TTF/Switzer-Variable.ttf',
      weight: '100 900',
      style: 'normal',
    },
    {
      path: '../../public/fonts/switzer/TTF/Switzer-VariableItalic.ttf',
      weight: '100 900',
      style: 'italic',
    },
  ],
  variable: '--font-switzer',
  preload: true,
});
