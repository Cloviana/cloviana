import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { after, before, test } from "node:test";
import { sandboxImage } from "../src/integrations/sandbox/sandbox-image";
import { PROJECT_ROOT } from "../src/integrations/sandbox/sandbox.constants";
import {
  REVERT_RESULT,
  REVERT_SCRIPT,
} from "../src/modules/themes/infrastructure/workspace/workspace-scripts";

// Runs the real script in the real sandbox image. Needs Docker and the built image:
//   RUN_SANDBOX_TESTS=1 node --import tsx --test tests/revert-script.test.ts
const run = !!process.env.RUN_SANDBOX_TESTS;
const name = `cloviana-revert-test-${process.pid}`;

const docker = (...args: string[]) =>
  execFileSync("docker", args, { encoding: "utf8" }).trim();
const shell = (script: string) =>
  docker("exec", "-w", PROJECT_ROOT, name, "sh", "-c", script);
const revert = (commit: string) =>
  docker("exec", name, "python3", "-c", REVERT_SCRIPT, commit)
    .split("\n")
    .at(-1);

/** Commits `version` and returns its SHA. */
const commit = (version: string) => {
  shell(
    `echo '${version}' > page.txt && git add -A && git commit -qm ${version}`,
  );
  return shell("git rev-parse HEAD");
};

let v1 = "";
let v2 = "";

before(() => {
  if (!run) {
    return;
  }
  docker("run", "-d", "--rm", "--name", name, sandboxImage().tag);
  shell(
    "git init -q && git config user.name a && git config user.email a@b && printf 'node_modules\\n.next\\n' > .gitignore && echo '{}' > package-lock.json",
  );
  v1 = commit("v1");
  v2 = commit("v2");
});

after(() => {
  if (run) {
    docker("stop", "-t", "1", name);
  }
});

test(
  "reverts, and removes what the agent could have planted",
  { skip: !run },
  () => {
    shell(`
    printf '#!/bin/sh\\ntouch /tmp/hook-ran\\n' > .git/hooks/post-checkout
    chmod +x .git/hooks/post-checkout
    git config filter.evil.smudge 'touch /tmp/filter-ran; cat'
    git config core.fsmonitor 'touch /tmp/fsmonitor-ran; false'
    echo 'page.txt filter=evil' > .git/info/attributes
    git replace ${v1} ${v2}
    echo stray > untracked.txt
    (sleep 300 &)
  `);

    assert.equal(revert(v1), REVERT_RESULT.ok);

    assert.equal(shell("cat page.txt"), "v1");
    assert.equal(shell("git rev-parse HEAD"), v1);
    assert.equal(shell("git status --porcelain"), "");
    assert.equal(shell("ls untracked.txt 2>/dev/null || echo gone"), "gone");
    assert.equal(
      shell("ls .git/refs/replace 2>/dev/null || echo gone"),
      "gone",
    );
    assert.equal(
      shell(
        "ls /tmp/hook-ran /tmp/filter-ran /tmp/fsmonitor-ran 2>/dev/null || echo clean",
      ),
      "clean",
    );
    assert.equal(shell("ls -d node_modules"), "node_modules");
    assert.equal(
      shell("pgrep -f '[s]leep 300' | wc -l"),
      "0",
      "processes started from the project must not survive",
    );
  },
);

test("refuses a commit the sandbox doesn't have", { skip: !run }, () => {
  assert.equal(revert("a".repeat(40)), REVERT_RESULT.missingCommit);
});

test("refuses when dependencies differ", { skip: !run }, () => {
  shell("echo '{\"changed\":true}' > package-lock.json");
  const changed = commit("v3");
  shell(`git reset -q --hard ${v1}`);
  assert.equal(revert(changed), REVERT_RESULT.dependenciesChanged);
  assert.equal(shell("git rev-parse HEAD"), v1, "must not touch the tree");
});
