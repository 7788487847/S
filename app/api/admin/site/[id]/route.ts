import { NextRequest,NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { announcements } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { adminApiError } from "@/lib/api-error";
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{await requireAdmin(request);const{id}=await params,b=await request.json(),db=await getDb(),title=String(b.title||"").trim(),content=String(b.content||"").trim();if(!title||!content||title.length>100||content.length>5000)return NextResponse.json({error:"公告内容无效"},{status:400});const[item]=await db.update(announcements).set({title,content,status:b.status===1?1:0,updatedAt:new Date()}).where(eq(announcements.id,Number(id))).returning();return item?NextResponse.json({ok:true,item}):NextResponse.json({error:"公告不存在"},{status:404})}catch(error){return adminApiError(error,"admin-announcement")}}
export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{await requireAdmin(request);const{id}=await params,db=await getDb();await db.delete(announcements).where(eq(announcements.id,Number(id)));return NextResponse.json({ok:true})}catch(error){return adminApiError(error,"admin-announcement-delete")}}
