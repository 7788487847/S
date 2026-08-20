import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { artworks, auditLogs } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { adminApiError } from "@/lib/api-error";
import { validateNoContact, validateSafeText } from "@/lib/validation";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params, artworkId = Number(id), body = await request.json(), action = String(body.action || ""), db = await getDb();
    if (!Number.isInteger(artworkId)) return NextResponse.json({ error: "作品编号无效" }, { status: 400 });
    if (action === "edit") {
      const title = String(body.title || "").trim(), tags = String(body.tags || "").trim(), description = String(body.description || "").trim();
      if (!title || title.length > 100 || tags.length > 300 || description.length > 2000) return NextResponse.json({ error: "标题、标签或简介长度不符合要求" }, { status: 400 });
      const unsafe = validateSafeText(`${title} ${tags} ${description}`); if (unsafe) return NextResponse.json({ error: unsafe }, { status: 400 });
      if (validateNoContact(`${title} ${tags} ${description}`, "内容")) return NextResponse.json({ error: "内容包含违规联系方式" }, { status: 400 });
      const result = await db.transaction(async tx => {
        const [updated] = await tx.update(artworks).set({ title, tags, description: description || null }).where(eq(artworks.id, artworkId)).returning();
        if (!updated) return null;
        await tx.insert(auditLogs).values({ actor: "admin", targetType: "artwork", targetId: artworkId, action: "edit", detail: "metadata" }); return updated;
      });
      return result ? NextResponse.json({ ok: true, artwork: result }) : NextResponse.json({ error: "作品不存在" }, { status: 404 });
    }
    if (!["approve", "reject"].includes(action)) return NextResponse.json({ error: "无效操作" }, { status: 400 });
    const status = action === "approve" ? 1 : 2;
    const result = await db.transaction(async tx => {
      const [updated] = await tx.update(artworks).set({ status }).where(and(eq(artworks.id, artworkId), eq(artworks.status, 0))).returning();
      if (!updated) return null;
      await tx.insert(auditLogs).values({ actor: "admin", targetType: "artwork", targetId: artworkId, action, detail: updated.copyrightRisk ? "copyright-risk" : "normal" }); return updated;
    });
    return result ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "作品已处理或不存在" }, { status: 404 });
  } catch (error) { return adminApiError(error, "admin-artwork"); }
}
