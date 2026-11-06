-- Theme creation is synchronous and agent runs are their own durable record, so no outbox for now.
DROP TABLE "outbox_events";
