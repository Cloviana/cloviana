import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getEmailDomain, isWorkEmail } from "./work-email";

describe("work email validation", () => {
  it("accepts company domains", () => {
    assert.equal(isWorkEmail("sam@agency.example"), true);
  });

  it("rejects common consumer providers", () => {
    assert.equal(isWorkEmail("sam@gmail.com"), false);
    assert.equal(isWorkEmail("sam@outlook.com"), false);
    assert.equal(isWorkEmail("sam@proton.me"), false);
  });

  it("normalizes the domain", () => {
    assert.equal(getEmailDomain("  SAM@CLOVIANA.COM  "), "cloviana.com");
  });
});
