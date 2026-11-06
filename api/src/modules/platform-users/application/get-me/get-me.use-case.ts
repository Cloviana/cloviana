import { ResourceNotFoundError } from "@/shared/errors/application-error";
import { Inject, Injectable } from "@nestjs/common";

import {
  PLATFORM_USER_REPOSITORY,
  type PlatformUserRepository,
} from "@/modules/platform-users/application/ports/platform-user.repository.port";
import type { PlatformUser } from "@/modules/platform-users/domain/platform-user";

export interface GetMeInput {
  userId: string;
}

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(PLATFORM_USER_REPOSITORY)
    private readonly users: PlatformUserRepository,
  ) {}

  async execute(input: GetMeInput): Promise<PlatformUser> {
    const user = await this.users.findById(input.userId);

    // Better Auth creates the user at sign-up, so a miss means the session outlived the user.
    if (!user) {
      throw new ResourceNotFoundError("User not found");
    }

    return user;
  }
}
