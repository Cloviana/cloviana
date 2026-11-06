import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import {
  OPENCODE_PORT,
  OPENCODE_VERSION,
} from "@/integrations/opencode/opencode.constants";
import type { RuntimeSandbox } from "@/integrations/sandbox/sandbox-runtime";
import {
  PREVIEW_PORT,
  SANDBOX_NODE_IMAGE,
  shellQuote,
} from "@/integrations/sandbox/sandbox.constants";
import { AppConfiguration } from "@/platform/config/app.configuration";
import { DependencyUnavailableError } from "@/shared/errors/application-error";
import { Injectable } from "@nestjs/common";

const execute = promisify(execFile);
const IMAGE = `cloviana-sandbox:opencode-${OPENCODE_VERSION}`;
const isMissingDockerResource = (error: unknown) => {
  if (typeof error !== "object" || error === null || !("stderr" in error)) {
    return false;
  }
  return (
    typeof error.stderr === "string" &&
    /no such (object|container|image)/i.test(error.stderr)
  );
};

@Injectable()
export class DockerService {
  private building?: Promise<void>;
  constructor(private readonly config: AppConfiguration) {}
  private assertDevelopment() {
    if (this.config.environment !== "development") {
      throw new DependencyUnavailableError(
        "Local Docker sandboxes are available only in development",
      );
    }
  }
  private async run(args: string[], timeout = 30000) {
    return execute("docker", args, { timeout, maxBuffer: 110 * 1024 * 1024 });
  }
  private async ensureImage() {
    try {
      await this.run(["image", "inspect", IMAGE]);
      return;
    } catch (error) {
      if (!isMissingDockerResource(error)) {
        throw new DependencyUnavailableError(
          "Could not inspect the local sandbox image",
        );
      }
    }
    this.building ??= new Promise<void>((resolve, reject) => {
      const child = spawn("docker", ["build", "-t", IMAGE, "-"], {
        stdio: ["pipe", "ignore", "ignore"],
      });
      const timeout = setTimeout(() => child.kill(), 600_000);
      timeout.unref();
      child.once("error", () => {
        clearTimeout(timeout);
        reject(new DependencyUnavailableError("Docker is not available"));
      });
      child.once("exit", (code) => {
        clearTimeout(timeout);
        code === 0
          ? resolve()
          : reject(
              new DependencyUnavailableError(
                "Could not prepare the local sandbox image",
              ),
            );
      });
      child.stdin.on("error", () => undefined);
      child.stdin.end(
        `FROM ${SANDBOX_NODE_IMAGE}\nRUN apt-get update && apt-get install -y --no-install-recommends git python3 curl && rm -rf /var/lib/apt/lists/*\nRUN npm install -g opencode-ai@${OPENCODE_VERSION}\nRUN mkdir -p /home/daytona/cloviana && chown -R node:node /home/daytona\nUSER node\nWORKDIR /home/daytona/cloviana\nCMD ["sleep", "infinity"]\n`,
      );
    }).catch((error) => {
      this.building = undefined;
      throw error;
    });
    return this.building;
  }

  async create(name: string): Promise<RuntimeSandbox> {
    this.assertDevelopment();
    if (!/^cloviana-[a-z0-9-]+$/.test(name)) {
      throw new Error("Invalid sandbox name");
    }
    try {
      return await this.get(name);
    } catch (error) {
      if (!isMissingDockerResource(error)) {
        throw error;
      }
    }
    await this.ensureImage();
    // No bind mounts, Docker socket, platform environment, privileges, or host networking.
    const { stdout } = await this.run([
      "run",
      "-d",
      "--name",
      name,
      "--label",
      "application=cloviana",
      "--memory",
      "4g",
      "--cpus",
      "2",
      "--pids-limit",
      "512",
      "--cap-drop",
      "ALL",
      "--security-opt",
      "no-new-privileges",
      ...(process.platform === "linux"
        ? ["--add-host", "host.docker.internal:host-gateway"]
        : []),
      "-p",
      `127.0.0.1::${PREVIEW_PORT}`,
      "-p",
      `127.0.0.1::${OPENCODE_PORT}`,
      IMAGE,
    ]);
    return this.get(`docker:${stdout.trim()}`);
  }

