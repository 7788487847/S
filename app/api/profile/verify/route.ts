import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { artworks, profiles, verificationApplications, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { encryptPersonal } from "@/lib/crypto";
import { userApiError } from "@/lib/api-error";
import { verifyUploadTicket } from "@/lib/upload-ticket";
import { getArtworkAllUrls } from "@/lib/image";

function objectName(url: string) {
  const raw = url.split("/").pop()?.split("?")[0] || "";
  try { return decodeURIComponent(raw); } catch { return raw; }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    const body: unknown = await request.json();
    const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
    const rawImages = Array.isArray(input.representativeImages) ? input.representativeImages : [];
    const representativeImages: string[] = [...new Set(rawImages.map(value => String(value)).filter(Boolean))];
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.id, auth.userId));
    if (!user || user.role !== "artist") return NextResponse.json({ error: "只有画师账号可以申请认证" }, { status: 403 });
    if (representativeImages.length < 3 || representativeImages.length > 5) return NextResponse.json({ error: "请选择 3–5 张代表图" }, { status: 400 });
    if (input.originalityPromise !== true) return NextResponse.json({ error: "请确认手画原创或合法授权承诺" }, { status: 400 });
    const pending = await db.select({ id: verificationApplications.id }).from(verificationApplications).where(and(eq(verificationApplications.userId, auth.userId), eq(verificationApplications.status, 0)));
    if (pending.length) return NextResponse.json({ error: "你的认证申请正在审核中，请勿重复提交" }, { status: 409 });

    const ownWorks = await db.select().from(artworks).where(eq(artworks.userId, auth.userId));
    const ownNames = new Set<string>(ownWorks.flatMap(work => getArtworkAllUrls(work)).map(objectName));
    const rawTickets = Array.isArray(input.uploadTickets) ? input.uploadTickets : [];
    const ticketLists: string[][] = await Promise.all(rawTickets.map(ticket => verifyUploadTicket(String(ticket), auth.userId)));
    const ticketNames = new Set<string>(ticketLists.flat());
    const allowed = new Set<string>([...ownNames, ...ticketNames]);
    if (representativeImages.some(url => !allowed.has(objectName(url)))) return NextResponse.json({ error: "代表图不属于当前账号，请刷新后重新选择" }, { status: 400 });

    const realName = String(input.realName || "").trim().slice(0, 50);
    await db.transaction(async tx => {
      await tx.insert(profiles).values({ userId: user.id, displayName: user.displayName, profileStatus: 0 }).onConflictDoUpdate({ target: profiles.userId, set: { displayName: user.displayName, profileStatus: 0, updatedAt: new Date() } });
      await tx.insert(verificationApplications).values({ userId: auth.userId, realName: realName ? encryptPersonal(realName) : null, representativeImages: JSON.stringify(representativeImages) });
      await tx.update(users).set({ verificationRequestedAt: new Date() }).where(eq(users.id, auth.userId));
    });
    return NextResponse.json({ ok: true, message: "认证申请已提交，等待站长审核" });
  } catch (error) { return userApiError(error, "verification-application", "登录已过期，请重新登录"); }
}
