import { ResourceNotFoundError } from "@/shared/errors/application-error";
import { Inject, Injectable } from "@nestjs/common";

import {
  PLATFORM_USER_REPOSITORY,
  type PlatformUserRepository,
} from "@/modules/platform-users/application/ports/platform-user.repository.port";

export interface MarkOnboardedInput {
  userId: string;
}

@Injectable()
export class MarkOnboardedUseCase {
  constructor(
    @Inject(PLATFORM_USER_REPOSITORY)
    private readonly users: PlatformUserRepository,
  ) {}

  async execute(input: MarkOnboardedInput): Promise<Date> {
    await this.users.markOnboarded(input.userId, new Date());

    const user = await this.users.findById(input.userId);
    if (!user?.onboardedAt) {
      throw new ResourceNotFoundError("User not found");
    }

    return user.onboardedAt;
  }
}
