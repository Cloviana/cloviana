import assert from "node:assert/strict";
import test from "node:test";
import { AuditsService } from "./audits.service";

// The PDF endpoint is public and each render costs a ~250MB Chromium, so the
// concurrency cap and the load-shed guard are the only things standing between
// anonymous traffic and an OOM. Exercise them against a stubbed renderer.
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function makeService() {
  let active = 0;
  let peakActive = 0;
  const service = Object.create(AuditsService.prototype) as AuditsService;
  Object.defineProperty(service, "renderAuditPdf", {
    value: async () => {
      active += 1;
      peakActive = Math.max(peakActive, active);
      await sleep(40);
      active -= 1;
      return { pdf: Buffer.alloc(0), filename: "x.pdf" };
    },
  });
  return { service, peak: () => peakActive };
}

test("caps concurrent PDF renders at 2", async () => {
  const { service, peak } = makeService();

  await Promise.all(
    Array.from({ length: 6 }, () => service.generateAuditPdf("slug")),
  );

  assert.equal(peak(), 2, "more than 2 Chromiums would blow the mem_limit");
});

test("sheds load once the queue is full instead of queueing forever", async () => {
  const { service } = makeService();

  // 2 run immediately, the next 6 fill the queue; the 9th must be refused.
  const accepted = Array.from({ length: 8 }, () =>
    service.generateAuditPdf("slug"),
  );

  await assert.rejects(
    () => service.generateAuditPdf("slug"),
    /busy/i,
    "9th concurrent request should be rejected, not queued",
  );

  await Promise.all(accepted);

  // Once the queue drains, service resumes rather than staying wedged.
  await assert.doesNotReject(() => service.generateAuditPdf("slug"));
});
