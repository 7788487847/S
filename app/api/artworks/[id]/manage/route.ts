import { NextRequest,NextResponse } from "next/server";
import { and,eq } from "drizzle-orm";
import { artworks } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { removeArtworkFiles } from "@/lib/artwork-storage";
import { userApiError } from "@/lib/api-error";
async function own(r:NextRequest,id:string){const auth=await requireUser(r),db=await getDb(),[work]=await db.select().from(artworks).where(and(eq(artworks.id,Number(id)),eq(artworks.userId,auth.userId)));return{db,work}}
export async function PATCH(r:NextRequest,{params}:{params:Promise<{id:string}>}){try{const{id}=await params,{db,work}=await own(r,id);if(!work)return NextResponse.json({error:"作品不存在或无权操作"},{status:404});const body=await r.json(),[updated]=await db.update(artworks).set({isPinned:body.pinned===true}).where(eq(artworks.id,work.id)).returning({isPinned:artworks.isPinned});return NextResponse.json({ok:true,isPinned:updated.isPinned})}catch(error){return userApiError(error,"artwork-pin")}}
export async function DELETE(r:NextRequest,{params}:{params:Promise<{id:string}>}){try{const{id}=await params,{db,work}=await own(r,id);if(!work)return NextResponse.json({error:"作品不存在或无权操作"},{status:404});await db.delete(artworks).where(eq(artworks.id,work.id));await removeArtworkFiles(work);return NextResponse.json({ok:true,message:work.status===0?"已撤回审核，作品和图片均已清理":"作品和图片均已删除"})}catch(error){return userApiError(error,"artwork-delete")}}
