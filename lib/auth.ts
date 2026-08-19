import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

export class AuthError extends Error { constructor(message = "UNAUTHORIZED") { super(message); this.name = "AuthError"; } }
export function isAuthError(error: unknown) { return error instanceof AuthError || (error instanceof Error && ["UNAUTHORIZED", "FORBIDDEN", "JWTExpired", "JWSSignatureVerificationFailed"].includes(error.message)); }
function jwtKey() {
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev-only-palette-secret-change-in-production");
  if (!secret) throw new Error("JWT_SECRET_NOT_CONFIGURED");
  return new TextEncoder().encode(secret);
}
export type AuthUser = { userId: number; email: string };
export async function createJwt(user: AuthUser) { return new SignJWT(user).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(jwtKey()); }
export async function verifyJwt(token: string): Promise<AuthUser> {
  try { const { payload } = await jwtVerify(token, jwtKey()); return { userId: Number(payload.userId), email: String(payload.email) }; }
  catch (error) { if (error instanceof Error && error.message === "JWT_SECRET_NOT_CONFIGURED") throw error; throw new AuthError(); }
}
export async function requireUser(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new AuthError();
  return verifyJwt(token);
}
