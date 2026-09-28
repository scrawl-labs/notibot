import { Router } from "express";
import type { Request } from "express";
import { config } from "../config.js";
import { prisma } from "../lib/prisma.js";
import { isValidSignature } from "./signature.js";
import { extractComments, type IgWebhookPayload } from "./payload.js";
import { processComment } from "../services/commentProcessor.js";

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

export const webhookRouter = Router();

// Meta calls this once, at subscription time, to verify we own the endpoint.
webhookRouter.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === config.igVerifyToken && typeof challenge === "string") {
    res.status(200).send(challenge);
    return;
  }

  res.sendStatus(403);
});

webhookRouter.post("/webhook", async (req: RequestWithRawBody, res) => {
  const signature = req.header("x-hub-signature-256");
  const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));

  if (!isValidSignature(rawBody, signature, config.igAppSecret)) {
    res.sendStatus(401);
    return;
  }

  // Ack immediately so Meta doesn't retry/disable the subscription for being
  // slow; the actual DM sends happen after the response is flushed.
  res.sendStatus(200);

  const payload = req.body as IgWebhookPayload;
  const comments = extractComments(payload);

  for (const comment of comments) {
    try {
      await processComment(prisma, comment);
    } catch (err) {
      console.error("Failed to process comment webhook event", { commentId: comment.commentId, err });
    }
  }
});
