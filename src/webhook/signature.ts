import crypto from "node:crypto";

/**
 * Verifies the `X-Hub-Signature-256` header Meta sends on every webhook
 * POST, computed as HMAC-SHA256 of the raw request body using the app secret.
 * https://developers.facebook.com/docs/graph-api/webhooks/getting-started#validating-payloads
 */
export function isValidSignature(rawBody: Buffer, signatureHeader: string | undefined, appSecret: string): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expected = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const provided = signatureHeader.slice("sha256=".length);

  const expectedBuf = Buffer.from(expected, "hex");
  const providedBuf = Buffer.from(provided, "hex");

  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}
