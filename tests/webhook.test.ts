import crypto from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { resetDb } from "./helpers/db.js";

const APP_SECRET = "test-app-secret";
const app = createApp();

function sign(body: string) {
  return `sha256=${crypto.createHmac("sha256", APP_SECRET).update(body).digest("hex")}`;
}

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /webhook", () => {
  it("echoes the challenge when mode and token are correct", async () => {
    const res = await request(app)
      .get("/webhook")
      .query({ "hub.mode": "subscribe", "hub.verify_token": "test-verify-token", "hub.challenge": "12345" });

    expect(res.status).toBe(200);
    expect(res.text).toBe("12345");
  });

  it("rejects an incorrect verify token", async () => {
    const res = await request(app)
      .get("/webhook")
      .query({ "hub.mode": "subscribe", "hub.verify_token": "wrong", "hub.challenge": "12345" });

    expect(res.status).toBe(403);
  });
});

describe("POST /webhook", () => {
  it("rejects requests with a missing or invalid signature", async () => {
    const body = JSON.stringify({ object: "instagram", entry: [] });

    const res = await request(app).post("/webhook").set("Content-Type", "application/json").send(body);
    expect(res.status).toBe(401);
  });

  it("accepts a validly signed payload and logs a NO_MATCH event when no rule matches", async () => {
    const account = await prisma.instagramAccount.create({
      data: { igUserId: "ig-account-1", pageAccessToken: "token" },
    });
    void account;

    const payload = {
      object: "instagram",
      entry: [
        {
          id: "ig-account-1",
          changes: [
            {
              field: "comments",
              value: { id: "comment-webhook-1", text: "hello", media: { id: "media-1" }, from: { id: "u1", username: "bob" } },
            },
          ],
        },
      ],
    };
    const body = JSON.stringify(payload);

    const res = await request(app)
      .post("/webhook")
      .set("Content-Type", "application/json")
      .set("x-hub-signature-256", sign(body))
      .send(body);

    expect(res.status).toBe(200);

    // Processing happens after the response is flushed; poll briefly for the log row.
    let event = null;
    for (let i = 0; i < 20 && !event; i++) {
      event = await prisma.commentEvent.findUnique({ where: { commentId: "comment-webhook-1" } });
      if (!event) await new Promise((r) => setTimeout(r, 25));
    }

    expect(event?.dmStatus).toBe("NO_MATCH");
  });
});
