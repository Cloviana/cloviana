import type { Member } from "../../domain/member";
import type { MemberInvite } from "../../domain/member-invite";

export const MEMBER_REPOSITORY = Symbol("MEMBER_REPOSITORY");

export interface AcceptInviteRecord {
  marketplaceId: string;
  invite: MemberInvite;
  marketplaceUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  now: Date;
}

export interface MemberRepository {
  findByMarketplaceUser(
    marketplaceId: string,
    marketplaceUserId: string,
  ): Promise<Member | null>;
  findInviteByTokenHash(
    marketplaceId: string,
    tokenHash: string,
  ): Promise<MemberInvite | null>;
  /**
   * Claims the invite and links the login to its seller in one transaction.
   * Returns null when another request claimed the invite first.
   */
  acceptInvite(input: AcceptInviteRecord): Promise<Member | null>;
}
