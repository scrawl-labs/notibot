import type { DmTemplate, PrismaClient } from "@prisma/client";
import { findMatchingRule } from "./triggerMatcher.js";
import { renderTemplate } from "./templateRenderer.js";
import { sendPrivateReply, InstagramApiError, type OutboundMessage } from "./instagramClient.js";
import type { IncomingComment } from "../webhook/payload.js";

function buildOutboundMessage(template: DmTemplate, vars: Record<string, string | undefined>): OutboundMessage {
  switch (template.messageType) {
    case "IMAGE":
      return { type: "IMAGE", imageUrl: template.imageUrl! };
    case "GENERIC":
      return {
        type: "GENERIC",
        title: renderTemplate(template.body!, vars),
        imageUrl: template.imageUrl!,
        buttonUrl: template.buttonUrl!,
        buttonLabel: template.buttonLabel!,
      };
    case "TEXT":
    default:
      return { type: "TEXT", text: renderTemplate(template.body!, vars) };
  }
}

export type SendDmFn = typeof sendPrivateReply;

export interface ProcessCommentResult {
  status: "SENT" | "FAILED" | "SKIPPED" | "NO_MATCH";
  reason?: string;
}

/**
 * Handles one incoming comment end to end: look up the owning account, find
 * a matching trigger rule, render + send the DM, and persist an audit log
 * row regardless of outcome so the back office can see what happened.
 */
export async function processComment(
  db: PrismaClient,
  comment: IncomingComment,
  deps: { sendDm?: SendDmFn } = {},
): Promise<ProcessCommentResult> {
  const sendDm = deps.sendDm ?? sendPrivateReply;

  const account = await db.instagramAccount.findUnique({ where: { igUserId: comment.igUserId } });
  if (!account) {
    return { status: "SKIPPED", reason: "unknown_account" };
  }

  const existing = await db.commentEvent.findUnique({ where: { commentId: comment.commentId } });
  if (existing) {
    return { status: "SKIPPED", reason: "duplicate_event" };
  }

  const rules = await db.triggerRule.findMany({
    where: { accountId: account.id, isActive: true },
    include: { dmTemplate: true },
  });

  const matchedRule = findMatchingRule(rules, comment.mediaId, comment.text);

  if (!matchedRule) {
    await db.commentEvent.create({
      data: {
        accountId: account.id,
        mediaId: comment.mediaId,
        commentId: comment.commentId,
        fromUserId: comment.fromUserId,
        fromUsername: comment.fromUsername,
        text: comment.text,
        dmStatus: "NO_MATCH",
      },
    });
    return { status: "NO_MATCH" };
  }

  const message = buildOutboundMessage(matchedRule.dmTemplate, { username: comment.fromUsername });

  try {
    await sendDm({
      commentId: comment.commentId,
      message,
      accessToken: account.pageAccessToken,
    });

    await db.commentEvent.create({
      data: {
        accountId: account.id,
        mediaId: comment.mediaId,
        commentId: comment.commentId,
        fromUserId: comment.fromUserId,
        fromUsername: comment.fromUsername,
        text: comment.text,
        matchedRuleId: matchedRule.id,
        dmStatus: "SENT",
      },
    });
    return { status: "SENT" };
  } catch (err) {
    const errorMessage = err instanceof InstagramApiError ? err.message : String(err);

    await db.commentEvent.create({
      data: {
        accountId: account.id,
        mediaId: comment.mediaId,
        commentId: comment.commentId,
        fromUserId: comment.fromUserId,
        fromUsername: comment.fromUsername,
        text: comment.text,
        matchedRuleId: matchedRule.id,
        dmStatus: "FAILED",
        errorMessage,
      },
    });
    return { status: "FAILED", reason: errorMessage };
  }
}
