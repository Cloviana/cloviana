import type { MessageEvent } from "@nestjs/common";
import { Observable } from "rxjs";
import {
  EVENT_PAGE_SIZE,
  isTerminalRunStatus,
} from "../../domain/agent.policy";
import type { Run, RunEvent } from "../../domain/agent.types";

interface RunEventSource {
  readRun(): Promise<Pick<Run, "status">>;
  readEvents(after: bigint): Promise<RunEvent[]>;
}

export function createRunEventStream(
  source: RunEventSource,
  after: bigint,
): Observable<MessageEvent> {
  return new Observable((subscriber) => {
    let cursor = after;
    let stopped = false;
    let timer: NodeJS.Timeout | undefined;

    const poll = async () => {
      try {
        // Reading status first ensures a terminal status cannot hide events committed
        // between the event query and the decision to close the stream.
        const run = await source.readRun();
        if (stopped) {
          return;
        }
        const events = await source.readEvents(cursor);
        if (stopped) {
          return;
        }
        for (const event of events) {
          cursor = BigInt(event.sequence);
          subscriber.next({
            id: event.sequence,
            type: event.type,
            data: JSON.stringify(event.payload),
          });
        }
        if (
          events.length < EVENT_PAGE_SIZE &&
          isTerminalRunStatus(run.status)
        ) {
          subscriber.complete();
          return;
        }
        if (!events.length) {
          subscriber.next({ type: "heartbeat", data: { status: run.status } });
        }
        if (!stopped) {
          timer = setTimeout(
            () => void poll(),
            events.length === EVENT_PAGE_SIZE ? 0 : 1000,
          );
        }
      } catch {
        if (!stopped) {
          subscriber.next({
            type: "stream.error",
            data: { code: "STREAM_INTERRUPTED" },
          });
          subscriber.complete();
        }
      }
    };

    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  });
}
