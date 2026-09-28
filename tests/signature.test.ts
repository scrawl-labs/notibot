import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { isValidSignature } from "../src/webhook/signature.js";

const APP_SECRET = "test-app-secret";

function sign(body: Buffer, secret = APP_SECRET) {
  return `sha256=${crypto.createHmac("sha256", secret).update(body).digest("hex")}`;
}

describe("isValidSignature", () => {
  it("accepts a correctly signed body", () => {
    const body = Buffer.from(JSON.stringify({ hello: "world" }));
    expect(isValidSignature(body, sign(body), APP_SECRET)).toBe(true);
  });

  it("rejects a body signed with the wrong secret", () => {
    const body = Buffer.from(JSON.stringify({ hello: "world" }));
    expect(isValidSignature(body, sign(body, "other-secret"), APP_SECRET)).toBe(false);
  });

  it("rejects a tampered body", () => {
    const original = Buffer.from(JSON.stringify({ hello: "world" }));
    const tampered = Buffer.from(JSON.stringify({ hello: "mallory" }));
    expect(isValidSignature(tampered, sign(original), APP_SECRET)).toBe(false);
  });

  it("rejects a missing or malformed header", () => {
    const body = Buffer.from("{}");
    expect(isValidSignature(body, undefined, APP_SECRET)).toBe(false);
    expect(isValidSignature(body, "not-a-real-signature", APP_SECRET)).toBe(false);
  });
});
