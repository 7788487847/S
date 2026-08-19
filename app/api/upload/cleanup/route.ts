import { NextRequest,NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { verifyUploadTicket } from "@/lib/upload-ticket";
import { cleanupExpiredUploads,removeUnused } from "@/lib/upload-cleanup";
import { userApiError } from "@/lib/api-error";
export async function POST(request:NextRequest){try{const auth=await requireUser(request),body=await request.json(),names=await verifyUploadTicket(String(body.uploadTicket||""),auth.userId),removed=await removeUnused(names);return NextResponse.json({ok:true,removed})}catch(error){return userApiError(error,"upload-cleanup","请先登录")}}
export async function DELETE(request:NextRequest){try{await requireUser(request);return NextResponse.json({ok:true,removed:await cleanupExpiredUploads()})}catch(error){return userApiError(error,"upload-expired-cleanup","请先登录")}}
