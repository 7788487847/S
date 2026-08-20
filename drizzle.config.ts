// 平台托管数据库层的 drizzle-kit 配置: 版本化迁移, 双驱动一份 schema。
// 纪律: schema 改动后执行 `pnpm exec drizzle-kit generate` 产出 drizzle/ 下的
// 版本化 SQL; 应用与发布只 **apply** 已生成的迁移 (开发沙箱由 lib/db.ts 的
// PGlite migrator 启动时自动补齐, 发布由平台按 compose 的 luffy.migrate 执行
// `drizzle-kit migrate`)。禁止 `drizzle-kit push` 打生产 —— push 是开发期
// sync, --force 会静默删列毁数据。
import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;
const useManagedPg = !!url && url.startsWith("postgres");

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./drizzle",
  ...(useManagedPg
    ? { dbCredentials: { url: url! } }
    : { driver: "pglite", dbCredentials: { url: "./data/pg/" } }),
});
