#!/usr/bin/env node
// A stand-in for Meta: builds a real Instagram "comments" webhook payload,
// signs it with IG_APP_SECRET exactly like Meta would, and POSTs it to your
// running server. Use this to test the trigger -> DM pipeline without
// setting up a real Meta app / webhook subscription.
//
// Usage:
//   node --env-file=.env scripts/simulate-comment.mjs \
//     --ig-user ig-acc-demo --media media-demo --text "오이 주세요" \
//     [--username tester] [--user-id u1] [--comment-id auto] [--url http://localhost:3000/webhook]
//
// Or via the npm script (already loads .env):
//   npm run simulate -- --ig-user ig-acc-demo --media media-demo --text "오이 주세요"

import crypto from "node:crypto";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith("--")) continue;
    const name = key.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    args[name] = value;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

if (!args["ig-user"] || !args.media || args.text === undefined) {
  console.error(
    "Usage: node --env-file=.env scripts/simulate-comment.mjs --ig-user <igUserId> --media <mediaId> --text <commentText> [--username name] [--user-id id] [--comment-id id] [--url http://localhost:3000/webhook]",
  );
  process.exit(1);
}

const url = args.url ?? "http://localhost:3000/webhook";
const appSecret = process.env.IG_APP_SECRET;
if (!appSecret) {
  console.error("IG_APP_SECRET is not set. Run this via `npm run simulate -- ...` (it loads .env), or export it yourself.");
  process.exit(1);
}

const commentId = args["comment-id"] ?? `sim-${crypto.randomUUID()}`;

const payload = {
  object: "instagram",
  entry: [
    {
      id: args["ig-user"],
      time: Math.floor(Date.now() / 1000),
      changes: [
        {
          field: "comments",
          value: {
            id: commentId,
            text: args.text,
            media: { id: args.media, media_product_type: "FEED" },
            from: { id: args["user-id"] ?? "sim-user", username: args.username ?? "sim_tester" },
          },
        },
      ],
    },
  ],
};

const body = JSON.stringify(payload);
const signature = `sha256=${crypto.createHmac("sha256", appSecret).update(body).digest("hex")}`;

console.log("POST", url);
console.log(body);

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-hub-signature-256": signature },
  body,
});

console.log(`\n<- ${res.status} ${res.statusText}`);

if (res.status === 200) {
  console.log(`\ncomment-id: ${commentId} (check /api/events?accountId=... shortly — processing happens right after this response)`);
}
