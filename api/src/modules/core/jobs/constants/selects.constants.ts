import { Prisma } from "@prisma/client";

export const JOB_SUMMARY_SELECT: Prisma.JobSelect = {
  id: true,
  type: true,
  storeId: true,
  status: true,
  priority: true,
  attempts: true,
  scheduledAt: true,
  startedAt: true,
  finishedAt: true,
  lastHeartbeatAt: true,
  error: true,
  createdAt: true,
  updatedAt: true,
};
