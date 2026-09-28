import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const eventsRouter = Router();

eventsRouter.get("/", async (req, res) => {
  const { accountId, mediaId, dmStatus } = req.query;
  const events = await prisma.commentEvent.findMany({
    where: {
      accountId: typeof accountId === "string" ? accountId : undefined,
      mediaId: typeof mediaId === "string" ? mediaId : undefined,
      dmStatus: typeof dmStatus === "string" ? (dmStatus as never) : undefined,
    },
    include: { matchedRule: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json(events);
});

eventsRouter.get("/:id", async (req, res) => {
  const event = await prisma.commentEvent.findUnique({ where: { id: req.params.id }, include: { matchedRule: true } });
  if (!event) {
    res.sendStatus(404);
    return;
  }
  res.json(event);
});
