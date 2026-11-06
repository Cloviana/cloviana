import { cn } from '@/lib/utils';

const FADE_MASK = '[mask-image:linear-gradient(to_top,black_60%,transparent)]';

// Strongest blur at the bottom edge, fading out upwards.
const BLUR_LAYERS = [
  'h-[18%] backdrop-blur-xs',
  'h-[15%] backdrop-blur-sm',
  'h-[12%] backdrop-blur-md',
  'h-[9%] backdrop-blur-xl',
];

const LAYER = 'pointer-events-none absolute inset-x-0 bottom-0';

// Fades the screenshot into a blurred, darkened footer so the text on top stays legible.
export function PreviewOverlay() {
  return (
    <>
      {BLUR_LAYERS.map((layer) => (
        <div key={layer} aria-hidden className={cn(LAYER, FADE_MASK, layer)} />
      ))}
      <div
        aria-hidden
        className={cn(
          LAYER,
          'from-background-neutral-bold/80 h-[36%] bg-linear-to-t to-transparent',
        )}
      />
    </>
  );
}
