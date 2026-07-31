import type { RabbitMqQueueDefinition } from "@/infrastructure/rabbitmq/rabbitmq.options";

export interface MonitoringRunPayload {
  jobId: string;
  businessId: string;
  promptIds: string[];
  runDateIso?: string;
}

export const MONITORING_RUN_EVENT = "monitoring.run";

export const MONITORING_QUEUE: RabbitMqQueueDefinition = {
  clientToken: "MONITORING_CLIENT",
  queue: "monitoring_queue",
  prefetchCount: 6,
  noAck: false,
  queueOptions: {
    durable: true,
    autoDelete: false,
  },
};
