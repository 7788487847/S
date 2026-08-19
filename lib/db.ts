// 数据库连接单例：发布环境连接平台托管 Postgres，开发沙箱使用 PGlite。
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { PGlite } from "@electric-sql/pglite";
import { mkdir, rename } from "node:fs/promises";
import * as schema from "@/db/schema";

type Db = ReturnType<typeof drizzleNodePg<typeof schema>>;
let dbPromise: Promise<Db> | undefined;

async function openLocalDatabase(dir: string): Promise<Db> {
  await mkdir(dir, { recursive: true });
  const client = new PGlite(dir);
  const db = drizzlePglite({ client, schema });
  await migratePglite(db, { migrationsFolder: "./drizzle" });
  return db as unknown as Db;
}

async function init(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url?.startsWith("postgres")) {
    return drizzleNodePg(url, { schema });
  }

  const dir = process.env.NODE_ENV === "production" ? "/data/pg" : "./data/pg";
  try {
    return await openLocalDatabase(dir);
  } catch (error) {
    // 开发沙箱可能因进程中断留下损坏的 WASM 数据文件。仅开发环境隔离坏库并
    // 重新执行版本化迁移；生产环境必须保留原数据并直接暴露错误，禁止自动清库。
    if (process.env.NODE_ENV === "production") throw error;
    const backup = `./data/pg-corrupt-${Date.now()}`;
    console.warn(`开发数据库无法打开，已隔离到 ${backup} 并重建。`, error);
    await rename(dir, backup).catch(() => undefined);
    return openLocalDatabase(dir);
  }
}

export function getDb(): Promise<Db> {
  dbPromise ??= init().catch((error) => {
    dbPromise = undefined;
    throw error;
  });
  return dbPromise;
}
