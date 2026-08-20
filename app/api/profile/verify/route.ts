import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { artworks, profiles, verificationApplications, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { encryptPersonal } from "@/lib/crypto";
import { userApiError } from "@/lib/api-error";
import { getArtworkThumbnail } from "@/lib/image";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    const body = await request.json();
    const rawArtworkIds: unknown[] = Array.isArray(body.artworkIds) ? body.artworkIds : [];
    const artworkIds: number[] = [...new Set(rawArtworkIds.map(value => Number(value)).filter((value): value is number => Number.isInteger(value) && value > 0))];
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.id, auth.userId));
    if (!user || user.role !== "artist") return NextResponse.json({ error: "只有画师账号可以申请认证" }, { status: 403 });
    if (artworkIds.length < 3 || artworkIds.length > 5) return NextResponse.json({ error: "请选择 3–5 件代表作品" }, { status: 400 });
    if (!body.originalityPromise) return NextResponse.json({ error: "请确认手画原创或合法授权承诺" }, { status: 400 });
    if ((await db.select({ id: verificationApplications.id }).from(verificationApplications).where(and(eq(verificationApplications.userId, auth.userId), eq(verificationApplications.status, 0)))).length) return NextResponse.json({ error: "你的认证申请正在审核中，请勿重复提交" }, { status: 409 });

    const selected = await db.select().from(artworks).where(and(eq(artworks.userId, auth.userId), inArray(artworks.id, artworkIds)));
    if (selected.length !== artworkIds.length) return NextResponse.json({ error: "部分作品不存在或不属于当前账号，请刷新后重新选择" }, { status: 400 });
    const representativeImages = selected.map(getArtworkThumbnail).filter(Boolean);
    if (representativeImages.length < 3) return NextResponse.json({ error: "部分作品缺少可用图片，请重新选择" }, { status: 400 });

    const realName = String(body.realName || "").trim().slice(0, 50);
    await db.transaction(async tx => {
      await tx.insert(profiles).values({ userId: user.id, displayName: user.displayName, profileStatus: 0 }).onConflictDoUpdate({ target: profiles.userId, set: { displayName: user.displayName, profileStatus: 0, updatedAt: new Date() } });
      await tx.insert(verificationApplications).values({ userId: auth.userId, realName: realName ? encryptPersonal(realName) : null, representativeImages: JSON.stringify(representativeImages) });
      await tx.update(users).set({ verificationRequestedAt: new Date() }).where(eq(users.id, auth.userId));
    });
    return NextResponse.json({ ok: true, message: "认证申请已提交，等待站长审核" });
  } catch (error) { return userApiError(error, "verification-application", "登录已过期，请重新登录"); }
}
