export interface AttachmentRecord {
  id: string;
  objectStorageKey: string;
  name: string;
  mimeType: string;
  sizeBytes: bigint;
  uploadStatus: string;
  expiresAt: Date | null;
}

export abstract class AttachmentRepository {
  abstract get(
    marketplaceId: string,
    conversationId: string,
    id: string,
  ): Promise<AttachmentRecord | null>;
  abstract createPending(input: {
    id: string;
    marketplaceId: string;
    conversationId: string;
    ownerId: string;
    name: string;
    mimeType: string;
    size: number;
    storageKey: string;
    expiresAt: Date;
  }): Promise<void>;
  abstract markReady(
    marketplaceId: string,
    id: string,
    storageKey: string,
  ): Promise<boolean>;
  abstract listReady(
    marketplaceId: string,
    conversationId: string,
    ids: string[],
  ): Promise<AttachmentRecord[]>;
}
