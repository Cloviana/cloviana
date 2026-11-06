import { useEffect, useState } from 'react';

type Timing = { duration: number; easing: string };

export type SortMotion = {
  /** How tiles slide when the order changes. `null` turns it off. */
  transition: Timing | null;
  /** How the dragged tile settles into its slot. `null` turns it off. */
  dropAnimation: Timing | null;
};

// Used until the theme's tokens are read in the browser (the first render can happen on the server).
const fallback: SortMotion = {
  transition: { duration: 200, easing: 'ease' },
  dropAnimation: { duration: 250, easing: 'ease' },
};

function milliseconds(value: string) {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount)
    ? amount * (value.endsWith('ms') ? 1 : 1000)
    : 0;
}

/** The reorder and drop timings from the theme's motion tokens, off when the user prefers reduced motion. */
export function useSortMotion(): SortMotion {
  const [motion, setMotion] = useState(fallback);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setMotion({ transition: null, dropAnimation: null });
      return;
    }
    const theme = getComputedStyle(document.documentElement);
    const easing =
      theme.getPropertyValue('--ds-easing-out-practical').trim() || 'ease';
    setMotion({
      transition: {
        duration: milliseconds(theme.getPropertyValue('--ds-duration-medium')),
        easing,
      },
      dropAnimation: {
        duration: milliseconds(theme.getPropertyValue('--ds-duration-long')),
        easing,
      },
    });
  }, []);

  return motion;
}
