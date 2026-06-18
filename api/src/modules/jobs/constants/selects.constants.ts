import { Prisma } from "@prisma/client";

export const JOB_SUMMARY_SELECT = {
  id: true,
  type: true,
  status: true,
  error: true,
  attempts: true,
  createdAt: true,
  startedAt: true,
  finishedAt: true,
  lastHeartbeatAt: true,
  progress: true,
} satisfies Prisma.JobSelect;
