import type { Folder } from '@/types/api';

/**
 * What the folder create and update endpoints return. They select the row
 * without the `_count` aggregate that the list query carries.
 */
export type FolderMutationResult = Omit<Folder, '_count'>;
