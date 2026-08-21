import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auditLogs, contactMessages, notifications } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { validateSafeText } from "@/lib/validation";
import { adminApiError } from "@/lib/api-error";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params, body = await request.json(), reply = String(body.reply || "").trim();
    if (!reply || reply.length > 2000) return NextResponse.json({ error: "回复需为 1-2000 字" }, { status: 400 });
    const unsafe = validateSafeText(reply); if (unsafe) return NextResponse.json({ error: unsafe }, { status: 400 });
    const db = await getDb(), message = await db.transaction(async tx => {
      const [updated] = await tx.update(contactMessages).set({ status: 1, adminReply: reply, repliedAt: new Date(), resolvedAt: new Date() }).where(eq(contactMessages.id, Number(id))).returning();
      if (!updated) return null;
      await tx.insert(notifications).values({ userId: updated.userId, type: "contact-reply", title: "站长回复了你的留言", body: reply.slice(0, 100), targetUrl: "/contact" });
      await tx.insert(auditLogs).values({ actor: "admin", targetType: "contact", targetId: Number(id), action: "reply" });
      return updated;
    });
    return message ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "留言不存在" }, { status: 404 });
  } catch (error) { return adminApiError(error, "admin-contact-reply"); }
}
