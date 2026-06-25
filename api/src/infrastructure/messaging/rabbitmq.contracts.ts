import { RmqOptions, Transport } from "@nestjs/microservices";

export interface RabbitMqQueueDefinition {
  readonly clientToken: string;
  readonly queue: string;
  readonly prefetchCount?: number;
  readonly noAck?: boolean;
  readonly queueOptions: {
    readonly durable: boolean;
    readonly autoDelete: boolean;
  };
}

export interface RunAuditPayload {
  auditId: string;
}

export interface RunBusinessInitializationPayload {
  businessId: string;
}

export interface CleanupStaleBusinessesPayload {
  cutoffIso: string;
}

export interface RunMonitoringPayload {
  jobId: string;
  businessId: string;
  promptIds: string[];
  runDateIso?: string;
}

export const RUN_AUDIT_EVENT = "audit.run";
export const RUN_BUSINESS_INITIALIZATION_EVENT = "business.initialization.run";
export const CLEANUP_STALE_BUSINESSES_EVENT = "businesses.cleanup-stale.run";
export const RUN_MONITORING_EVENT = "monitoring.run";

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

export const BUSINESSES_QUEUE: RabbitMqQueueDefinition = {
  clientToken: "BUSINESSES_CLIENT",
  queue: "businesses_queue",
  queueOptions: {
    durable: true,
    autoDelete: false,
  },
};

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

export function createRabbitMqOptions(
  rabbitmqUri: string,
  definition: RabbitMqQueueDefinition,
): RmqOptions {
  const options: RmqOptions["options"] = {
    urls: [rabbitmqUri],
    queue: definition.queue,
    queueOptions: definition.queueOptions,
    socketOptions: { heartbeatIntervalInSeconds: 60 },
  };

  if (definition.prefetchCount !== undefined) {
    options.prefetchCount = definition.prefetchCount;
  }

  if (definition.noAck !== undefined) {
    options.noAck = definition.noAck;
  }

  return {
    transport: Transport.RMQ,
    options,
  };
}

export function createRabbitMqClientOptions(
  rabbitmqUri: string,
  definition: RabbitMqQueueDefinition,
): RmqOptions {
  return {
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUri],
      queue: definition.queue,
      queueOptions: definition.queueOptions,
    },
  };
}
