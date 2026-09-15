import { eventType, staticSchema } from "inngest";
import type { MonitoringRunEventData } from "./monitoring.types";

export const monitoringRunRequested = eventType("monitoring/run.requested", {
  schema: staticSchema<MonitoringRunEventData>(),
});
