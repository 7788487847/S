import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

const types: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;
    if (!/^[a-zA-Z0-9.-]+$/.test(name)) return new NextResponse("Not found", { status: 404 });
    const configuredFolder = process.env.UPLOAD_DIR;
    const filePath = configuredFolder
      ? path.join(/* turbopackIgnore: true */ configuredFolder, name)
      : path.join(process.cwd(), "data", "uploads", name);
    const data = await readFile(filePath);
    const extension = name.split(".").pop()?.toLowerCase() || "";
    const download = request.nextUrl.searchParams.get("download") === "1";
    const headers: Record<string, string> = {
      "content-type": types[extension] || "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    };
    if (download) headers["content-disposition"] = `attachment; filename="${name.replace(/[^a-zA-Z0-9._-]/g, "")}"`;
    return new NextResponse(data, { headers });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
