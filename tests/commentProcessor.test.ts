import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { processComment } from "../src/services/commentProcessor.js";
import { InstagramApiError } from "../src/services/instagramClient.js";
import { resetDb } from "./helpers/db.js";

async function seedAccount() {
  return prisma.instagramAccount.create({
    data: { igUserId: "ig-account-1", username: "shop", pageAccessToken: "token-123" },
  });
}

async function seedTemplate(body = "안녕하세요 {{username}}님! 링크는 https://link.coupang.com/abc 입니다") {
  return prisma.dmTemplate.create({ data: { name: "default", body } });
}

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("processComment", () => {
  it("sends a DM and logs SENT when a rule matches", async () => {
    const account = await seedAccount();
    const template = await seedTemplate();
    await prisma.triggerRule.create({
      data: { accountId: account.id, mediaId: "media-1", keyword: "오이", dmTemplateId: template.id },
    });

    const sendDm = vi.fn().mockResolvedValue({ messageId: "msg-1" });

    const result = await processComment(
      prisma,
      { igUserId: "ig-account-1", mediaId: "media-1", commentId: "comment-1", text: "오이 주세요", fromUserId: "u1", fromUsername: "alice" },
      { sendDm },
    );

    expect(result.status).toBe("SENT");
    expect(sendDm).toHaveBeenCalledWith({
      commentId: "comment-1",
      message: { type: "TEXT", text: "안녕하세요 alice님! 링크는 https://link.coupang.com/abc 입니다" },
      accessToken: "token-123",
    });

    const event = await prisma.commentEvent.findUnique({ where: { commentId: "comment-1" } });
    expect(event?.dmStatus).toBe("SENT");
    expect(event?.matchedRuleId).not.toBeNull();
  });

  it("sends an IMAGE message built from the template's imageUrl", async () => {
    const account = await seedAccount();
    const template = await prisma.dmTemplate.create({
      data: { name: "img", messageType: "IMAGE", imageUrl: "https://example.com/apple.jpg" },
    });
    await prisma.triggerRule.create({
      data: { accountId: account.id, mediaId: "media-1", keyword: "오이", dmTemplateId: template.id },
    });

    const sendDm = vi.fn().mockResolvedValue({ messageId: "msg-1" });

    const result = await processComment(
      prisma,
      { igUserId: "ig-account-1", mediaId: "media-1", commentId: "comment-img", text: "오이 주세요" },
      { sendDm },
    );

    expect(result.status).toBe("SENT");
    expect(sendDm).toHaveBeenCalledWith({
      commentId: "comment-img",
      message: { type: "IMAGE", imageUrl: "https://example.com/apple.jpg" },
      accessToken: "token-123",
    });
  });

  it("sends a GENERIC message with title, image and button built from the template", async () => {
    const account = await seedAccount();
    const template = await prisma.dmTemplate.create({
      data: {
        name: "generic",
        messageType: "GENERIC",
        body: "Hi {{username}}, check this out",
        imageUrl: "https://example.com/apple.jpg",
        buttonUrl: "https://link.coupang.com/a/xyz",
        buttonLabel: "Buy Now",
      },
    });
    await prisma.triggerRule.create({
      data: { accountId: account.id, mediaId: "media-1", keyword: "오이", dmTemplateId: template.id },
    });

    const sendDm = vi.fn().mockResolvedValue({ messageId: "msg-1" });

    const result = await processComment(
      prisma,
      { igUserId: "ig-account-1", mediaId: "media-1", commentId: "comment-generic", text: "오이 주세요", fromUsername: "alice" },
      { sendDm },
    );

    expect(result.status).toBe("SENT");
    expect(sendDm).toHaveBeenCalledWith({
      commentId: "comment-generic",
      message: {
        type: "GENERIC",
        title: "Hi alice, check this out",
        imageUrl: "https://example.com/apple.jpg",
        buttonUrl: "https://link.coupang.com/a/xyz",
        buttonLabel: "Buy Now",
      },
      accessToken: "token-123",
    });
  });

  it("logs NO_MATCH and skips sending when no rule matches", async () => {
    const account = await seedAccount();
    const template = await seedTemplate();
    await prisma.triggerRule.create({
      data: { accountId: account.id, mediaId: "media-1", keyword: "오이", dmTemplateId: template.id },
    });

    const sendDm = vi.fn();

    const result = await processComment(
      prisma,
      { igUserId: "ig-account-1", mediaId: "media-1", commentId: "comment-2", text: "수박 주세요", fromUserId: "u2" },
      { sendDm },
    );

    expect(result.status).toBe("NO_MATCH");
    expect(sendDm).not.toHaveBeenCalled();

    const event = await prisma.commentEvent.findUnique({ where: { commentId: "comment-2" } });
    expect(event?.dmStatus).toBe("NO_MATCH");
  });

  it("logs FAILED with the error message when the DM send throws", async () => {
    const account = await seedAccount();
    const template = await seedTemplate();
    await prisma.triggerRule.create({
      data: { accountId: account.id, mediaId: "media-1", keyword: "오이", dmTemplateId: template.id },
    });

    const sendDm = vi.fn().mockRejectedValue(new InstagramApiError("rate limited", 429, {}));

    const result = await processComment(
      prisma,
      { igUserId: "ig-account-1", mediaId: "media-1", commentId: "comment-3", text: "오이 주세요" },
      { sendDm },
    );

    expect(result.status).toBe("FAILED");
    const event = await prisma.commentEvent.findUnique({ where: { commentId: "comment-3" } });
    expect(event?.dmStatus).toBe("FAILED");
    expect(event?.errorMessage).toBe("rate limited");
  });

  it("skips unknown accounts without creating a log row", async () => {
    const sendDm = vi.fn();

    const result = await processComment(
      prisma,
      { igUserId: "unknown-account", mediaId: "media-1", commentId: "comment-4", text: "오이" },
      { sendDm },
    );

    expect(result).toEqual({ status: "SKIPPED", reason: "unknown_account" });
    expect(sendDm).not.toHaveBeenCalled();
  });

  it("is idempotent for a comment id that was already processed", async () => {
    const account = await seedAccount();
    const template = await seedTemplate();
    await prisma.triggerRule.create({
      data: { accountId: account.id, mediaId: "media-1", keyword: "오이", dmTemplateId: template.id },
    });
    const sendDm = vi.fn().mockResolvedValue({ messageId: "msg-1" });
    const comment = { igUserId: "ig-account-1", mediaId: "media-1", commentId: "comment-5", text: "오이 주세요" };

    await processComment(prisma, comment, { sendDm });
    const second = await processComment(prisma, comment, { sendDm });

    expect(second).toEqual({ status: "SKIPPED", reason: "duplicate_event" });
    expect(sendDm).toHaveBeenCalledTimes(1);
  });
});
