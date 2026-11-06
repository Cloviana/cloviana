import { createHash } from "node:crypto";

export interface MemberInvite {
  id: string;
  marketplaceId: string;
  sellerId: string;
  roleId: string;
  email: string;
  isOwner: boolean;
  expiresAt: Date;
  acceptedAt: Date | null;
}

export type InviteProblem =
  | "already_accepted"
  | "expired"
  | "email_mismatch"
  | "email_unverified";

/**
 * An invite is a bearer secret sent to an email address, so accepting it also requires that the
 * signed-in user owns that address: same email, and a verified one.
 */
export function inviteProblem(
  invite: MemberInvite,
  user: { email: string; emailVerified: boolean },
  now: Date,
): InviteProblem | null {
  if (invite.acceptedAt) {
    return "already_accepted";
  }
  if (invite.expiresAt <= now) {
    return "expired";
  }
  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return "email_mismatch";
  }
  if (!user.emailVerified) {
    return "email_unverified";
  }
  return null;
}

/** Invite tokens are stored hashed; the plain token only ever exists in the invite email. */
export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
