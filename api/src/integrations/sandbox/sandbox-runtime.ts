export interface RuntimeSandbox {
  id: string;
  state?: string;
  start(timeout?: number): Promise<void>;
  fs: {
    uploadFile(data: Buffer, path: string): Promise<void>;
    downloadFile(path: string): Promise<Buffer>;
    deleteFile(path: string): Promise<void>;
  };
  process: {
    executeCommand(
      command: string,
      cwd?: string,
      env?: Record<string, string>,
      timeout?: number,
    ): Promise<{ exitCode: number; result: string }>;
    createSession(id: string): Promise<unknown>;
    executeSessionCommand(
      id: string,
      input: { command: string; runAsync?: boolean },
    ): Promise<unknown>;
    deleteSession(id: string): Promise<unknown>;
  };
  getPreviewLink(port: number): Promise<{ url: string; token: string }>;
  getSignedPreviewUrl(port: number, seconds?: number): Promise<{ url: string }>;
}
