import { config } from "../config.js";

export class InstagramApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "InstagramApiError";
  }
}

/**
 * Sends a DM to the author of an Instagram comment via the "private reply"
 * endpoint. This is the mechanism Meta provides for replying privately to a
 * comment without full Messaging API access; it must be called within 7 days
 * of the comment and only once per comment.
 * https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/private-replies
 */
export async function sendPrivateReply(params: {
  commentId: string;
  message: string;
  accessToken: string;
  fetchImpl?: typeof fetch;
}): Promise<{ messageId: string }> {
  const { commentId, message, accessToken, fetchImpl = fetch } = params;

  const url = `${config.igGraphApiBaseUrl}/${encodeURIComponent(commentId)}/private_replies`;
  const res = await fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: accessToken }),
  });

  const body = await res.json().catch(() => undefined);

  if (!res.ok) {
    const errMessage =
      (body as { error?: { message?: string } } | undefined)?.error?.message ??
      `Instagram API request failed with status ${res.status}`;
    throw new InstagramApiError(errMessage, res.status, body);
  }

  const messageId = (body as { id?: string } | undefined)?.id;
  if (!messageId) {
    throw new InstagramApiError("Instagram API response missing message id", res.status, body);
  }

  return { messageId };
}
