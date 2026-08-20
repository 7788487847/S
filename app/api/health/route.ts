import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { uploadStorageBytes } from "@/lib/upload-cleanup";

export async function GET() {
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, database: "ready", uploadBytes: process.env.NODE_ENV === "production" ? undefined : await uploadStorageBytes() });
  } catch (error) {
    const item = error && typeof error === "object" ? error as { code?: unknown; message?: unknown } : {};
    const code = typeof item.code === "string" ? item.code : "unknown";
    const message = typeof item.message === "string" ? item.message : "";
    const detail = code === "42P01" ? "schema_missing" : code === "28P01" ? "credentials_invalid" : code === "ECONNREFUSED" || code === "ETIMEDOUT" ? "database_unreachable" : message.includes("DATABASE_URL_NOT_CONFIGURED") ? "url_missing" : "unavailable";
    return NextResponse.json({ ok: false, database: detail }, { status: 503 });
  }
}
