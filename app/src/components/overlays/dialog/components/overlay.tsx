import {
  DialogOverlayProps,
  Overlay as OverlayRX,
} from '@radix-ui/react-dialog';
import { cva, VariantProps } from 'class-variance-authority';
import { FC } from 'react';

import { cn } from '@/utils/cn';

const overlayVariants = cva('fixed inset-0', {
  variants: {
    blur: {
      true: 'backdrop-blur-xs',
    },
    backgroundColor: {
      light: 'bg-white/30',
      dark: 'bg-black/30',
    },
  },
  defaultVariants: {
    blur: true,
    backgroundColor: 'light',
  },
});

interface OverlayProps
  extends VariantProps<typeof overlayVariants>,
    DialogOverlayProps {}

export const Overlay: FC<OverlayProps> = ({
  backgroundColor,
  blur,
  className,
  ...props
}) => (
  <OverlayRX
    {...props}
    className={cn(overlayVariants({ backgroundColor, blur }), className)}
  />
);
