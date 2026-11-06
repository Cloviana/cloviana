import {
  AccessDeniedError,
  ResourceGoneError,
  ResourceNotFoundError,
  StateConflictError,
} from "@/shared/errors/application-error";
import { Inject, Injectable } from "@nestjs/common";

import {
  MEMBER_REPOSITORY,
  type MemberRepository,
} from "@/modules/vendors/application/ports/member.repository.port";
import type { Member } from "@/modules/vendors/domain/member";
import {
  hashInviteToken,
  inviteProblem,
} from "@/modules/vendors/domain/member-invite";

export interface AcceptInviteInput {
  marketplaceId: string;
  token: string;
  marketplaceUser: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
  };
}

@Injectable()
export class AcceptInviteUseCase {
  constructor(
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
  ) {}

  async execute(input: AcceptInviteInput): Promise<Member> {
    const invite = await this.members.findInviteByTokenHash(
      input.marketplaceId,
      hashInviteToken(input.token),
    );
    if (!invite) {
      throw new ResourceNotFoundError("Invite not found");
    }

    const now = new Date();
    const problem = inviteProblem(invite, input.marketplaceUser, now);
    if (problem === "expired") {
      throw new ResourceGoneError("Invite has expired");
    }
    if (problem === "already_accepted") {
      throw new StateConflictError("Invite was already used");
    }
    if (problem) {
      throw new AccessDeniedError(
        problem === "email_mismatch"
          ? "This invite was sent to a different email address"
          : "Verify your email address to accept this invite",
      );
    }

    const [firstName, ...rest] = input.marketplaceUser.name.trim().split(/\s+/);
    const member = await this.members.acceptInvite({
      marketplaceId: input.marketplaceId,
      invite,
      marketplaceUserId: input.marketplaceUser.id,
      email: input.marketplaceUser.email,
      firstName: firstName || null,
      lastName: rest.join(" ") || null,
      now,
    });
    if (!member) {
      throw new StateConflictError("Invite was already used");
    }
    return member;
  }
}
