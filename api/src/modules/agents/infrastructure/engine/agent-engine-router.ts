import { Injectable } from "@nestjs/common";
import { AgentEngine } from "../../application/ports/agent-engine.port";
import type { TranscriptPublisher } from "../../application/transcript/transcript-publisher";
import type { Run } from "../../domain/agent.types";
import { MarketplaceAgentEngine } from "./marketplace-agent-engine";
import { ThemeAgentEngine } from "./theme-agent-engine";

/** A run scoped to a theme goes to the coding agent; every other run goes to the assistant. */
@Injectable()
export class AgentEngineRouter extends AgentEngine {
  constructor(
    private readonly marketplace: MarketplaceAgentEngine,
    private readonly theme: ThemeAgentEngine,
  ) {
    super();
  }

  assertConfigured(coding: boolean) {
    (coding ? this.theme : this.marketplace).assertConfigured();
  }

  execute(
    run: Run,
    workerToken: string,
    signal: AbortSignal,
    transcript: TranscriptPublisher,
  ) {
    return (run.themeId ? this.theme : this.marketplace).execute(
      run,
      workerToken,
      signal,
      transcript,
    );
  }
}
