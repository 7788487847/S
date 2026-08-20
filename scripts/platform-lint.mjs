#!/usr/bin/env node
// 平台结构检查: eslint 管不到的"失败场景". 报错信息 = 为什么 + 怎么改.
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const errors = [];

// 1. 客户端错误自动上报三件套: 平台靠它把浏览器错误喂回 AI 自愈, 删了用户
//    就得自己贴报错截图. 缺失时必须还原文件并保持 layout.tsx 挂载.
for (const f of ["lib/error-reporter.tsx", "app/api/luffy-platform-error/route.ts"]) {
  if (!existsSync(f)) errors.push(`缺少平台文件 ${f}: error-reporter 三件套负责把浏览器错误自动上报给平台修复, 禁止删除, 请还原该文件`);
}
if (existsSync("app/layout.tsx") && !readFileSync("app/layout.tsx", "utf8").includes("<ErrorReporter")) {
  errors.push("app/layout.tsx 未挂载 <ErrorReporter />: 挂载后浏览器端报错才能自动回传平台, 请在 body 内加回 <ErrorReporter />");
}

// 2. 可变数据必须落 data/: data/ 之外的 SQLite 会被打进构建镜像, 发布时构建
//    阶段对着真库重放迁移, 撞 duplicate column / UNIQUE 冲突.
const hits = execSync(
  String.raw`find . -path ./data -prune -o -path ./node_modules -prune -o \( -name '*.db' -o -name '*.sqlite' -o -name '*.sqlite3' \) -print`,
  { encoding: "utf8" }).trim();
if (hits) errors.push(`数据文件放错位置: ${hits.split("\n").join(", ")}。SQLite/上传文件必须写在 data/ 下, 否则发布构建会撞迁移冲突; 请把文件移入 data/ 并让代码从 data/ 读写`);

// 3. 生产 start 必须是单一服务器启动命令: "node xxx.mjs && next start" 这种链式
//    start 在前置脚本非零退出时让服务器永不启动 → 容器崩溃循环 → 发布必败.
//    启动前检查放进应用运行时做非致命告警, 不许挡在 start 链上.
if (existsSync("package.json")) {
  const start = (JSON.parse(readFileSync("package.json", "utf8")).scripts ?? {}).start;
  if (typeof start === "string" && /&&|\|\||;/.test(start)) {
    errors.push(`scripts.start 是链式命令 (${start}): 前置脚本一旦退出服务器永不启动, 发布必然失败。start 只保留 "next start -H 0.0.0.0"; 启动前检查移入运行时代码做非致命告警`);
  }
}

// 4. 托管 Postgres 契约的机器强制纪律 (本模板无条件在约, 删 drizzle.config.ts
//    也逃不出) —— 不指望模型读文档, 报错文案自带为什么+怎么改, 发布预检同步复检:
//    a. journal 缺失/为空 = 改了 schema 忘了 generate, 线上必缺表;
//    b. drizzle-kit push 是开发期 sync, --force 会静默删列, 禁止进 scripts;
//    c. compose 必须保留 luffy.database/luffy.migrate 平台契约标签;
//    d. 禁止 better-sqlite3 回潮、绕过 lib/db.ts 自建连接、手写 DDL.
const grepHits = (pattern, extra = "") =>
  execSync(
    `grep -RInE --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' --include='*.cjs' ` +
    `--exclude-dir=node_modules --exclude-dir=.next --exclude-dir=data --exclude-dir=drizzle ${extra} ` +
    `-e ${JSON.stringify(pattern)} . || true`,
    { encoding: "utf8" }).trim();
if (!existsSync("drizzle.config.ts")) {
  errors.push("drizzle.config.ts 缺失: 平台托管 Postgres 依赖 drizzle 版本化迁移, 该文件是迁移工具的入口配置, 请还原");
} else {
  let entries = [];
  try { entries = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8")).entries ?? []; } catch { /* 缺失同空 */ }
  if (!entries.length) {
    errors.push("缺少版本化迁移: 改完 db/schema.ts 必须执行 pnpm exec drizzle-kit generate 并把 drizzle/ 一起保留, 否则发布后线上没有对应表");
  }
  if (existsSync("package.json")) {
    const scripts = JSON.parse(readFileSync("package.json", "utf8")).scripts ?? {};
    const bad = Object.entries(scripts).find(([, v]) => typeof v === "string" && v.includes("drizzle-kit push"));
    if (bad) errors.push(`scripts.${bad[0]} 使用了 drizzle-kit push: push 是开发期 sync, --force 会静默删列毁数据; 改用 generate(开发出迁移)+migrate(发布应用)`);
  }
  const composeText = existsSync("compose.yaml") ? readFileSync("compose.yaml", "utf8") : "";
  if (!/["']luffy\.database=postgres["']|luffy\.database:\s*["']?postgres/.test(composeText)) {
    errors.push("compose.yaml 缺少 luffy.database=postgres 平台契约标签: 缺了发布时不供托管库, 应用上线连不上数据库; 请还原该标签");
  }
  try {
    const svcs = JSON.parse(readFileSync("luffy.manifest.json", "utf8")).services ?? {};
    if (!Object.values(svcs).some((s) => typeof s?.migrate === "string" && s.migrate.trim())) {
      errors.push("luffy.manifest.json 缺少 migrate 命令位: 平台靠它在发布切换前执行数据库迁移, 请给 web 服务还原 \"migrate\": \"pnpm exec drizzle-kit migrate\"");
    }
  } catch { errors.push("luffy.manifest.json 缺失或非法, 无法确认 migrate 命令位"); }
  const sqliteHits = grepHits(String.raw`(from\s+["']better-sqlite3|require\(["']better-sqlite3)`);
  if (sqliteHits) errors.push(`托管数据库层禁止 better-sqlite3: ${sqliteHits.split("\n")[0]} 等。数据一律经 lib/db.ts 的 getDb() 走 Postgres`);
  const connHits = grepHits(String.raw`new\s+(PGlite|Pool)\s*\(`, "--exclude=db.ts");
  if (connHits) errors.push(`禁止绕过 lib/db.ts 自建数据库连接 (new Pool/new PGlite): ${connHits.split("\n")[0]} 等。统一 await getDb()`);
  const ddlHits = grepHits(String.raw`(CREATE|ALTER|DROP)\s+TABLE`);
  if (ddlHits) errors.push(`禁止手写 DDL SQL: ${ddlHits.split("\n")[0]} 等。表结构只写 db/schema.ts, 用 pnpm exec drizzle-kit generate 产出版本化迁移`);
}

if (errors.length) { console.log(errors.map((e) => `[platform-lint] ${e}`).join("\n")); process.exit(1); }
