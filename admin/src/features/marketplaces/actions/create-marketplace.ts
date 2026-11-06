'use server';

import { revalidatePath } from 'next/cache';

import { createMarketplace } from '../api/create-marketplace';
import { createMarketplaceSchema } from '../schemas/create-marketplace.schema';

export type CreateMarketplaceResult =
  | { success: true; marketplaceId: string }
  | { success: false; message: string };

export async function createMarketplaceAction(
  input: unknown,
): Promise<CreateMarketplaceResult> {
  const parsed = createMarketplaceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid marketplace name.',
    };
  }

  try {
    const marketplace = await createMarketplace(parsed.data);
    revalidatePath('/', 'layout');
    return { success: true, marketplaceId: marketplace.id };
  } catch {
    return { success: false, message: 'Could not create the marketplace.' };
  }
}
