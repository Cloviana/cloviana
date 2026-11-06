-- A run's mode decides whether it may change the theme it is scoped to.
CREATE TYPE "AgentRunMode" AS ENUM ('CHAT', 'PLAN', 'BUILD');

ALTER TABLE "agent_runs" ADD COLUMN "mode" "AgentRunMode" NOT NULL DEFAULT 'BUILD';
