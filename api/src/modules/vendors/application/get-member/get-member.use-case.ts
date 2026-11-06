import { Inject, Injectable } from "@nestjs/common";

import {
  MEMBER_REPOSITORY,
  type MemberRepository,
} from "@/modules/vendors/application/ports/member.repository.port";
import type { Member } from "@/modules/vendors/domain/member";

export interface GetMemberInput {
  marketplaceId: string;
  marketplaceUserId: string;
}

@Injectable()
export class GetMemberUseCase {
  constructor(
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepository,
  ) {}

  execute(input: GetMemberInput): Promise<Member | null> {
    return this.members.findByMarketplaceUser(
      input.marketplaceId,
      input.marketplaceUserId,
    );
  }
}
