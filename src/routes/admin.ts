import { Router } from "express";
import { Prisma, type DmStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const adminRouter = Router();

function friendlyMessage(err: unknown): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return "이미 등록된 값입니다 (중복).";
  }
  return "요청을 처리하지 못했습니다.";
}

function getError(req: { query: Record<string, unknown> }): string | undefined {
  return typeof req.query.error === "string" ? req.query.error : undefined;
}

adminRouter.get("/", (_req, res) => res.redirect("/admin/events"));

adminRouter.get("/events", async (req, res) => {
  const accountId = typeof req.query.accountId === "string" && req.query.accountId ? req.query.accountId : undefined;
  const dmStatus =
    typeof req.query.dmStatus === "string" && req.query.dmStatus ? (req.query.dmStatus as DmStatus) : undefined;

  const [events, accounts] = await Promise.all([
    prisma.commentEvent.findMany({
      where: { accountId, dmStatus },
      include: { account: true, matchedRule: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.instagramAccount.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  res.render("events", {
    events,
    accounts,
    filters: { accountId: accountId ?? "", dmStatus: dmStatus ?? "" },
    error: getError(req),
  });
});

adminRouter.get("/templates", async (req, res) => {
  const templates = await prisma.dmTemplate.findMany({ orderBy: { createdAt: "desc" } });
  res.render("templates", { templates, error: getError(req) });
});

adminRouter.post("/templates", async (req, res) => {
  const { name, body } = req.body ?? {};
  if (!name || !body) {
    res.redirect("/admin/templates?error=" + encodeURIComponent("이름과 본문을 입력하세요."));
    return;
  }
  try {
    await prisma.dmTemplate.create({ data: { name, body } });
    res.redirect("/admin/templates");
  } catch (err) {
    res.redirect("/admin/templates?error=" + encodeURIComponent(friendlyMessage(err)));
  }
});

adminRouter.post("/templates/:id/delete", async (req, res) => {
  await prisma.dmTemplate.delete({ where: { id: req.params.id } }).catch(() => undefined);
  res.redirect("/admin/templates");
});

adminRouter.get("/rules", async (req, res) => {
  const [rules, accounts, templates] = await Promise.all([
    prisma.triggerRule.findMany({
      include: { account: true, dmTemplate: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.instagramAccount.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.dmTemplate.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  res.render("rules", { rules, accounts, templates, error: getError(req) });
});

adminRouter.post("/rules", async (req, res) => {
  const { accountId, mediaId, keyword, matchType, dmTemplateId, priority } = req.body ?? {};
  if (!accountId || !keyword || !dmTemplateId) {
    res.redirect("/admin/rules?error=" + encodeURIComponent("계정, 키워드, 템플릿은 필수입니다."));
    return;
  }
  try {
    await prisma.triggerRule.create({
      data: {
        accountId,
        mediaId: mediaId ? mediaId : null,
        keyword,
        matchType: matchType || "CONTAINS",
        dmTemplateId,
        priority: Number.isFinite(Number(priority)) ? Number(priority) : 0,
      },
    });
    res.redirect("/admin/rules");
  } catch (err) {
    res.redirect("/admin/rules?error=" + encodeURIComponent(friendlyMessage(err)));
  }
});

adminRouter.post("/rules/:id/toggle", async (req, res) => {
  const rule = await prisma.triggerRule.findUnique({ where: { id: req.params.id } });
  if (rule) {
    await prisma.triggerRule.update({ where: { id: rule.id }, data: { isActive: !rule.isActive } });
  }
  res.redirect("/admin/rules");
});

adminRouter.post("/rules/:id/delete", async (req, res) => {
  await prisma.triggerRule.delete({ where: { id: req.params.id } }).catch(() => undefined);
  res.redirect("/admin/rules");
});

adminRouter.get("/accounts", async (req, res) => {
  const accounts = await prisma.instagramAccount.findMany({ orderBy: { createdAt: "desc" } });
  res.render("accounts", { accounts, error: getError(req) });
});

adminRouter.post("/accounts", async (req, res) => {
  const { igUserId, username, pageAccessToken } = req.body ?? {};
  if (!igUserId || !pageAccessToken) {
    res.redirect("/admin/accounts?error=" + encodeURIComponent("Instagram User ID와 Page Access Token은 필수입니다."));
    return;
  }
  try {
    await prisma.instagramAccount.create({ data: { igUserId, username: username || null, pageAccessToken } });
    res.redirect("/admin/accounts");
  } catch (err) {
    res.redirect("/admin/accounts?error=" + encodeURIComponent(friendlyMessage(err)));
  }
});

adminRouter.post("/accounts/:id/delete", async (req, res) => {
  await prisma.instagramAccount.delete({ where: { id: req.params.id } }).catch(() => undefined);
  res.redirect("/admin/accounts");
});
