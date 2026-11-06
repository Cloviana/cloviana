import {
  FILE_REPOSITORY,
  type FileRepository,
} from "@/modules/files/application/ports/file.repository.port";
import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";
import { InvalidInputError } from "@/shared/errors/application-error";
import { Inject, Injectable } from "@nestjs/common";
import type { ListFilesInput } from "../../domain/file";

@Injectable()
export class ListFilesUseCase {
  constructor(
    private readonly marketplace: GetMarketplaceUseCase,
    @Inject(FILE_REPOSITORY) private readonly files: FileRepository,
  ) {}
  async execute(
    ownerId: string,
    slug: string,
    params: Omit<ListFilesInput, "marketplaceId" | "sort" | "limit"> &
      Partial<Pick<ListFilesInput, "sort" | "limit">>,
  ) {
    const marketplace = await this.marketplace.execute({ ownerId, slug });
    if (
      params.minSize !== undefined &&
      params.maxSize !== undefined &&
      params.minSize > params.maxSize
    ) {
      throw new InvalidInputError("Minimum size must not exceed maximum size.");
    }
    return this.files.list({
      ...params,
      marketplaceId: marketplace.id,
      sort: params.sort ?? "newest",
      limit: params.limit ?? 30,
    });
  }
}
