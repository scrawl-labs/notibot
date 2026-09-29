import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import type { DmMessageType } from "@prisma/client";

export const dmTemplatesRouter = Router();

const MESSAGE_TYPES: DmMessageType[] = ["TEXT", "IMAGE", "GENERIC"];

interface TemplateFields {
  messageType: DmMessageType;
  body?: string | null;
  imageUrl?: string | null;
  buttonUrl?: string | null;
  buttonLabel?: string | null;
}

function validateTemplateFields(fields: TemplateFields): string | null {
  const { messageType, body, imageUrl, buttonUrl, buttonLabel } = fields;
  if (messageType === "TEXT" && !body) {
    return "body is required for TEXT templates";
  }
  if (messageType === "IMAGE" && !imageUrl) {
    return "imageUrl is required for IMAGE templates";
  }
  if (messageType === "GENERIC" && (!body || !imageUrl || !buttonUrl || !buttonLabel)) {
    return "body, imageUrl, buttonUrl and buttonLabel are all required for GENERIC templates";
  }
  return null;
}

dmTemplatesRouter.get("/", async (_req, res) => {
  const templates = await prisma.dmTemplate.findMany({ orderBy: { createdAt: "desc" } });
  res.json(templates);
});

dmTemplatesRouter.post("/", async (req, res) => {
  const { name, messageType, body, imageUrl, buttonUrl, buttonLabel } = req.body ?? {};
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const type: DmMessageType = MESSAGE_TYPES.includes(messageType) ? messageType : "TEXT";

  const validationError = validateTemplateFields({ messageType: type, body, imageUrl, buttonUrl, buttonLabel });
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const template = await prisma.dmTemplate.create({
    data: { name, messageType: type, body, imageUrl, buttonUrl, buttonLabel },
  });
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
  const existing = await prisma.dmTemplate.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.sendStatus(404);
    return;
  }

  const { name, messageType, body, imageUrl, buttonUrl, buttonLabel } = req.body ?? {};
  const type: DmMessageType = MESSAGE_TYPES.includes(messageType) ? messageType : existing.messageType;
  const merged: TemplateFields = {
    messageType: type,
    body: body !== undefined ? body : existing.body,
    imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
    buttonUrl: buttonUrl !== undefined ? buttonUrl : existing.buttonUrl,
    buttonLabel: buttonLabel !== undefined ? buttonLabel : existing.buttonLabel,
  };

  const validationError = validateTemplateFields(merged);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  try {
    const template = await prisma.dmTemplate.update({
      where: { id: req.params.id },
      data: { name, ...merged },
    });
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
