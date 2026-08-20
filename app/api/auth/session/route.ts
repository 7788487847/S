import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";

const noStore = { "cache-control": "no-store, no-cache, must-revalidate" };

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    const [user] = await (await getDb()).select({ id: users.id, displayName: users.displayName, username: users.username, role: users.role, isBanned: users.isBanned, emailActivated: users.emailActivated }).from(users).where(eq(users.id, auth.userId));
    if (!user || user.isBanned || !user.emailActivated) return NextResponse.json({ valid: false }, { status: 401, headers: noStore });
    return NextResponse.json({ valid: true, user: { id: user.id, displayName: user.displayName, username: user.username, role: user.role } }, { headers: noStore });
  } catch {
    return NextResponse.json({ valid: false }, { status: 401, headers: noStore });
  }
}
