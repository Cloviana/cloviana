import type { PlatformUser } from "../../domain/platform-user";

export const PLATFORM_USER_REPOSITORY = Symbol("PLATFORM_USER_REPOSITORY");

export interface PlatformUserRepository {
  findById(id: string): Promise<PlatformUser | null>;
  /** Sets onboardedAt only if still null, so repeated calls keep the first timestamp. */
  markOnboarded(id: string, at: Date): Promise<void>;
}
