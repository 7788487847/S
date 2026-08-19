import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { uploadStorageBytes } from "@/lib/upload-cleanup";

export async function GET() {
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, database: "ready", uploadBytes: process.env.NODE_ENV === "production" ? undefined : await uploadStorageBytes() });
  } catch {
    return NextResponse.json({ ok: false, database: "unavailable" }, { status: 503 });
  }
}
