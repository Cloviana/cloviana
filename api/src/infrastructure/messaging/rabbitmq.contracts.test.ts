import assert from "node:assert/strict";
import test from "node:test";
import { AUDITS_QUEUE, createRabbitMqOptions } from "./rabbitmq.contracts";

test("createRabbitMqOptions builds RMQ config from shared queue definitions", () => {
  const options = createRabbitMqOptions("amqp://localhost:5672", AUDITS_QUEUE);

  assert.equal(options.transport, 5);
  assert.deepEqual(options.options, {
    urls: ["amqp://localhost:5672"],
    queue: AUDITS_QUEUE.queue,
    queueOptions: AUDITS_QUEUE.queueOptions,
  });
});
