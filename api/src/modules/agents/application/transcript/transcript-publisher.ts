import type { Json } from "../../domain/agent.types";
import {
  PART_DELTA_EVENT,
  PART_UPSERT_EVENT,
  type TranscriptPart,
} from "../../domain/transcript";
import { TranscriptBuilder } from "../../domain/transcript-builder";

export type EventSink = (type: string, payload: Json) => Promise<void>;

const DEFAULT_DELTA_WINDOW_MS = 80;

/** A part's fields other than its streamed text, so a text-only change can go out as a delta. */
function withoutText(part: TranscriptPart) {
  if (part.type !== "text" && part.type !== "reasoning") {
    return JSON.stringify(part);
  }
  const { text: _text, ...rest } = part;
  return JSON.stringify(rest);
}

/**
 * Turns the agent's output into run events. It keeps the run's transcript, sends each change as
 * the smallest event that expresses it, batches streamed text so a token stream doesn't become a
 * database write per token, and keeps events in the order they happened.
 */
export class TranscriptPublisher {
  private readonly builder = new TranscriptBuilder();
  private readonly buffered = new Map<string, string>();
  private chain: Promise<void> = Promise.resolve();
  private failure: unknown;
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly emit: EventSink,
    private readonly windowMs = DEFAULT_DELTA_WINDOW_MS,
  ) {}

  /** Reports a part's complete current state. Unchanged parts publish nothing. */
  snapshot(part: TranscriptPart) {
    const known = this.builder.get(part.id);
    if (
      known &&
      (known.type === "text" || known.type === "reasoning") &&
      part.type === known.type &&
      withoutText(known) === withoutText(part) &&
      part.text.startsWith(known.text)
    ) {
      this.append(part.id, part.text.slice(known.text.length));
      return;
    }
    if (known && JSON.stringify(known) === JSON.stringify(part)) {
      return;
    }
    this.drain();
    const stored = this.builder.upsert(part);
    this.send(PART_UPSERT_EVENT, { part: stored });
  }

  /** Adds streamed text to a text or reasoning part that already exists. */
  append(id: string, text: string) {
    const added = this.builder.append(id, text);
    if (!added) {
      return;
    }
    this.buffered.set(id, (this.buffered.get(id) ?? "") + added);
    this.timer ??= setTimeout(() => {
      this.timer = undefined;
      this.drain();
    }, this.windowMs);
    this.timer.unref();
  }

  /** Sends another kind of run event in order with the transcript's. */
  event(type: string, payload: Json) {
    this.drain();
    this.send(type, payload);
  }

  /** Sends anything buffered and waits for every event to be stored. Throws if one failed. */
  async flush() {
    this.drain();
    await this.chain;
    if (this.failure !== undefined) {
      throw this.failure;
    }
  }

  parts() {
    return this.builder.parts();
  }

  text() {
    return this.builder.text();
  }

  private drain() {
    clearTimeout(this.timer);
    this.timer = undefined;
    for (const [id, text] of this.buffered) {
      this.send(PART_DELTA_EVENT, { id, text });
    }
    this.buffered.clear();
  }

  private send(type: string, payload: unknown) {
    this.chain = this.chain.then(async () => {
      if (this.failure !== undefined) {
        return;
      }
      try {
        // The payload types are plain data; they only lack the index signature Json asks for.
        await this.emit(type, payload as Json);
      } catch (error) {
        this.failure = error;
      }
    });
  }
}