  async get(reference: string): Promise<RuntimeSandbox> {
    this.assertDevelopment();
    const id = reference.replace(/^docker:/, "");
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      throw new Error("Invalid container reference");
    }
    const { stdout } = await this.run([
      "inspect",
      "--format",
      "{{json .}}",
      id,
    ]);
    const metadata = JSON.parse(stdout) as {
      Id: string;
      State: { Running: boolean };
      Config: { Labels?: Record<string, string> };
    };
    if (metadata.Config.Labels?.application !== "cloviana") {
      throw new Error("Container is not a Cloviana sandbox");
    }
    const containerId = metadata.Id;
    const command = async (
      text: string,
      cwd?: string,
      env?: Record<string, string>,
      timeout = 120,
    ) => {
      const args = [
        "exec",
        ...(cwd ? ["-w", cwd] : []),
        ...Object.entries(env ?? {}).flatMap(([key, value]) => [
          "-e",
          `${key}=${value}`,
        ]),
        containerId,
        "timeout",
        `${timeout}s`,
        "sh",
        "-lc",
        text,
      ];
      try {
        const { stdout } = await this.run(args, timeout * 1000 + 5000);
        return { exitCode: 0, result: stdout };
      } catch (error) {
        const failure = error as {
          code?: number | string;
          stdout?: string;
          stderr?: string;
        };
        return {
          exitCode: typeof failure.code === "number" ? failure.code : 1,
          result: (failure.stdout ?? "") + (failure.stderr ?? ""),
        };
      }
    };
    const preview = async (port: number) => {
      if (![PREVIEW_PORT, OPENCODE_PORT].includes(port)) {
        throw new Error("Port is not exposed");
      }
      const { stdout } = await this.run(["port", containerId, `${port}/tcp`]);
      const match = /^127\.0\.0\.1:(\d+)$/m.exec(stdout.trim());
      if (!match) {
        throw new Error("Local preview port is missing");
      }
      return { url: `http://127.0.0.1:${match[1]}`, token: "" };
    };
    return {
      id: `docker:${containerId}`,
      state: metadata.State.Running ? "started" : "stopped",
      start: async () => {
        if (!metadata.State.Running) {
          await this.run(["start", containerId]);
        }
      },
      fs: {
        uploadFile: async (data, path) => {
          await new Promise<void>((resolve, reject) => {
            const child = spawn(
              "docker",
              [
                "exec",
                "-i",
                containerId,
                "sh",
                "-lc",
                `umask 077; cat > ${shellQuote(path)}`,
              ],
              { stdio: ["pipe", "ignore", "ignore"] },
            );
            const timeout = setTimeout(() => child.kill(), 30000);
            child.once("error", () => {
              clearTimeout(timeout);
              reject(new Error("Sandbox upload failed"));
            });
            child.once("exit", (code) => {
              clearTimeout(timeout);
              code === 0
                ? resolve()
                : reject(new Error("Sandbox upload failed"));
            });
            child.stdin.on("error", () => undefined);
            child.stdin.end(data);
          });
        },
        downloadFile: async (path) => {
          const { stdout } = await execute(
            "docker",
            ["exec", containerId, "cat", "--", path],
            {
              encoding: "buffer",
              maxBuffer: 110 * 1024 * 1024,
              timeout: 30000,
            },
          );
          return stdout;
        },
        deleteFile: async (path) => {
          await this.run(["exec", containerId, "rm", "-f", "--", path]);
        },
      },
      process: {
        executeCommand: command,
        createSession: async (session) => {
          if (!/^[a-zA-Z0-9_-]+$/.test(session)) {
            throw new Error("Invalid session");
          }
        },
        executeSessionCommand: async (session, input) => {
          if (!/^[a-zA-Z0-9_-]+$/.test(session)) {
            throw new Error("Invalid session");
          }
          if (!input.runAsync) {
            return command(input.command);
          }
          const script =
            "import subprocess,os; f=open('/tmp/'+os.environ['SESSION']+'.log','ab'); p=subprocess.Popen(os.environ['COMMAND'],shell=True,start_new_session=True,stdout=f,stderr=f,stdin=subprocess.DEVNULL); open('/tmp/'+os.environ['SESSION']+'.pid','w').write(str(p.pid))";
          const result = await command(
            `python3 -c ${shellQuote(script)}`,
            undefined,
            { SESSION: session, COMMAND: input.command },
          );
          if (result.exitCode) {
            throw new Error("Could not start sandbox session");
          }
        },
        deleteSession: async (session) => {
          if (!/^[a-zA-Z0-9_-]+$/.test(session)) {
            throw new Error("Invalid session");
          }
          const script = `import os,signal,pathlib
p=pathlib.Path('/tmp/'+os.environ['SESSION']+'.pid')
if p.exists():
  try: os.killpg(int(p.read_text()),signal.SIGTERM)
  except ProcessLookupError: pass
  p.unlink(missing_ok=True)`;
          const result = await command(
            `python3 -c ${shellQuote(script)}`,
            undefined,
            { SESSION: session },
          );
          if (result.exitCode) {
            throw new Error("Could not stop sandbox session");
          }
        },
      },
      getPreviewLink: preview,
      getSignedPreviewUrl: preview,
    };
  }

  async remove(id: string) {
    try {
      const sandbox = await this.get(id);
      await this.run(["rm", "-fv", sandbox.id.slice(7)]);
    } catch (error) {
      // Treat only an already-removed container as success.
      if (!isMissingDockerResource(error)) {
        throw error;
      }
    }
  }
}
