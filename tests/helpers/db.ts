import { prisma } from "../../src/lib/prisma.js";

export async function resetDb() {
  await prisma.commentEvent.deleteMany();
  await prisma.triggerRule.deleteMany();
  await prisma.dmTemplate.deleteMany();
  await prisma.instagramAccount.deleteMany();
}
