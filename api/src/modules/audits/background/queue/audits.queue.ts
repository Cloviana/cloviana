import type { RabbitMqQueueDefinition } from "@/infrastructure/rabbitmq/rabbitmq.options";

export interface RunAuditPayload {
  auditId: string;
}

export const RUN_AUDIT_EVENT = "audit.run";

export const AUDITS_QUEUE: RabbitMqQueueDefinition = {
  clientToken: "AUDITS_CLIENT",
  queue: "audits_queue",
  prefetchCount: 5,
  noAck: false,
  queueOptions: {
    durable: true,
    autoDelete: false,
  },
};
