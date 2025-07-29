import { useEffect, useState } from 'react';

export function useScrollControls(ref: React.RefObject<HTMLElement>) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };

    update();
    el.addEventListener('scroll', update);
    window.addEventListener('resize', update);

    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [ref]);

  const scrollBy = (direction: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const gap = parseInt(getComputedStyle(el).columnGap) || 16;
    const width = first?.offsetWidth ?? 0;
    el.scrollBy({ left: direction * (width + gap), behavior: 'smooth' });
  };

  return { canScrollLeft, canScrollRight, scrollBy };
}
