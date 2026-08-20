import { adminApiError } from "@/lib/api-error";
import { NextRequest,NextResponse } from "next/server";
import { desc,eq } from "drizzle-orm";
import { artworks,users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
export async function GET(request:NextRequest){
  try{await requireAdmin(request);const db=await getDb();const rows=await db.select({id:artworks.id,title:artworks.title,imageUrl:artworks.imageUrl,tags:artworks.tags,description:artworks.description,copyrightRisk:artworks.copyrightRisk,createdAt:artworks.createdAt,userId:users.id,username:users.username,artistName:users.displayName,artistAvatar:users.avatarUrl}).from(artworks).innerJoin(users,eq(artworks.userId,users.id)).where(eq(artworks.status,0)).orderBy(desc(artworks.createdAt));return NextResponse.json(rows)}catch(error){return adminApiError(error,"admin-artworks-list")}
}
