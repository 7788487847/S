import { NextRequest, NextResponse } from "next/server";
import { createAdminJwt, validAdminCredentials } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!validAdminCredentials(String(username || ""), String(password || ""))) return NextResponse.json({ error: "管理员账号或密码错误" }, { status: 401 });
    return NextResponse.json({ token: await createAdminJwt() });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_PASSWORD_NOT_CONFIGURED") return NextResponse.json({ error: "管理员密码未配置" }, { status: 500 });
    return NextResponse.json({ error: "登录服务暂时不可用" }, { status: 500 });
  }
}
