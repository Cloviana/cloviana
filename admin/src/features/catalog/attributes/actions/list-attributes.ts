'use server';

import { listAttributes } from '../api/list-attributes';
import type { AttributeListParams } from '../types';

export async function listAttributesAction(
  slug: string,
  params: AttributeListParams = {},
) {
  return listAttributes(slug, params);
}
