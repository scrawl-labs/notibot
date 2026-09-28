import { describe, expect, it } from "vitest";
import { extractComments, type IgWebhookPayload } from "../src/webhook/payload.js";

describe("extractComments", () => {
  it("flattens comments changes across entries", () => {
    const payload: IgWebhookPayload = {
      object: "instagram",
      entry: [
        {
          id: "ig-account-1",
          changes: [
            {
              field: "comments",
              value: {
                id: "comment-1",
                text: "오이 주세요",
                from: { id: "user-1", username: "alice" },
                media: { id: "media-1" },
              },
            },
          ],
        },
      ],
    };

    expect(extractComments(payload)).toEqual([
      {
        igUserId: "ig-account-1",
        mediaId: "media-1",
        commentId: "comment-1",
        text: "오이 주세요",
        fromUserId: "user-1",
        fromUsername: "alice",
      },
    ]);
  });

  it("ignores non-instagram objects and non-comments fields", () => {
    const payload = {
      object: "page",
      entry: [{ id: "x", changes: [{ field: "feed", value: { id: "c", text: "hi", media: { id: "m" } } }] }],
    } as unknown as IgWebhookPayload;

    expect(extractComments(payload)).toEqual([]);
  });

  it("skips nested replies (comments carrying a parent_id)", () => {
    const payload: IgWebhookPayload = {
      object: "instagram",
      entry: [
        {
          id: "ig-account-1",
          changes: [
            {
              field: "comments",
              value: {
                id: "reply-1",
                parent_id: "comment-1",
                text: "reply text",
                media: { id: "media-1" },
              },
            },
          ],
        },
      ],
    };

    expect(extractComments(payload)).toEqual([]);
  });
});
