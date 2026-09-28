import express, { type Request } from "express";
import { webhookRouter } from "./webhook/handler.js";
import { accountsRouter } from "./routes/accounts.js";
import { dmTemplatesRouter } from "./routes/dmTemplates.js";
import { triggerRulesRouter } from "./routes/triggerRules.js";
import { eventsRouter } from "./routes/events.js";

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

export function createApp() {
  const app = express();

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as RequestWithRawBody).rawBody = Buffer.from(buf);
      },
    }),
  );

  app.get("/healthz", (_req, res) => res.json({ ok: true }));

  app.use(webhookRouter);
  app.use("/api/accounts", accountsRouter);
  app.use("/api/dm-templates", dmTemplatesRouter);
  app.use("/api/trigger-rules", triggerRulesRouter);
  app.use("/api/events", eventsRouter);

  return app;
}
