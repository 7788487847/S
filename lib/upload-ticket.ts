import { SignJWT, jwtVerify } from "jose";
function key(){const secret=process.env.JWT_SECRET||(process.env.NODE_ENV==="production"?"":"dev-only-palette-secret-change-in-production");if(!secret)throw new Error("JWT_SECRET_NOT_CONFIGURED");return new TextEncoder().encode(secret)}
export async function createUploadTicket(userId:number,names:string[]){return new SignJWT({userId,names}).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("24h").sign(key())}
export async function verifyUploadTicket(ticket:string,userId:number){const{payload}=await jwtVerify(ticket,key());if(Number(payload.userId)!==userId||!Array.isArray(payload.names))throw new Error("INVALID_UPLOAD_TICKET");return payload.names.map(String)}
