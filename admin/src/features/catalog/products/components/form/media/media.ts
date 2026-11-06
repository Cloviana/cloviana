import type { ProductMediaValue } from '../../../schemas/product.schema';
import { MAX_PRODUCT_MEDIA } from '../../../schemas/product.schema';

export const MAX_MEDIA = MAX_PRODUCT_MEDIA;
export const ACCEPTED_MEDIA = 'image/*';

export type MediaItem = {
  id: string;
  source: ProductMediaValue;
  name: string;
  // Null when the preview failed to load; the placeholder is shown instead.
  url: string | null;
  // False while the preview is still loading.
  ready: boolean;
};

// Use the shared selected state for media checkboxes.
export const mediaCheckboxClassName =
  'data-checked:bg-background-selected-bold data-checked:border-border-selected data-checked:text-icon-inverse data-indeterminate:bg-background-selected-bold data-indeterminate:border-border-selected data-indeterminate:text-icon-inverse';
