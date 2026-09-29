import { describe, expect, it } from "vitest";
import { buildMessagePayload } from "../src/services/instagramClient.js";

describe("buildMessagePayload", () => {
  it("returns a plain string for TEXT messages", () => {
    expect(buildMessagePayload({ type: "TEXT", text: "hi there" })).toBe("hi there");
  });

  it("returns an image attachment for IMAGE messages", () => {
    expect(buildMessagePayload({ type: "IMAGE", imageUrl: "https://example.com/a.jpg" })).toEqual({
      attachment: { type: "image", payload: { url: "https://example.com/a.jpg" } },
    });
  });

  it("returns a generic template with a web_url button for GENERIC messages", () => {
    expect(
      buildMessagePayload({
        type: "GENERIC",
        title: "Apples 1.5kg",
        imageUrl: "https://example.com/a.jpg",
        buttonUrl: "https://link.coupang.com/a/xyz",
        buttonLabel: "Buy Now",
      }),
    ).toEqual({
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            {
              title: "Apples 1.5kg",
              image_url: "https://example.com/a.jpg",
              buttons: [{ type: "web_url", url: "https://link.coupang.com/a/xyz", title: "Buy Now" }],
            },
          ],
        },
      },
    });
  });
});
