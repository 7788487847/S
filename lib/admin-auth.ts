import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

function adminKey() {
  const secret = process.env.ADMIN_SECRET || process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev-admin-secret-change-me");
  if (!secret) throw new Error("ADMIN_SECRET_NOT_CONFIGURED");
  return new TextEncoder().encode(secret);
}
export function validAdminCredentials(username: string, password: string) {
  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? "" : "admin");
  if (!expectedPassword) throw new Error("ADMIN_PASSWORD_NOT_CONFIGURED");
  return username === expectedUser && password === expectedPassword;
}
export async function createAdminJwt() { return new SignJWT({ role: "admin" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("12h").sign(adminKey()); }
export async function requireAdmin(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("UNAUTHORIZED");
  const { payload } = await jwtVerify(token, adminKey());
  if (payload.role !== "admin") throw new Error("FORBIDDEN");
}
