import { NextResponse } from "next/server";
import { isAuthError } from "@/lib/auth";
import { reportServerError } from "@/lib/server-error";

export function userApiError(error: unknown, stage: string, authMessage = "登录已过期") {
  if (isAuthError(error)) return NextResponse.json({ error: authMessage }, { status: 401 });
  reportServerError(stage, error);
  return NextResponse.json({ error: "服务暂时不可用，请稍后重试" }, { status: 503 });
}

export function isAdminAuthError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return ["UNAUTHORIZED", "FORBIDDEN", "JWTExpired", "JWSSignatureVerificationFailed"].includes(error.message) || error.name === "JWTExpired" || error.name === "JWSSignatureVerificationFailed";
}

export function adminApiError(error: unknown, stage: string) {
  if (isAdminAuthError(error)) return NextResponse.json({ error: "管理员登录已过期" }, { status: 401 });
  reportServerError(stage, error);
  return NextResponse.json({ error: "后台服务暂时不可用" }, { status: 503 });
}
