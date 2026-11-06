import { createHash, randomBytes } from "node:crypto";

export const createModelToken = () => randomBytes(32).toString("hex");
export const hashModelToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
