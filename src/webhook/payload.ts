export interface IgCommentChangeValue {
  id: string;
  text: string;
  from?: { id: string; username?: string };
  media?: { id: string; media_product_type?: string };
  parent_id?: string;
}

export interface IgWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    time?: number;
    changes?: Array<{ field: string; value: IgCommentChangeValue }>;
  }>;
}

export interface IncomingComment {
  igUserId: string;
  mediaId: string;
  commentId: string;
  text: string;
  fromUserId?: string;
  fromUsername?: string;
}

/** Flattens a webhook payload into the individual "comments" field changes it carries. */
export function extractComments(payload: IgWebhookPayload): IncomingComment[] {
  if (payload.object !== "instagram") return [];

  const comments: IncomingComment[] = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "comments") continue;
      const value = change.value;
      if (!value?.id || !value.media?.id) continue;
      // Replies to the bot's own private reply / nested comments carry a
      // parent_id; only react to top-level comments on the media.
      if (value.parent_id) continue;

      comments.push({
        igUserId: entry.id,
        mediaId: value.media.id,
        commentId: value.id,
        text: value.text ?? "",
        fromUserId: value.from?.id,
        fromUsername: value.from?.username,
      });
    }
  }
  return comments;
}
