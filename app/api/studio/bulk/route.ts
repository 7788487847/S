import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { artworks, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { userApiError } from "@/lib/api-error";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request), body = await request.json(), ids = (Array.isArray(body.ids) ? body.ids : []).map(Number).filter(Number.isInteger), db = await getDb();
    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, auth.userId));
    if (user?.role !== "artist") return NextResponse.json({ error: "无权操作" }, { status: 403 });
    if (!ids.length || ids.length > 100) return NextResponse.json({ error: "请选择 1-100 件作品" }, { status: 400 });
    const own = and(eq(artworks.userId, auth.userId), inArray(artworks.id, ids));
    await db.transaction(async tx => {
      if (body.action === "delete") await tx.delete(artworks).where(own);
      else if (body.action === "unpublish") await tx.update(artworks).set({ status: 2 }).where(own);
      else if (body.action === "publish") await tx.update(artworks).set({ status: 0 }).where(own);
      else if (body.action === "reorder" && Array.isArray(body.order)) {
        const order = body.order.map(Number).filter(Number.isInteger).slice(0, 100);
        for (let i = 0; i < order.length; i++) await tx.update(artworks).set({ sortOrder: i }).where(and(eq(artworks.userId, auth.userId), eq(artworks.id, order[i])));
      } else throw new Error("INVALID_ACTION");
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_ACTION") return NextResponse.json({ error: "未知操作" }, { status: 400 });
    return userApiError(error, "studio-bulk", "请先登录");
  }
}
