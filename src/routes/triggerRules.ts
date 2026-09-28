import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const triggerRulesRouter = Router();

triggerRulesRouter.get("/", async (req, res) => {
  const { accountId, mediaId } = req.query;
  const rules = await prisma.triggerRule.findMany({
    where: {
      accountId: typeof accountId === "string" ? accountId : undefined,
      mediaId: typeof mediaId === "string" ? mediaId : undefined,
    },
    include: { account: true, dmTemplate: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(rules);
});

triggerRulesRouter.post("/", async (req, res) => {
  const { accountId, mediaId, keyword, matchType, priority, dmTemplateId, isActive } = req.body ?? {};
  if (!accountId || !keyword || !dmTemplateId) {
    res.status(400).json({ error: "accountId, keyword and dmTemplateId are required" });
    return;
  }
  try {
    const rule = await prisma.triggerRule.create({
      data: {
        accountId,
        mediaId: mediaId ?? null,
        keyword,
        matchType: matchType ?? "CONTAINS",
        priority: priority ?? 0,
        dmTemplateId,
        isActive: isActive ?? true,
      },
      include: { account: true, dmTemplate: true },
    });
    res.status(201).json(rule);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "invalid request" });
  }
});

triggerRulesRouter.get("/:id", async (req, res) => {
  const rule = await prisma.triggerRule.findUnique({
    where: { id: req.params.id },
    include: { account: true, dmTemplate: true },
  });
  if (!rule) {
    res.sendStatus(404);
    return;
  }
  res.json(rule);
});

triggerRulesRouter.patch("/:id", async (req, res) => {
  const { mediaId, keyword, matchType, priority, dmTemplateId, isActive } = req.body ?? {};
  try {
    const rule = await prisma.triggerRule.update({
      where: { id: req.params.id },
      data: { mediaId, keyword, matchType, priority, dmTemplateId, isActive },
      include: { account: true, dmTemplate: true },
    });
    res.json(rule);
  } catch {
    res.sendStatus(404);
  }
});

triggerRulesRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.triggerRule.delete({ where: { id: req.params.id } });
    res.sendStatus(204);
  } catch {
    res.sendStatus(404);
  }
});
