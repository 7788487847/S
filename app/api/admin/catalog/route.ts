import { NextRequest,NextResponse } from "next/server";
import { desc,eq,ilike,or } from "drizzle-orm";
import { artworks,users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { adminApiError } from "@/lib/api-error";
export async function GET(request:NextRequest){try{await requireAdmin(request);const query=new URL(request.url).searchParams.get("q")?.trim()||"",db=await getDb(),condition=query?or(ilike(artworks.title,`%${query}%`),ilike(artworks.tags,`%${query}%`),ilike(users.displayName,`%${query}%`),ilike(users.username,`%${query}%`)):undefined,rows=await db.select({id:artworks.id,title:artworks.title,imageUrl:artworks.imageUrl,thumbnailUrl:artworks.thumbnailUrl,displayUrl:artworks.displayUrl,originalUrl:artworks.originalUrl,images:artworks.images,imageVariants:artworks.imageVariants,tags:artworks.tags,description:artworks.description,status:artworks.status,copyrightRisk:artworks.copyrightRisk,createdAt:artworks.createdAt,userId:users.id,username:users.username,artistName:users.displayName}).from(artworks).innerJoin(users,eq(artworks.userId,users.id)).where(condition).orderBy(desc(artworks.createdAt)).limit(100);return NextResponse.json(rows)}catch(error){return adminApiError(error,"admin-catalog-list")}}
