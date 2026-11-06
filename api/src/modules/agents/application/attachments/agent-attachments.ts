import { randomUUID } from "node:crypto";
import {
  InvalidInputError,
  ResourceNotFoundError,
  StateConflictError,
} from "@/shared/errors/application-error";
import { Injectable, Logger } from "@nestjs/common";
import type { Run } from "../../domain/agent.types";
import {
  MAX_REFERENCE_BYTES,
  REFERENCE_COMPLETION_WINDOW_MS,
  REFERENCE_UPLOAD_URL_TTL_SECONDS,
  isValidReference,
} from "../../domain/attachment.policy";
import { AttachmentRepository } from "../ports/attachment.repository.port";
import { ReferenceStorage } from "../ports/reference-storage.port";

@Injectable()
export class AgentAttachments {
  private readonly logger = new Logger(AgentAttachments.name);
  constructor(
    private readonly attachments: AttachmentRepository,
    private readonly storage: ReferenceStorage,
  ) {}

  async get(
    marketplaceId: string,
    conversationId: string,
    attachmentId: string,
  ) {
    const record = await this.attachments.get(
      marketplaceId,
      conversationId,
      attachmentId,
    );
    if (!record) {
      throw new ResourceNotFoundError("Attachment not found");
    }
    return {
      attachmentId,
      name: record.name,
      mimeType: record.mimeType,
      size: record.sizeBytes.toString(),
      status:
        record.uploadStatus === "PENDING" &&
        (!record.expiresAt || record.expiresAt < new Date())
          ? "EXPIRED"
          : record.uploadStatus,
      url:
        record.uploadStatus === "READY"
          ? await this.storage.downloadUrl(record.objectStorageKey)
          : null,
    };
  }

  async prepare(input: {
    marketplaceId: string;
    ownerId: string;
    conversationId: string;
    name: string;
    mimeType: string;
    size: number;
  }) {
    if (!isValidReference(input)) {
      throw new InvalidInputError("Invalid reference file");
    }
    const attachmentId = randomUUID();
    const storageKey = `agent-upload-pending/${input.marketplaceId}/${attachmentId}`;
    const uploadUrl = await this.storage.prepareUpload(
      storageKey,
      input.mimeType,
      input.size,
      REFERENCE_UPLOAD_URL_TTL_SECONDS,
    );
    await this.attachments.createPending({
      ...input,
      id: attachmentId,
      storageKey,
      expiresAt: new Date(Date.now() + REFERENCE_COMPLETION_WINDOW_MS),
    });
    return {
      attachmentId,
      uploadUrl,
      expiresIn: REFERENCE_UPLOAD_URL_TTL_SECONDS,
    };
  }

  async complete(
    marketplaceId: string,
    conversationId: string,
    attachmentId: string,
  ) {
    const record = await this.attachments.get(
      marketplaceId,
      conversationId,
      attachmentId,
    );
    if (!record) {
      throw new ResourceNotFoundError("Attachment not found");
    }
    if (record.uploadStatus === "READY") {
      return { attachmentId, status: "READY" };
    }
    if (!record.expiresAt || record.expiresAt < new Date()) {
      throw new InvalidInputError("Upload expired; prepare a new reference");
    }
    const data = await this.storage.read(
      record.objectStorageKey,
      MAX_REFERENCE_BYTES,
    );
    if (
      BigInt(data.length) !== record.sizeBytes ||
      data.length > MAX_REFERENCE_BYTES
    ) {
      throw new InvalidInputError("Reference size does not match");
    }
    if (record.mimeType.startsWith("image/")) {
      if ((await this.storage.detectImageMime(data)) !== record.mimeType) {
        throw new InvalidInputError("Reference type does not match");
      }
    } else {
      try {
        const text = new TextDecoder("utf-8", { fatal: true }).decode(data);
        if (text.includes("\0")) {
          throw new Error();
        }
      } catch {
        throw new InvalidInputError("Reference must contain UTF-8 text");
      }
    }
    // A distinct immutable key prevents a still-valid upload URL changing a ready reference.
    const key = `agent-attachments/${marketplaceId}/${attachmentId}/${randomUUID()}`;
    await this.storage.write(key, data, record.mimeType);
    const changed = await this.attachments.markReady(
      marketplaceId,
      attachmentId,
      key,
    );
    if (!changed) {
      await this.storage
        .remove(key)
        .catch(() =>
          this.logger.warn(
            `Could not remove an unused reference for attachment ${attachmentId}`,
          ),
        );
      const current = await this.attachments.get(
        marketplaceId,
        conversationId,
        attachmentId,
      );
      if (!current) {
        throw new ResourceNotFoundError("Attachment not found");
      }
      if (current.uploadStatus !== "READY") {
        throw new StateConflictError("Reference could not be completed");
      }
    }
    return { attachmentId, status: "READY" };
  }

  async references(run: Run) {
    const records = await this.attachments.listReady(
      run.marketplaceId,
      run.conversationId,
      run.attachmentIds,
    );
    if (records.length !== run.attachmentIds.length) {
      throw new InvalidInputError("A reference is no longer available");
    }
    records.sort(
      (a, b) =>
        run.attachmentIds.indexOf(a.id) - run.attachmentIds.indexOf(b.id),
    );
    return Promise.all(
      records.map(async (record) => ({
        name: record.name,
        mimeType: record.mimeType,
        data: await this.storage.read(
          record.objectStorageKey,
          MAX_REFERENCE_BYTES,
        ),
      })),
    );
  }
}
