import { NextRequest, NextResponse } from "next/server";
import { appendFileSync } from "node:fs";

const CLIENT_ERROR_LOG_PATH = "/tmp/client-errors.log";
const MAX_BODY_BYTES = 8 * 1024;
const WINDOW_MS = 10 * 60 * 1000;
const recent = new Map<string, number>();
interface ClientErrorBody { kind?: string; message?: string; stack?: string | null; location?: string; timestamp?: string }

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const raw = await req.text();
    const data = JSON.parse(raw.slice(0, MAX_BODY_BYTES)) as ClientErrorBody;
    const key = `${data.kind ?? "?"}|${data.location ?? "?"}|${data.message ?? "?"}`;
    const now = Date.now(), last = recent.get(key) || 0;
    if (now - last < WINDOW_MS) return new NextResponse(null, { status: 204 });
    recent.set(key, now);
    if (recent.size > 500) for (const [item, time] of recent) if (now - time > WINDOW_MS) recent.delete(item);
    const line = `[client-error] ${data.timestamp ?? new Date().toISOString()} kind=${data.kind ?? "?"} at=${data.location ?? "?"} | ${data.message ?? "(no message)"}${data.stack ? `\n${data.stack}` : ""}\n`;
    appendFileSync(CLIENT_ERROR_LOG_PATH, line);
  } catch {}
  return new NextResponse(null, { status: 204 });
}
