import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const accountsRouter = Router();

accountsRouter.get("/", async (_req, res) => {
  const accounts = await prisma.instagramAccount.findMany({
    select: { id: true, igUserId: true, username: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(accounts);
});

accountsRouter.post("/", async (req, res) => {
  const { igUserId, username, pageAccessToken } = req.body ?? {};
  if (!igUserId || !pageAccessToken) {
    res.status(400).json({ error: "igUserId and pageAccessToken are required" });
    return;
  }

  try {
    const account = await prisma.instagramAccount.create({
      data: { igUserId, username, pageAccessToken },
    });
    res.status(201).json({ ...account, pageAccessToken: undefined });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      res.status(400).json({ error: "This account is already registered (duplicate)." });
      return;
    }
    throw err;
  }
});

accountsRouter.get("/:id", async (req, res) => {
  const account = await prisma.instagramAccount.findUnique({ where: { id: req.params.id } });
  if (!account) {
    res.sendStatus(404);
    return;
  }
  res.json({ ...account, pageAccessToken: undefined });
});

accountsRouter.patch("/:id", async (req, res) => {
  const { username, pageAccessToken } = req.body ?? {};
  try {
    const account = await prisma.instagramAccount.update({
      where: { id: req.params.id },
      data: { username, pageAccessToken },
    });
    res.json({ ...account, pageAccessToken: undefined });
  } catch {
    res.sendStatus(404);
  }
});

accountsRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.instagramAccount.delete({ where: { id: req.params.id } });
    res.sendStatus(204);
  } catch {
    res.sendStatus(404);
  }
});
