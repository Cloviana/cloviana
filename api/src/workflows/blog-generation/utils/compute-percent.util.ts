type Phase =
  | "initialize"
  | "strategy"
  | "outline"
  | "writing"
  | "assemble"
  | "save"
  | "done"
  | "failed";

const FIXED: Record<Phase, number> = {
  initialize: 5,
  strategy: 15,
  outline: 25,
  writing: 30,
  assemble: 95,
  save: 99,
  done: 100,
  failed: 100,
};

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(Math.floor(n), max));
}

export function computePercent(args: {
  phase: Phase;
  prevPercent?: number;
  totalSections?: number | null;
  completedSections?: number | null;
}) {
  const { phase, prevPercent = 0 } = args;

  if (phase !== "writing") {
    return Math.max(FIXED[phase], prevPercent);
  }

  const BASE = 30;
  const MAX = 90;

  const total = args.totalSections ?? 0;
  const done = args.completedSections ?? 0;

  if (total <= 0) return Math.max(BASE, prevPercent);

  const pct = BASE + (done / total) * (MAX - BASE);
  return clampInt(Math.max(pct, prevPercent), BASE, MAX);
}
