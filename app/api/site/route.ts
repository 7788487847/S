import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { announcements, siteSettings } from "@/db/schema";
import { getDb } from "@/lib/db";
export async function GET(){try{const db=await getDb(),[settings]=await db.select().from(siteSettings).limit(1),items=await db.select().from(announcements).where(eq(announcements.status,1)).orderBy(desc(announcements.updatedAt)).limit(5);return NextResponse.json({settings:settings||{siteName:"灵犀",siteUrl:"https://www.rinsea.cn",contactEmail:"admin@lingxi.art",termsEffectiveDate:"2026年8月19日"},announcements:items})}catch{return NextResponse.json({settings:{siteName:"灵犀",siteUrl:"https://www.rinsea.cn",contactEmail:"admin@lingxi.art",termsEffectiveDate:"2026年8月19日"},announcements:[]})}}
