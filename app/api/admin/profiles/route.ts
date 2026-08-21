import { NextRequest,NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { adminApiError } from "@/lib/api-error";

export async function GET(request:NextRequest){try{await requireAdmin(request);const db=await getDb();const rows=await db.select({id:users.id,displayName:users.displayName,username:users.username,bio:users.bio,emailShow:users.emailShow,commissionStatus:users.commissionStatus,weiboUrl:users.weiboUrl,bilibiliUrl:users.bilibiliUrl,xiaohongshuUrl:users.xiaohongshuUrl,douyinUrl:users.douyinUrl,lofterUrl:users.lofterUrl,tuyaUrl:users.tuyaUrl,banciyuanUrl:users.banciyuanUrl,pixivUrl:users.pixivUrl,twitterUrl:users.twitterUrl,instagramUrl:users.instagramUrl,artstationUrl:users.artstationUrl,deviantartUrl:users.deviantartUrl,behanceUrl:users.behanceUrl,websiteUrl:users.websiteUrl,miyousheUrl:users.miyousheUrl,createdAt:users.createdAt}).from(users).where(eq(users.profileStatus,0));return NextResponse.json(rows)}catch(error){return adminApiError(error,"admin-profiles-list")}}
