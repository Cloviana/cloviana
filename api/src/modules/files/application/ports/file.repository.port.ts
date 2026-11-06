import type { FilePage, ListFilesInput } from "../../domain/file";

export const FILE_REPOSITORY = Symbol("FILE_REPOSITORY");
export interface FileRepository {
  list(input: ListFilesInput): Promise<FilePage>;
}
