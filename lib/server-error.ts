type ErrorWithCode = { name?: unknown; code?: unknown };

export function reportServerError(stage: string, error: unknown) {
  const safe = error && typeof error === "object" ? error as ErrorWithCode : {};
  const name = typeof safe.name === "string" ? safe.name : "UnknownError";
  const code = typeof safe.code === "string" || typeof safe.code === "number" ? String(safe.code) : "unknown";
  process.stderr.write(`[server-error] stage=${stage} type=${name} code=${code}\n`);
}
