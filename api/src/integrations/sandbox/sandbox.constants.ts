export const PROJECT_ROOT = "/home/daytona/cloviana/project";
export const RUNTIME_ROOT = "/home/daytona/cloviana/runtime";
export const PREVIEW_PORT = 3000;

/** Quote one argument for a shell inside a sandbox; host commands use execFile. */
export const shellQuote = (value: string) =>
  `'${value.replace(/'/g, `'"'"'`)}'`;
