'use server';

import { listSellers } from '../api/list-sellers';
import type { SellerListParams } from '../types/seller';

export async function listSellersAction(
  slug: string,
  params: SellerListParams = {},
) {
  return listSellers(slug, params);
}
