import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const dmTemplatesRouter = Router();

dmTemplatesRouter.get("/", async (_req, res) => {
  const templates = await prisma.dmTemplate.findMany({ orderBy: { createdAt: "desc" } });
  res.json(templates);
});

dmTemplatesRouter.post("/", async (req, res) => {
  const { name, body } = req.body ?? {};
  if (!name || !body) {
    res.status(400).json({ error: "name and body are required" });
    return;
  }
  const template = await prisma.dmTemplate.create({ data: { name, body } });
  res.status(201).json(template);
});

dmTemplatesRouter.get("/:id", async (req, res) => {
  const template = await prisma.dmTemplate.findUnique({ where: { id: req.params.id } });
  if (!template) {
    res.sendStatus(404);
    return;
  }
  res.json(template);
});

dmTemplatesRouter.patch("/:id", async (req, res) => {
  const { name, body } = req.body ?? {};
  try {
    const template = await prisma.dmTemplate.update({ where: { id: req.params.id }, data: { name, body } });
    res.json(template);
  } catch {
    res.sendStatus(404);
  }
});

dmTemplatesRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.dmTemplate.delete({ where: { id: req.params.id } });
    res.sendStatus(204);
  } catch {
    res.sendStatus(404);
  }
});
