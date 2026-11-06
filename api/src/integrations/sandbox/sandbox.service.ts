import { DaytonaService } from "@/integrations/daytona/daytona.service";
import { DockerService } from "@/integrations/docker/docker.service";
import { AppConfiguration } from "@/platform/config/app.configuration";
import { Injectable } from "@nestjs/common";
import type { RuntimeSandbox } from "./sandbox-runtime";
import { shellQuote } from "./sandbox.constants";

@Injectable()
export class SandboxService {
  constructor(
    private readonly config: AppConfiguration,
    private readonly daytona: DaytonaService,
    private readonly docker: DockerService,
  ) {}
  async create(name: string): Promise<RuntimeSandbox> {
    return this.config.sandboxProvider === "docker"
      ? this.docker.create(name)
      : this.daytona.create(name);
  }
  async get(id: string): Promise<RuntimeSandbox> {
    return id.startsWith("docker:")
      ? this.docker.get(id)
      : this.daytona.get(id);
  }
  async remove(id: string) {
    return id.startsWith("docker:")
      ? this.docker.remove(id)
      : this.daytona.remove(id);
  }
  async command(id: string, text: string, timeout = 120) {
    const result = await (await this.get(id)).process.executeCommand(
      text,
      undefined,
      undefined,
      timeout,
    );
    if (result.exitCode !== 0) {
      throw new Error(`Workspace command failed (exit ${result.exitCode})`);
    }
    return result.result;
  }
  python(id: string, script: string, ...args: string[]) {
    return this.command(
      id,
      `python3 -c ${shellQuote(script)} ${args.map(shellQuote).join(" ")}`,
    );
  }
}
