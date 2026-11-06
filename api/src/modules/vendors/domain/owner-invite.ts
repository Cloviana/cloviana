import { randomBytes } from "node:crypto";

import { hashInviteToken } from "./member-invite";
import type { NewOwnerInvite } from "./seller";

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** The plain token only goes into the email; the database keeps its hash. */
export function issueOwnerInvite(
  email: string,
  now: Date,
): { token: string; invite: NewOwnerInvite } {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    invite: {
      email,
      tokenHash: hashInviteToken(token),
      expiresAt: new Date(now.getTime() + INVITE_TTL_MS),
    },
  };
}
