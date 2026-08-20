import { NextRequest,NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { verifyUploadTicket } from "@/lib/upload-ticket";
import { cleanupExpiredUploads,removeUnused,usedUploadNames } from "@/lib/upload-cleanup";
import { remoteStorageEnabled,removeObjects } from "@/lib/object-storage";
import { userApiError } from "@/lib/api-error";

export async function POST(request:NextRequest){try{const auth=await requireUser(request),body=await request.json(),tickets=Array.isArray(body.uploadTickets)?body.uploadTickets:body.uploadTicket?[body.uploadTicket]:[];if(!tickets.length)return NextResponse.json({error:"缺少上传清理凭证"},{status:400});const lists=await Promise.all(tickets.map((ticket:unknown)=>verifyUploadTicket(String(ticket),auth.userId))),names=[...new Set(lists.flat())],used=await usedUploadNames(),safe=names.filter(name=>!used.has(name));if(remoteStorageEnabled()){await removeObjects(safe);return NextResponse.json({ok:true,removed:safe.length})}return NextResponse.json({ok:true,removed:await removeUnused(safe)})}catch(error){return userApiError(error,"upload-cleanup","请先登录")}}
export async function DELETE(request:NextRequest){try{await requireUser(request);if(remoteStorageEnabled())return NextResponse.json({ok:true,removed:0});return NextResponse.json({ok:true,removed:await cleanupExpiredUploads()})}catch(error){return userApiError(error,"upload-expired-cleanup","请先登录")}}
